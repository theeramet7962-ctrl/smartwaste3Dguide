import { GoogleGenAI, Type } from '@google/genai';

interface RequestLike {
  method?: string;
  body?: any;
  on?: (event: string, callback: (...args: any[]) => void) => any;
}

interface ResponseLike {
  status?: (code: number) => {
    json: (data: any) => any;
    end: () => any;
  };
  statusCode?: number;
  setHeader?: (name: string, value: string) => any;
  end?: (data?: any) => any;
  json?: (data: any) => any;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 60,
};

// Helper to safely send JSON response in any Node/Vercel/Express environment
function sendResponse(res: any, status: number, data: any) {
  try {
    res.setHeader?.('Access-Control-Allow-Credentials', 'true');
    res.setHeader?.('Access-Control-Allow-Origin', '*');
    res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader?.(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  } catch {}

  if (typeof res.status === 'function') {
    return res.status(status).json(data);
  }
  if (typeof res.json === 'function') {
    res.statusCode = status;
    return res.json(data);
  }
  res.statusCode = status;
  res.setHeader?.('Content-Type', 'application/json');
  return res.end?.(JSON.stringify(data));
}

// Helper to parse body safely from JSON, string, or stream
async function parseRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  if (typeof req.on === 'function') {
    return new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk: any) => {
        data += chunk;
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
      req.on('error', () => resolve({}));
    });
  }

  return {};
}

// Helper for friendly Thai error messages
const formatThaiErrorMessage = (err: any): string => {
  if (!err) return 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง';
  const raw = err.message || String(err);
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (
        parsed?.error?.code === 503 ||
        parsed?.error?.status === 'UNAVAILABLE' ||
        parsed?.error?.message?.includes('high demand')
      ) {
        return 'ขณะนี้ระบบ AI มีผู้ใช้งานจำนวนมากชั่วคราว (High Demand) กรุณากดปุ่มลองใหม่อีกครั้ง';
      }
      if (parsed?.error?.code === 429 || parsed?.error?.status === 'RESOURCE_EXHAUSTED') {
        return 'โควตาการเรียกใช้งานระบบชั่วคราวหนาแน่น กรุณารอสักครู่แล้วลองใหม่';
      }
      if (parsed?.error?.message) {
        return `ระบบ AI ขัดข้อง: ${parsed.error.message}`;
      }
    }
  } catch {}

  if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
    return 'ขณะนี้ระบบ AI มีผู้ใช้งานจำนวนมากชั่วคราว (High Demand) กรุณากดปุ่มลองใหม่อีกครั้ง';
  }

  if (raw.includes('GEMINI_API_KEY') || raw.includes('API key not valid') || raw.includes('API_KEY_INVALID')) {
    return 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY: หากใช้บน Vercel ให้ไปที่ Project Settings > Environment Variables แล้วเพิ่ม GEMINI_API_KEY';
  }

  return raw;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    try {
      res.setHeader?.('Access-Control-Allow-Origin', '*');
      res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader?.(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
      );
    } catch {}
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    if (res.statusCode) res.statusCode = 200;
    return res.end?.();
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const { image, userPrompt } = body || {};
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return sendResponse(res, 500, {
        success: false,
        error:
          'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ: หากใช้งานบน Vercel ให้ไปที่เมนู Project Settings > Environment Variables แล้วเพิ่มคีย์ GEMINI_API_KEY',
      });
    }

    if (!image) {
      return sendResponse(res, 400, { success: false, error: 'โปรดระบุรูปภาพเพื่อทำการวิเคราะห์' });
    }

    let base64Data = image;
    let mimeType = 'image/jpeg';

    if (image.startsWith('http://') || image.startsWith('https://')) {
      const imageRes = await fetch(image);
      const arrayBuffer = await imageRes.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
      mimeType = imageRes.headers.get('content-type') || 'image/jpeg';
    } else if (image.includes(';base64,')) {
      const parts = image.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `คุณคือวิศวกรสิ่งแวดล้อมและผู้เชี่ยวชาญด้านระบบการคัดแยกขยะ อิงตามมาตรฐานคู่มือการคัดแยกขยะมูลฝอย 4 สีของ "กรมควบคุมมลพิษ (คพ.) กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม" ร่วมกับข้อมูลวิชาการจาก "องค์การบริหารจัดการก๊าซเรือนกระจก (อบก.)" และเกณฑ์ราคารับซื้อของเก่าตลาดไทย (สมาคมซาเล้งและร้านรับซื้อของเก่า/วงษ์พาณิชย์)

กฎเหล็กในการตรวจจับวัตถุและวิเคราะห์ภาพถ่าย:
1. ตรวจจับสิ่งของ วัตถุ บรรจุภัณฑ์ อาหาร หรืออุปกรณ์ที่ปรากฏในภาพถ่ายอย่างแม่นยำเสมอ โดยเฉพาะสิ่งที่อยู่บริเวณกึ่งกลางภาพหรือที่ผู้ใช้กำลังถืออยู่
2. ห้ามปฏิเสธหรือตอบว่า "ไม่พบขยะ" / "ไม่พบวัตถุ" เด็ดขาด! ไม่ว่าสิ่งนั้นจะเป็นขวดน้ำดื่ม แก้วกาแฟ ถุงพลาสติก ซองขนม กล่องพัสดุ กระป๋อง ปากกา สมุด เสื้อผ้า อาหาร ผลไม้ โทรศัพท์มือถือ สายชาร์จ หรือของใช้ประจำวัน ให้ระบุชื่อวัตถุนั้นตามจริง และแนะนำขั้นตอนการคัดแยกทิ้งลงถัง 4 สีเมื่อกลายเป็นขยะ
3. หากในภาพมีหลายวัตถุหรือมีฉากหลัง ให้เลือกวัตถุที่เป็นจุดสนใจหลัก (Focus) หรืออยู่ตรงกลางเฟรมที่สุด
4. หากภาพถ่ายมัว แสงน้อย หรือมีแสงสะท้อน ให้วิเคราะห์จากรูปทรง สี และเนื้อวัสดุที่น่าจะเป็นไปได้มากที่สุด แล้วแนะนำถังขยะที่ถูกต้องและปลอดภัยที่สุด
5. หมวดหมู่ถังขยะมาตรฐานประเทศไทย 4 สี (กรมควบคุมมลพิษ):
   - recyclable (ขยะรีไซเคิล): สีเหลือง (#EAB308) เช่น ขวดพลาสติก PET/HDPE, กระป๋องอลูมิเนียม/โลหะ, กล่องกระดาษ, ขวดแก้ว
   - organic (ขยะอินทรีย์ / ขยะย่อยสลาย): สีเขียว (#16A34A) เช่น เศษอาหาร, เปลือกผลไม้, เศษผัก, เศษใบไม้, ซากพืช
   - general (ขยะทั่วไป): สีน้ำเงิน (#2563EB) เช่น ถุงพลาสติกเปื้อนอาหาร, ซองขนมขบเคี้ยว, ซองบะหมี่, กล่องโฟมเปื้อน, ทิชชู่ใช้แล้ว
   - hazardous (ขยะอันตราย): สีส้ม/สีแดง (#DC2626) เช่น ถ่านไฟฉาย, หลอดไฟ, กระป๋องสเปรย์, สารเคมี, แบตเตอรี่ รวมถึงขยะอิเล็กทรอนิกส์ (E-Waste) ทุกชนิด
6. ข้อห้ามเด็ดขาด: ห้ามเอ่ยถึงชื่อ AI หรือโมเดลใดๆ เช่น Gemini ในคำตอบ ให้ตอบในฐานะระบบผู้เชี่ยวชาญสิ่งแวดล้อม และอ้างอิงมาตรฐานจากกรมควบคุมมลพิษ (คพ.) เสมอ`;

    const prompt = userPrompt
      ? `ตรวจจับวัตถุในภาพนี้อย่างละเอียด และตอบคำถามเพิ่มเติม: "${userPrompt}"`
      : 'ตรวจจับและระบุชนิดวัตถุ บรรจุภัณฑ์ หรือสิ่งของที่เด่นชัดที่สุดในภาพนี้ บอกประเภทถังขยะตามมาตรฐาน 4 สีของกรมควบคุมมลพิษ (เขียว/เหลือง/น้ำเงิน/ส้ม-แดง) พร้อมขั้นตอนการแยกชิ้นส่วนย่อย การล้างทำความสะอาด การคำนวณลดก๊าซคาร์บอน CO2 และไอเดีย DIY';

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let response: any = null;
    let lastError: any = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
          properties: {
            itemName: {
              type: Type.STRING,
              description: 'ชื่อวัตถุหรือขยะที่พบในภาพ เช่น ขวดน้ำดื่มพลาสติก PET พร้อมฝาและฉลาก',
            },
            categoryKey: {
              type: Type.STRING,
              description: 'รหัสหมวดหมู่หลัก 4 สีมาตรฐาน: recyclable, organic, general, hazardous',
            },
            categoryName: {
              type: Type.STRING,
              description: 'ชื่อหมวดหมู่ภาษาไทย: ขยะรีไซเคิล, ขยะอินทรีย์, ขยะทั่วไป, ขยะอันตราย',
            },
            binColor: {
              type: Type.STRING,
              description: 'สีถังขยะตามมาตรฐานไทย 4 สี เช่น ถังสีเหลือง, ถังสีเขียว, ถังสีน้ำเงิน, ถังสีส้ม/แดง',
            },
            binHexColor: {
              type: Type.STRING,
              description: 'รหัสสี Hex code: #EAB308 (เหลือง), #16A34A (เขียว), #2563EB (น้ำเงิน), #DC2626 (ส้ม/แดง)',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'ระดับความมั่นใจ 0-100',
            },
            material: {
              type: Type.STRING,
              description: 'ชนิดของวัสดุหลัก เช่น พลาสติก PET เบอร์ 1, อลูมิเนียม, แก้วโซดาไลม์',
            },
            recyclableValue: {
              type: Type.STRING,
              description: 'ราคาประเมินการขายต่อกิโลกรัมหรือต่อชิ้น',
            },
            co2SavedKg: {
              type: Type.NUMBER,
              description: 'ปริมาณการลด CO2 เมื่อจัดการถูกวิธี (kg CO2e)',
            },
            subComponents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  partName: { type: Type.STRING, description: 'ชื่อชิ้นส่วน เช่น ตัวขวด, ฝาขวด, ฉลากพลาสติก' },
                  binColor: { type: Type.STRING, description: 'ถังขยะที่ต้องทิ้ง เช่น ถังสีเหลือง, ถังสีน้ำเงิน' },
                  instruction: { type: Type.STRING, description: 'วิธีแยก เช่น บิดฝาออกทิ้งแยกถัง, แกะฉลากออก' },
                },
                required: ['partName', 'binColor', 'instruction'],
              },
              description: 'การแยกชิ้นส่วนย่อยของขยะชิ้นนั้น',
            },
            sortingSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'ขั้นตอนการจัดการเตรียมขยะก่อนทิ้งทีละขั้นตอน',
            },
            environmentalImpact: {
              type: Type.STRING,
              description: 'ระยะเวลาย่อยสลาย และผลกระทบต่อระบบนิเวศ',
            },
            ecoPoints: {
              type: Type.NUMBER,
              description: 'คะแนนแต้มรักษ์โลก 10-50 แต้ม',
            },
            creativeUpcyclingTip: {
              type: Type.STRING,
              description: 'ไอเดียประดิษฐ์ D.I.Y. หรือนำกลับมาใช้ประโยชน์ใหม่',
            },
            warningNote: {
              type: Type.STRING,
              description: 'คำเตือนความปลอดภัยถ้ามี เช่น วัตถุไวไฟ สารพิษ',
            },
          },
          required: [
            'itemName',
            'categoryKey',
            'categoryName',
            'binColor',
            'binHexColor',
            'confidence',
            'material',
            'sortingSteps',
            'environmentalImpact',
            'ecoPoints',
          ],
        },
      },
    });
        break;
      } catch (err: any) {
        lastError = err;
        if (i < modelsToTry.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
      }
    }

    if (!response) {
      throw lastError || new Error('ไม่สามารถเชื่อมต่อระบบวิเคราะห์ AI ได้');
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error('ไม่ได้รับข้อมูลการวิเคราะห์จากระบบ AI กรุณาลองใหม่อีกครั้ง');
    }

    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const result = JSON.parse(cleaned);

    if (!result.categoryKey || !['recyclable', 'organic', 'general', 'hazardous'].includes(result.categoryKey)) {
      const textToMatch = `${result.categoryName || ''} ${result.binColor || ''} ${result.itemName || ''}`.toLowerCase();
      if (textToMatch.includes('รีไซเคิล') || textToMatch.includes('เหลือง')) {
        result.categoryKey = 'recyclable';
        result.binColor = result.binColor || 'ถังสีเหลือง';
        result.categoryName = result.categoryName || 'ขยะรีไซเคิล';
      } else if (textToMatch.includes('อินทรีย์') || textToMatch.includes('เขียว')) {
        result.categoryKey = 'organic';
        result.binColor = result.binColor || 'ถังสีเขียว';
        result.categoryName = result.categoryName || 'ขยะอินทรีย์';
      } else if (textToMatch.includes('อันตราย') || textToMatch.includes('แดง') || textToMatch.includes('ส้ม')) {
        result.categoryKey = 'hazardous';
        result.binColor = result.binColor || 'ถังสีส้ม/แดง';
        result.categoryName = result.categoryName || 'ขยะอันตราย';
      } else {
        result.categoryKey = 'general';
        result.binColor = result.binColor || 'ถังสีน้ำเงิน';
        result.categoryName = result.categoryName || 'ขยะทั่วไป';
      }
    }

    const standardHex: Record<string, string> = {
      recyclable: '#EAB308',
      organic: '#16A34A',
      general: '#2563EB',
      hazardous: '#DC2626',
    };
    result.binHexColor = standardHex[result.categoryKey] || '#2563EB';

    return sendResponse(res, 200, { success: true, data: result });
  } catch (error: any) {
    console.error('Error analyzing waste image:', error);
    return sendResponse(res, 500, {
      success: false,
      error: formatThaiErrorMessage(error),
    });
  }
}


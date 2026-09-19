import { GoogleGenAI, Type } from '@google/genai';
import { WasteAnalysisResult } from '../types';

export async function analyzeWasteClientFallback(
  imageDataUrl: string,
  userPrompt?: string
): Promise<WasteAnalysisResult> {
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ไม่พบ API Key ในระบบ: หากรันบน Vercel กรุณาตั้งค่า GEMINI_API_KEY ใน Vercel Project Settings > Environment Variables'
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let base64Data = imageDataUrl;
  let mimeType = 'image/jpeg';

  if (imageDataUrl.includes(';base64,')) {
    const parts = imageDataUrl.split(';base64,');
    mimeType = parts[0].replace('data:', '');
    base64Data = parts[1];
  }

  const systemInstruction = `คุณคือวิศวกรสิ่งแวดล้อมและผู้เชี่ยวชาญด้านระบบการคัดแยกขยะ อิงตามมาตรฐานคู่มือการคัดแยกขยะมูลฝอย 4 สีของ "กรมควบคุมมลพิษ (คพ.) กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม" ร่วมกับข้อมูลวิชาการจาก "องค์การบริหารจัดการก๊าซเรือนกระจก (อบก.)" และเกณฑ์ราคารับซื้อของเก่าตลาดไทย

กฎเหล็ก:
1. ตรวจจับสิ่งของ วัตถุ บรรจุภัณฑ์ อาหาร หรืออุปกรณ์ที่ปรากฏในภาพถ่ายอย่างแม่นยำเสมอ
2. ห้ามตอบว่าไม่พบวัตถุเด็ดขาด ให้ระบุชื่อวัตถุตามจริง และแนะนำการแยกทิ้งลงถัง 4 สี
3. หมวดหมู่ถังขยะ 4 สีมาตรฐานไทย:
   - recyclable (ขยะรีไซเคิล): สีเหลือง (#EAB308)
   - organic (ขยะอินทรีย์): สีเขียว (#16A34A)
   - general (ขยะทั่วไป): สีน้ำเงิน (#2563EB)
   - hazardous (ขยะอันตราย): สีส้ม/สีแดง (#DC2626)`;

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
              itemName: { type: Type.STRING },
              categoryKey: { type: Type.STRING },
              categoryName: { type: Type.STRING },
              binColor: { type: Type.STRING },
              binHexColor: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              material: { type: Type.STRING },
              recyclableValue: { type: Type.STRING },
              co2SavedKg: { type: Type.NUMBER },
              subComponents: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    partName: { type: Type.STRING },
                    binColor: { type: Type.STRING },
                    instruction: { type: Type.STRING },
                  },
                  required: ['partName', 'binColor', 'instruction'],
                },
              },
              sortingSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              environmentalImpact: { type: Type.STRING },
              ecoPoints: { type: Type.NUMBER },
              creativeUpcyclingTip: { type: Type.STRING },
              warningNote: { type: Type.STRING },
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

  if (!response || !response.text) {
    throw lastError || new Error('ไม่ได้รับข้อมูลผลการวิเคราะห์จากระบบ');
  }

  let cleaned = response.text.trim();
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

  return result as WasteAnalysisResult;
}

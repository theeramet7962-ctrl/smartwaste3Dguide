import { RecyclePriceItem } from '../types';

export const RECYCLING_PRICES: RecyclePriceItem[] = [
  {
    id: 'pet-bottle',
    name: 'ขวดพลาสติกใส PET (ขวดน้ำดื่ม)',
    category: 'พลาสติก (Plastics)',
    pricePerKg: 11.5,
    unit: 'บาท/กก.',
    notes: 'ล้างสะอาด แกะฉลาก และเหยียบให้แบน ได้ราคาสูงสุด',
    trend: 'up',
    icon: 'Bottle',
  },
  {
    id: 'alu-can',
    name: 'กระป๋องเครื่องดื่มอลูมิเนียม',
    category: 'โลหะมีค่า (Aluminium)',
    pricePerKg: 42.0,
    unit: 'บาท/กก.',
    notes: 'น้ำหนักเบา รีไซเคิลได้ 100% ไม่จำกัดจำนวนครั้ง',
    trend: 'up',
    icon: 'Coffee',
  },
  {
    id: 'hdpe-bottle',
    name: 'พลาสติกขุ่น HDPE (ขวดนม/แกลลอน)',
    category: 'พลาสติก (Plastics)',
    pricePerKg: 14.0,
    unit: 'บาท/กก.',
    notes: 'รวมขวดน้ำยาซักผ้า ขวดแชมพูที่ล้างเกลี้ยง',
    trend: 'stable',
    icon: 'Package',
  },
  {
    id: 'cardboard-box',
    name: 'กล่องกระดาษลูกฟูก / กล่องพัสดุ',
    category: 'กระดาษ (Paper)',
    pricePerKg: 3.8,
    unit: 'บาท/กก.',
    notes: 'แกะเทปกาวใสออก พับให้แบน มัดเป็นตั้ง',
    trend: 'stable',
    icon: 'Box',
  },
  {
    id: 'white-paper',
    name: 'กระดาษขาวดำ A4 / หนังสือพิมพ์',
    category: 'กระดาษ (Paper)',
    pricePerKg: 5.5,
    unit: 'บาท/กก.',
    notes: 'แยกคลิปหนีบกระดาษและแม็กซ์ออกก่อนชั่ง',
    trend: 'down',
    icon: 'FileText',
  },
  {
    id: 'glass-bottle',
    name: 'ขวดแก้วใส / ขวดเบียร์แก้วสีชา',
    category: 'แก้ว (Glass)',
    pricePerKg: 1.8,
    unit: 'บาท/กก.',
    notes: 'ระวังแตก หากเป็นขวดสมบูรณ์อาจขายต่อขวดได้ 1-2 บาท',
    trend: 'stable',
    icon: 'Wine',
  },
  {
    id: 'copper',
    name: 'สายไฟทองแดง / ท่อทองแดง',
    category: 'โลหะทองแดง (Copper)',
    pricePerKg: 240.0,
    unit: 'บาท/กก.',
    notes: 'ปอกเปลือกแล้วราคาจะสูงกว่าสายไฟไม่ปอก 30-40%',
    trend: 'up',
    icon: 'Zap',
  },
  {
    id: 'scrap-iron',
    name: 'เศษเหล็กหนา / เหล็กโครงสร้าง',
    category: 'เหล็ก (Steel/Iron)',
    pricePerKg: 9.5,
    unit: 'บาท/กก.',
    notes: 'เหล็กหนาได้ราคาสูงกว่าสังกะสีและเหล็กบาง',
    trend: 'stable',
    icon: 'Layers',
  },
];

export interface OfficialSource {
  name: string;
  department: string;
  role: string;
  url: string;
  badge: string;
}

export const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    name: 'กรมควบคุมมลพิษ (คพ.)',
    department: 'กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม',
    role: 'มาตรฐานการคัดแยกขยะมูลฝอย 4 สี ประจำประเทศไทย',
    url: 'https://www.pcd.go.th',
    badge: 'มาตรฐานหลัก คพ.',
  },
  {
    name: 'องค์การบริหารจัดการก๊าซเรือนกระจก (อบก. TGO)',
    department: 'องค์การมหาชน',
    role: 'ดัชนีคำนวณการลดก๊าซเรือนกระจก (CO2 Emission Factor)',
    url: 'http://www.tgo.or.th',
    badge: 'ดัชนีคาร์บอน TGO',
  },
  {
    name: 'สมาคมซาเล้งและร้านรับซื้อของเก่า & วงษ์พาณิชย์',
    department: 'เครือข่ายรีไซเคิลและเศรษฐกิจหมุนเวียนไทย',
    role: 'ฐานข้อมูลและราคาเฉลี่ยรับซื้อขยะรีไซเคิลในประเทศ',
    url: 'https://www.wongpanit.com',
    badge: 'ราคาตลาดรีไซเคิล',
  },
  {
    name: 'สำนักสิ่งแวดล้อม กรุงเทพมหานคร',
    department: 'กรุงเทพมหานคร (BMA)',
    role: 'แนวทางคัดแยกขยะต้นทางและมาตรการไม่เทรวม',
    url: 'https://webportal.bangkok.go.th/environment',
    badge: 'คู่มือท้องถิ่น BMA',
  },
];


import React, { useState } from 'react';
import { ScanHistoryItem } from '../types';
import { Trash2, Calendar, ExternalLink, FileText, Sparkles, Leaf } from 'lucide-react';

interface HistoryLogProps {
  history: ScanHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
  onSelectScan: (item: ScanHistoryItem) => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  history,
  onDeleteHistoryItem,
  onClearAllHistory,
  onSelectScan,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredHistory = history.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.result.categoryKey === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Stats Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                ประวัติการสแกนและบันทึกขยะ
              </span>
            </div>
            <h2 className="text-2xl font-black">รายการขยะที่คุณบันทึกไว้</h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              ตรวจสอบประวัติและคำแนะนำขั้นตอนการคัดแยกขยะย้อนหลังได้ตลอดเวลา
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
              <span className="text-[10px] text-emerald-300 block uppercase font-medium">บันทึกทั้งหมด</span>
              <span className="text-xl font-black">{history.length} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Clear Controls */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({history.length})
            </button>
            <button
              onClick={() => setSelectedFilter('recyclable')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                selectedFilter === 'recyclable'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              รีไซเคิล
            </button>
            <button
              onClick={() => setSelectedFilter('organic')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                selectedFilter === 'organic'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ขยะอินทรีย์
            </button>
            <button
              onClick={() => setSelectedFilter('general')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                selectedFilter === 'general'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ขยะทั่วไป
            </button>
            <button
              onClick={() => setSelectedFilter('hazardous')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                selectedFilter === 'hazardous'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ขยะอันตราย
            </button>
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearAllHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างประวัติทั้งหมด</span>
            </button>
          )}
        </div>
      </div>

      {/* History Cards Grid */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">ยังไม่มีประวัติการสแกน</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            ถ่ายรูปหรือเลือกรูปภาพขยะในหน้าหลักเพื่อเริ่มต้นวิเคราะห์และบันทึกประวัติการคัดแยกขยะ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Image & Category Overlay */}
              <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                <img
                  src={item.imageDataUrl}
                  alt={item.result.itemName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: item.result.binHexColor }}
                  >
                    {item.result.binColor}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteHistoryItem(item.id)}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-rose-600 text-white p-1.5 rounded-full transition-colors cursor-pointer"
                  title="ลบรายการนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {item.result.co2SavedKg && (
                      <span className="font-bold text-teal-700 flex items-center gap-1">
                        <Leaf className="w-3 h-3" /> -{item.result.co2SavedKg} kg CO₂
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                    {item.result.itemName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-0.5">
                    {item.result.material}
                  </p>
                </div>

                <button
                  onClick={() => onSelectScan(item)}
                  className="mt-3 w-full py-2 bg-slate-50 hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>ดูวิธีคัดแยกละเอียด</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

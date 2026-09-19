import React, { useState, useMemo } from 'react';
import { THAI_BIN_CATEGORIES } from '../data/binGuide';
import { OFFICIAL_SOURCES } from '../data/extraEcoData';
import { Search, Trash2, CheckCircle, XCircle, Info, Recycle, Leaf, AlertTriangle, Smartphone, ExternalLink, ShieldCheck } from 'lucide-react';
import { WasteCategoryKey } from '../types';

export const BinGuideView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Icons map
  const getCategoryIcon = (key: WasteCategoryKey) => {
    switch (key) {
      case 'recyclable':
        return <Recycle className="w-6 h-6 text-yellow-600" />;
      case 'organic':
        return <Leaf className="w-6 h-6 text-green-600" />;
      case 'general':
        return <Trash2 className="w-6 h-6 text-blue-600" />;
      case 'hazardous':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'ewaste':
        return <Smartphone className="w-6 h-6 text-purple-600" />;
      default:
        return <Trash2 className="w-6 h-6 text-slate-600" />;
    }
  };

  // Filter Categories & Items based on search
  const filteredCategories = useMemo(() => {
    return THAI_BIN_CATEGORIES.filter((cat) => {
      // Category tab filter
      if (selectedCategory !== 'all' && cat.key !== selectedCategory) {
        return false;
      }

      // Text search filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();
      const matchName = cat.name.toLowerCase().includes(term);
      const matchBin = cat.binColorName.toLowerCase().includes(term);
      const matchAccepted = cat.acceptedItems.some((item) =>
        item.toLowerCase().includes(term)
      );
      const matchProhibited = cat.prohibitedItems.some((item) =>
        item.toLowerCase().includes(term)
      );

      return matchName || matchBin || matchAccepted || matchProhibited;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              มาตรฐานทางการ: กรมควบคุมมลพิษ (คพ.)
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              คู่มือจำแนกถังขยะมาตรฐานประเทศไทย 4 สี
            </h2>
            <p className="text-xs text-slate-500">
              ค้นหาวัตถุหรือดูวิธีแยกขยะลงถังสีที่ถูกต้องตามเกณฑ์กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม
            </p>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาวัตถุ เช่น หลอด, โฟม, ถุงแกง..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด (4 ประเภทมาตรฐาน คพ.)
          </button>
          {THAI_BIN_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.binColorName} ({cat.name})
            </button>
          ))}
        </div>
      </div>

      {/* Categories Cards List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">ไม่พบข้อมูลที่ค้นหา</h3>
            <p className="text-xs text-slate-500 mt-1">
              ลองค้นหาด้วยคำอื่น เช่น "พลาสติก", "ขวด", "กระดาษ" หรือ "อาหาร"
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat.key}
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Category Top Banner */}
              <div
                className="p-5 flex items-center justify-between border-b"
                style={{
                  backgroundColor: `${cat.hexColor}10`,
                  borderColor: `${cat.hexColor}30`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
                    style={{ backgroundColor: `${cat.hexColor}20` }}
                  >
                    {getCategoryIcon(cat.key)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: cat.hexColor }}
                      >
                        {cat.binColorName}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{cat.description}</p>
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Accepted Items */}
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>ขยะที่ควรทิ้งลงถังนี้ (Accepted Items):</span>
                  </div>
                  <ul className="space-y-1.5">
                    {cat.acceptedItems.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prohibited Items */}
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>ข้อห้าม / ไม่ควรทิ้งลงถังนี้ (Prohibited):</span>
                  </div>
                  <ul className="space-y-1.5">
                    {cat.prohibitedItems.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Handling Tip Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>ข้อแนะนำ:</strong> {cat.tips}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Official Thai Environmental Standards & Sources Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md border border-slate-700">
        <div className="flex items-center gap-2.5 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            แหล่งข้อมูลอ้างอิงและมาตรฐานหลักการคัดแยกขยะ
          </h3>
        </div>
        <p className="text-xs text-slate-300 mb-5 leading-relaxed max-w-2xl">
          ระบบ SMART WASTE 3D GUIDE ใช้เกณฑ์อ้างอิงและสูตรประเมินจากหน่วยงานภาครัฐและเครือข่ายรีไซเคิลของประเทศไทย เพื่อความถูกต้องและสอดคล้องกับระเบียบการจัดการขยะมูลฝอยชุมชน
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {OFFICIAL_SOURCES.map((source, idx) => (
            <div
              key={idx}
              className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-emerald-400">
                  {source.badge}
                </span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="เปิดเว็บไซต์หน่วยงาน"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <h4 className="text-sm font-bold text-white mb-0.5">{source.name}</h4>
              <p className="text-[11px] text-slate-400 font-medium mb-1.5">{source.department}</p>
              <p className="text-xs text-slate-300 leading-normal">{source.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

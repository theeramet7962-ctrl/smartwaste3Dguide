import React, { useState } from 'react';
import { RECYCLING_PRICES } from '../data/extraEcoData';
import { RecyclePriceItem } from '../types';
import { sound } from '../utils/audio';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Coins,
  Leaf,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CartItem {
  item: RecyclePriceItem;
  quantityKg: number;
}

export const RecycleCalculator: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(RECYCLING_PRICES[0].id);
  const [weightKg, setWeightKg] = useState<number>(5);
  const [cart, setCart] = useState<CartItem[]>([
    { item: RECYCLING_PRICES[0], quantityKg: 3 }, // 3 kg PET bottle
    { item: RECYCLING_PRICES[1], quantityKg: 1 }, // 1 kg Can
    { item: RECYCLING_PRICES[3], quantityKg: 8 }, // 8 kg Cardboard
  ]);

  const selectedItem = RECYCLING_PRICES.find((p) => p.id === selectedId) || RECYCLING_PRICES[0];

  const handleAddItem = () => {
    if (weightKg <= 0) return;
    sound.playPop();
    setCart((prev) => {
      const existingIdx = prev.findIndex((c) => c.item.id === selectedItem.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantityKg += weightKg;
        return next;
      }
      return [...prev, { item: selectedItem, quantityKg: weightKg }];
    });
  };

  const handleRemoveItem = (id: string) => {
    sound.playPop();
    setCart((prev) => prev.filter((c) => c.item.id !== id));
  };

  const handleUpdateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.item.id === id ? { ...c, quantityKg: Math.round(newQty * 10) / 10 } : c))
    );
  };

  // Calculations
  const totalRevenue = cart.reduce((sum, item) => sum + item.quantityKg * item.item.pricePerKg, 0);
  const totalWeight = cart.reduce((sum, item) => sum + item.quantityKg, 0);
  const totalCo2Saved = Math.round(totalWeight * 1.45 * 100) / 100; // Est. 1.45 kg CO2e per kg recycled

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Calculator className="w-3.5 h-3.5" /> เครื่องคำนวณมูลค่าขยะรีไซเคิล
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            เปลี่ยนขยะในบ้านให้เป็นเงิน & กู้โลก
          </h2>
          <p className="text-sm text-emerald-100/80 leading-relaxed">
            อิงตามฐานข้อมูลราคารับซื้อของเก่าเฉลี่ยในประเทศไทย พร้อมประเมินยอดเงินที่คุณจะได้รับ และปริมาณคาร์บอนที่ลดลง
          </p>
        </div>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-emerald-700/50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-emerald-200 block mb-1">มูลค่ารวมประเมิน</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-amber-300">฿{totalRevenue.toFixed(2)}</span>
              <span className="text-xs text-emerald-200">บาท</span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-emerald-200 block mb-1">น้ำหนักขยะรีไซเคิลรวม</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">{totalWeight.toFixed(1)}</span>
              <span className="text-xs text-emerald-200">กิโลกรัม</span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-emerald-200 block mb-1">ลดการปล่อย CO₂</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-300">-{totalCo2Saved}</span>
              <span className="text-xs text-emerald-200">kg CO₂e</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Price catalog & Quick Add */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add Item Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-emerald-600" />
              เพิ่มรายการขยะเพื่อคำนวณ
            </h3>

            {/* Select Material */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  เลือกประเภทขยะรีไซเคิล:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {RECYCLING_PRICES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedId === item.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs truncate">{item.name.split(' (')[0]}</div>
                      <div className="text-[11px] text-emerald-700 font-bold mt-1">
                        ฿{item.pricePerKg} / กก.
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Adjustment */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-700">{selectedItem.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ราคารับซื้อ: <span className="font-bold text-emerald-600">฿{selectedItem.pricePerKg}</span> {selectedItem.unit}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setWeightKg((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                      className="w-16 text-center font-bold text-slate-800 text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 pr-2">กก.</span>
                    <button
                      type="button"
                      onClick={() => setWeightKg((prev) => prev + 1)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" /> เพิ่ม
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Price Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                ตารางราคารับซื้อของเก่าในไทย (อ้างอิง)
              </h3>
              <span className="text-xs text-slate-400">อัปเดตรายสัปดาห์</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">รายการขยะ</th>
                    <th className="pb-2.5">หมวดหมู่</th>
                    <th className="pb-2.5 text-right">ราคาเฉลี่ย</th>
                    <th className="pb-2.5 text-center">แนวโน้ม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RECYCLING_PRICES.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-medium text-slate-800 pr-2">
                        {item.name}
                        <div className="text-[10px] text-slate-400 font-normal">{item.notes}</div>
                      </td>
                      <td className="py-3 text-slate-500">{item.category}</td>
                      <td className="py-3 text-right font-bold text-emerald-700">
                        ฿{item.pricePerKg.toFixed(1)} / กก.
                      </td>
                      <td className="py-3 text-center">
                        {item.trend === 'up' && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold text-[10px]">
                            <TrendingUp className="w-3 h-3" /> ขึ้น
                          </span>
                        )}
                        {item.trend === 'down' && (
                          <span className="inline-flex items-center gap-0.5 text-rose-600 font-semibold text-[10px]">
                            <TrendingDown className="w-3 h-3" /> ลง
                          </span>
                        )}
                        {item.trend === 'stable' && (
                          <span className="inline-flex items-center gap-0.5 text-slate-400 font-semibold text-[10px]">
                            <Minus className="w-3 h-3" /> คงที่
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Cart List & Impact */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  รายการขยะที่สะสม ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calculator className="w-12 h-12 mx-auto text-slate-300 mb-3 opacity-50" />
                  <p className="text-sm font-medium">ยังไม่มีรายการขยะที่คำนวณ</p>
                  <p className="text-xs mt-1">เลือกรายการทางซ้ายมือแล้วกด "เพิ่ม" ได้เลย</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {cart.map((cartItem) => {
                    const subtotal = cartItem.quantityKg * cartItem.item.pricePerKg;
                    return (
                      <div
                        key={cartItem.item.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {cartItem.item.name.split(' (')[0]}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ฿{cartItem.item.pricePerKg}/กก. × {cartItem.quantityKg} กก.
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-700">฿{subtotal.toFixed(2)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(cartItem.item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total calculation panel */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>น้ำหนักรวมทั้งหมด:</span>
                <span className="font-semibold text-slate-800">{totalWeight.toFixed(1)} กก.</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>ลดก๊าซเรือนกระจก:</span>
                <span className="font-semibold text-emerald-600">-{totalCo2Saved} kg CO₂e</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-slate-200">
                <span className="text-sm font-bold text-slate-800">ยอดเงินประเมินที่จะได้รับ:</span>
                <span className="text-xl font-extrabold text-emerald-700">฿{totalRevenue.toFixed(2)}</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 mt-4">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> การแยกชิ้นส่วน ล้างให้สะอาด และอัดให้แน่น สามารถเพิ่มมูลค่ารับซื้อได้ถึง 15-25%!
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

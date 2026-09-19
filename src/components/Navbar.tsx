import React, { useState } from 'react';
import { sound } from '../utils/audio';
import {
  Camera,
  BookOpen,
  History,
  Sparkles,
  Leaf,
  Calculator,
  Bot,
  Volume2,
  VolumeX,
  HelpCircle
} from 'lucide-react';

export type TabType = 'scan' | 'guide' | 'calculator' | 'quiz' | 'history';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  scanCount: number;
  onOpenEcoBot: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  scanCount,
  onOpenEcoBot,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleTabClick = (tab: TabType) => {
    sound.playPop();
    setActiveTab(tab);
  };

  const handleToggleSound = () => {
    const newState = sound.toggleSound();
    setSoundEnabled(newState);
    if (newState) sound.playPop();
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'scan', label: 'สแกน AI', icon: <Camera className="w-4 h-4" /> },
    { id: 'guide', label: 'คู่มือ 4 สี', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'calculator', label: 'คำนวณราคา ฿', icon: <Calculator className="w-4 h-4" /> },
    { id: 'quiz', label: 'ควิซแยกขยะ', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'history', label: 'ประวัติ', icon: <History className="w-4 h-4" />, badge: scanCount > 0 ? `${scanCount}` : undefined },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          {/* Logo & EcoBot Action */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => handleTabClick('scan')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 bg-clip-text text-transparent">
                  SMART WASTE 3D GUIDE
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  ระบบคัดแยกขยะอัจฉริยะ มาตรฐานไทย 4 สี (กรมควบคุมมลพิษ)
                </p>
              </div>
            </div>

            {/* Quick Actions (Right side on mobile) */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={onOpenEcoBot}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>EcoBot</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Items */}
          <div className="flex items-center justify-start lg:justify-end gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-0.5 text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === item.id
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            {/* Desktop Quick Tools */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
              <button
                type="button"
                onClick={handleToggleSound}
                title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                type="button"
                onClick={onOpenEcoBot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                <span>ถาม EcoBot</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

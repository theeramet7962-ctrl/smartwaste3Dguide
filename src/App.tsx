import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { CameraView } from './components/CameraView';
import { AnalysisResult } from './components/AnalysisResult';
import { BinGuideView } from './components/BinGuideView';
import { HistoryLog } from './components/HistoryLog';
import { EcoQuiz } from './components/EcoQuiz';
import { RecycleCalculator } from './components/RecycleCalculator';
import { EcoAdvisorModal } from './components/EcoAdvisorModal';
import { WasteAnalysisResult, ScanHistoryItem } from './types';
import { sound } from './utils/audio';
import { Leaf, Bot } from 'lucide-react';
import { analyzeWasteClientFallback } from './utils/geminiClientFallback';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    result: WasteAnalysisResult;
    image: string;
  } | null>(null);

  // LocalStorage state for scan history
  const [history, setHistory] = useState<ScanHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ecoscan_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [savedScanIds, setSavedScanIds] = useState<Set<string>>(new Set());

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ecoscan_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history to localStorage', e);
    }
  }, [history]);

  // Handle Analyze Image via Server Endpoint
  const handleAnalyzeImage = async (imageDataUrl: string, userPrompt?: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      let analysisResult: WasteAnalysisResult | null = null;

      try {
        const response = await fetch('/api/analyze-waste', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageDataUrl,
            userPrompt,
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        let data: any = null;
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            if (response.status === 413) {
              throw new Error('รูปภาพมีขนาดใหญ่เกินกว่าที่เซิร์ฟเวอร์กำหนด กรุณาถ่ายใหม่');
            }
            if (response.status === 404) {
              throw new Error('SERVERLESS_404');
            }
            throw new Error(text.slice(0, 120) || 'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง');
          }
        }

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || 'เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพขยะ');
        }

        analysisResult = data.data;
      } catch (serverErr: any) {
        // If serverless route is not reachable on Vercel and a client key is available
        const clientKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
        if (clientKey) {
          console.warn('API endpoint unavailable, running client fallback:', serverErr);
          analysisResult = await analyzeWasteClientFallback(imageDataUrl, userPrompt);
        } else {
          throw serverErr;
        }
      }

      if (analysisResult) {
        setCurrentAnalysis({
          result: analysisResult,
          image: imageDataUrl,
        });
        sound.playSuccess();
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      let rawMsg = err.message || 'ไม่สามารถติดต่อระบบวิเคราะห์ได้ โปรดลองอีกครั้ง';
      try {
        if (rawMsg.includes('{') && rawMsg.includes('}')) {
          const match = rawMsg.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (
              parsed?.error?.code === 503 ||
              parsed?.error?.status === 'UNAVAILABLE' ||
              parsed?.error?.message?.includes('high demand')
            ) {
              rawMsg = 'ขณะนี้ระบบ AI มีผู้ใช้งานจำนวนมากชั่วคราว (High Demand) กรุณากดปุ่มลองใหม่อีกครั้ง';
            } else if (parsed?.error?.message) {
              rawMsg = parsed.error.message;
            }
          }
        }
      } catch {}
      if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
        rawMsg = 'ขณะนี้ระบบ AI มีผู้ใช้งานจำนวนมากชั่วคราว (High Demand) กรุณากดปุ่มลองใหม่อีกครั้ง';
      }
      if (
        rawMsg.includes('GEMINI_API_KEY') ||
        rawMsg.includes('API key not valid') ||
        rawMsg.includes('API_KEY_INVALID') ||
        rawMsg.includes('SERVERLESS_404')
      ) {
        rawMsg =
          'ยังไม่ได้ตั้งค่า GEMINI_API_KEY: หากใช้บน Vercel ให้ไปที่เมนู Project Settings > Environment Variables แล้วเพิ่ม GEMINI_API_KEY (หรือตั้งค่าใน Settings ของ AI Studio)';
      }
      setError(rawMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save current scan to history
  const handleSaveHistory = (result: WasteAnalysisResult, image: string) => {
    const newId = `scan-${Date.now()}`;
    const newHistoryItem: ScanHistoryItem = {
      id: newId,
      timestamp: new Date().toISOString(),
      imageDataUrl: image,
      result,
    };

    sound.playSuccess();
    setHistory((prev) => [newHistoryItem, ...prev]);
    setSavedScanIds((prev) => new Set(prev).add(newId));
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    sound.playPop();
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm('คุณต้องการลบประวัติการสแกนทั้งหมดใช่หรือไม่?')) {
      sound.playPop();
      setHistory([]);
    }
  };

  // Select scan from history
  const handleSelectHistoryItem = (item: ScanHistoryItem) => {
    sound.playPop();
    setCurrentAnalysis({
      result: item.result,
      image: item.imageDataUrl,
    });
    setActiveTab('scan');
  };

  // Rescan / Reset current view
  const handleRescan = () => {
    sound.playPop();
    setCurrentAnalysis(null);
    setError(null);
    setActiveTab('scan');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-20">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        scanCount={history.length}
        onOpenEcoBot={() => setIsAdvisorOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Tab 1: Camera Scan & Analysis */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {currentAnalysis ? (
              <AnalysisResult
                result={currentAnalysis.result}
                capturedImage={currentAnalysis.image}
                onRescan={handleRescan}
                onSaveHistory={handleSaveHistory}
                isSaved={false}
                onOpenCalculator={() => setActiveTab('calculator')}
              />
            ) : (
              <CameraView
                onAnalyzeImage={handleAnalyzeImage}
                isAnalyzing={isAnalyzing}
                error={error}
                clearError={() => setError(null)}
              />
            )}
          </div>
        )}

        {/* Tab 2: Bin Guide 5 Colors */}
        {activeTab === 'guide' && <BinGuideView />}

        {/* Tab 3: Recycling Price Calculator */}
        {activeTab === 'calculator' && <RecycleCalculator />}

        {/* Tab 4: Eco Quiz */}
        {activeTab === 'quiz' && <EcoQuiz />}

        {/* Tab 5: History Log */}
        {activeTab === 'history' && (
          <HistoryLog
            history={history}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearAllHistory={handleClearAllHistory}
            onSelectScan={handleSelectHistoryItem}
          />
        )}
      </main>

      {/* Floating EcoBot Quick Access Button */}
      <button
        type="button"
        onClick={() => setIsAdvisorOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all text-xs font-bold border border-white/20 cursor-pointer"
      >
        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
        <span className="hidden sm:inline">ปรึกษา EcoBot ผู้ช่วยแยกขยะ</span>
      </button>

      {/* Persistent EcoBot Advisor Modal */}
      <EcoAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        contextWaste={currentAnalysis?.result || null}
      />

      {/* Persistent Eco Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">SMART WASTE 3D GUIDE</span>
            <span>— ร่วมสร้างประเทศไทยไร้ขยะ เริ่มต้นที่การแยกขยะถูกถัง</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-slate-500 text-[11px]">
            <span>มาตรฐานถังขยะ 4 สี กรมควบคุมมลพิษ</span>
            <span>•</span>
            <span>แหล่งข้อมูล: กรมควบคุมมลพิษ (คพ.) & อบก. & วงษ์พาณิชย์</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

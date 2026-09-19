import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sound } from '../utils/audio';
import {
  Camera,
  SwitchCamera,
  Upload,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Zap,
  Scan,
  Crosshair,
  Eye
} from 'lucide-react';

interface CameraViewProps {
  onAnalyzeImage: (imageDataUrl: string, userPrompt?: string) => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
  clearError: () => void;
}

// Compress image to ensure payload stays well under serverless 4.5MB limits
const optimizeImage = (dataUrl: string, maxDim = 1280, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const CameraView: React.FC<CameraViewProps> = ({
  onAnalyzeImage,
  isAnalyzing,
  error,
  clearError,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cleanErrorMessage = (rawError: string | null) => {
    if (!rawError) return '';
    try {
      if (rawError.includes('{') && rawError.includes('}')) {
        const match = rawError.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (
            parsed?.error?.code === 503 ||
            parsed?.error?.status === 'UNAVAILABLE' ||
            parsed?.error?.message?.includes('high demand')
          ) {
            return 'ขณะนี้ระบบ AI มีผู้ใช้งานจำนวนมากชั่วคราว (High Demand) ระบบรองรับการลองสแกนซ้ำอัตโนมัติ กรุณากดปุ่ม "ลองใหม่อีกครั้ง"';
          }
          if (parsed?.error?.code === 429 || parsed?.error?.status === 'RESOURCE_EXHAUSTED') {
            return 'โควตาการเรียกใช้งานระบบชั่วคราวหนาแน่น กรุณารอสักครู่แล้วกดลองใหม่';
          }
          if (parsed?.error?.message) {
            return parsed.error.message;
          }
        }
      }
    } catch {}

    if (rawError.includes('503') || rawError.includes('high demand') || rawError.includes('UNAVAILABLE')) {
      return 'ขณะนี้ระบบ AI มีผู้ใช้งานจำนวนมากชั่วคราว (High Demand) กรุณากดปุ่ม "ลองใหม่อีกครั้ง"';
    }

    if (rawError.includes('GEMINI_API_KEY') || rawError.includes('API key not valid') || rawError.includes('API_KEY_INVALID')) {
      return 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ Google AI Studio';
    }

    return rawError;
  };

  // Cycling loading message phrases
  const loadingMessages = [
    'กำลังวิเคราะห์พิกเซลและลักษณะของขยะ...',
    'กำลังตรวจสอบประเภทวัสดุและรหัสรีไซเคิล...',
    'กำลังระบุสีถังขยะตามมาตรฐานประเทศไทย...',
    'กำลังสร้างขั้นตอนการคัดแยกขยะที่ถูกต้อง...'
  ];

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      sound.playPop();
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องถ่ายรูปได้ โปรดตรวจสอบการอนุญาตใช้งานกล้อง หรือใช้การอัปโหลดรูปภาพแทน');
      setCameraActive(false);
    }
  }, [facingMode]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Toggle Facing Mode
  const toggleFacingMode = () => {
    sound.playPop();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
  }, [facingMode, cameraActive, startCamera]);

  // Capture Photo from Camera
  const capturePhoto = (autoScan = true) => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      setCameraError('กล้องกำลังเริ่มต้นการส่งสัญญาณภาพ กรุณารอ 1 วินาทีแล้วลองกดถ่ายอีกครั้ง');
      return;
    }

    sound.playShutter();

    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      stopCamera();
      clearError();

      if (autoScan) {
        onAnalyzeImage(dataUrl, userPrompt.trim() || undefined);
      }
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('โปรดเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)');
      return;
    }

    sound.playPop();
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      const optimized = await optimizeImage(rawDataUrl);
      setSelectedImage(optimized);
      stopCamera();
      clearError();
      onAnalyzeImage(optimized, userPrompt.trim() || undefined);
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    sound.playPop();
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      const optimized = await optimizeImage(rawDataUrl);
      setSelectedImage(optimized);
      stopCamera();
      clearError();
    };
    reader.readAsDataURL(file);
  };

  // Trigger Analysis
  const handleAnalyze = async () => {
    if (!selectedImage) return;
    sound.playPop();
    await onAnalyzeImage(selectedImage, userPrompt.trim() || undefined);
    sound.playSuccess();
  };

  // Reset Image Selection
  const handleReset = () => {
    sound.playPop();
    setSelectedImage(null);
    clearError();
  };

  return (
    <div className="space-y-6">
      {/* Hidden canvas & file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Scanner Section */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-200/80 overflow-hidden relative">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5 text-emerald-600" />
              AI Waste Scanner
            </span>
          </div>
          {cameraActive && (
            <button
              type="button"
              onClick={toggleFacingMode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
              <span>สลับกล้อง</span>
            </button>
          )}
        </div>

        {/* Display Area: Video Feed OR Selected Image OR Camera Prompt */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative aspect-4/3 sm:aspect-16/9 bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center transition-all ${
            isDragOver ? 'ring-4 ring-emerald-500/50 bg-slate-900' : ''
          }`}
        >
          {/* 1. Camera Active View */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Camera Scanning Laser Overlay when active */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none border-2 border-emerald-400/40 rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
              <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0 rounded-tl-lg" />
                <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0 rounded-tr-lg" />
                <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0 rounded-bl-lg" />
                <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0 rounded-br-lg" />
                <span className="text-xs font-medium text-white/90 bg-black/60 px-3.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> วางขยะไว้ตรงกลางกรอบ
                </span>
              </div>
            </div>
          )}

          {/* 2. Selected Captured / Uploaded Image View */}
          {!cameraActive && selectedImage && (
            <div className="relative w-full h-full group">
              <img
                src={selectedImage}
                alt="Selected waste item"
                className="w-full h-full object-contain bg-slate-950/90"
              />
              <button
                type="button"
                onClick={handleReset}
                disabled={isAnalyzing}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white p-2 rounded-xl backdrop-blur-md transition-all text-xs flex items-center gap-1.5 px-3 border border-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>เปลี่ยนรูป</span>
              </button>

              {/* Scanning Animation Overlay when analyzing */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    <Sparkles className="w-8 h-8 text-emerald-400 absolute" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-300 mb-1">
                    AI กำลังวิเคราะห์ขยะ...
                  </h3>
                  <p className="text-xs text-slate-300 font-medium h-6 transition-all duration-300">
                    {loadingMessages[loadingStep]}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. Initial Empty State View */}
          {!cameraActive && !selectedImage && (
            <div className="p-6 text-center text-slate-300 flex flex-col items-center justify-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                ถ่ายภาพหรือลากรูปขยะมาวางที่นี่
              </h3>
              <p className="text-xs text-slate-400 mb-6 max-w-sm leading-relaxed">
                ระบบจะวิเคราะห์ประเภทวัสดุ สีถังขยะตามมาตรฐาน 4 สีของกรมควบคุมมลพิษ พร้อมประเมินคาร์บอนและวิธีคัดแยก
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  id="btn-open-camera"
                  type="button"
                  onClick={startCamera}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>เปิดกล้องถ่ายรูป</span>
                </button>

                <button
                  id="btn-upload-image"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>เลือกรูปในเครื่อง</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls for Active Camera */}
        {cameraActive && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => capturePhoto(false)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ถ่ายเพื่อดูรูปก่อน</span>
            </button>
            <button
              id="btn-capture-photo"
              type="button"
              onClick={() => capturePhoto(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white text-emerald-600" />
              <span>ถ่ายภาพและสแกนทันที</span>
            </button>
          </div>
        )}

        {/* Camera Access Error Alert */}
        {cameraError && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>{cameraError}</p>
          </div>
        )}

        {/* Selected Image Analysis Bar */}
        {selectedImage && !isAnalyzing && (
          <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
            {/* Optional Custom Question */}
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="มีคำถามหรือข้อสงสัยเพิ่มเติม? (เช่น ชิ้นนี้ขายได้กี่บาท? ฝาต้องแกะไหม?)"
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                เลือกรูปใหม่ / ถ่ายใหม่
              </button>
              <button
                id="btn-start-analyze"
                type="button"
                onClick={handleAnalyze}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>กดเริ่มสแกนจำแนกวัตถุ</span>
              </button>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {error && (
          <div className="mt-4 p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
            <div className="flex items-start gap-2.5 flex-1">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-amber-900 text-sm">การสแกนขัดข้องชั่วคราว</p>
                <p className="text-amber-800 mt-0.5 font-medium">{cleanErrorMessage(error)}</p>
                {error.includes('GEMINI_API_KEY') || error.includes('API_KEY') ? (
                  <div className="mt-2.5 p-3 bg-amber-100/70 rounded-xl border border-amber-300/60 text-amber-950 space-y-2">
                    <p className="font-bold text-xs flex items-center gap-1.5">
                      <span>🔑</span> วิธีแก้ไข: ตั้งค่า GEMINI_API_KEY
                    </p>
                    <div className="space-y-1.5 text-[11px] text-slate-700">
                      <div>
                        <strong className="text-amber-900 font-semibold">▲ สำหรับการ Deploy บน Vercel:</strong>
                        <ol className="list-decimal list-inside pl-1 space-y-0.5 mt-0.5 text-slate-600">
                          <li>เปิดหน้า Project Dashboard บน Vercel &gt; ไปที่แท็บ <strong>Settings</strong> &gt; <strong>Environment Variables</strong></li>
                          <li>เพิ่ม Key: <code className="bg-amber-200/80 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</code></li>
                          <li>วาง API Key แล้วกด <strong>Save</strong> จากนั้นสั่ง <strong>Redeploy</strong> 1 ครั้ง</li>
                        </ol>
                      </div>
                      <div className="pt-1 border-t border-amber-200/80">
                        <strong className="text-amber-900 font-semibold">⚙️ สำหรับการทดสอบใน Google AI Studio:</strong>
                        <p className="text-slate-600 pl-1 mt-0.5">
                          คลิกเมนู <strong>Settings (รูปฟันเฟือง ⚙️)</strong> ด้านบน &gt; <strong>Secrets</strong> &gt; เพิ่ม <code className="bg-amber-200/80 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</code>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-slate-500 text-[11px]">
                    💡 ระบบมีระบบสลับโมเดลสำรองอัตโนมัติ หากเซิร์ฟเวอร์มีผู้ใช้งานหนาแน่น ให้กดปุ่ม "ลองใหม่อีกครั้ง"
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {selectedImage && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>ลองใหม่อีกครั้ง</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearError}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl font-medium transition-colors cursor-pointer text-xs"
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

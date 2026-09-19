import React, { useState, useRef, useEffect } from 'react';
import { WasteAnalysisResult, ChatMessage } from '../types';
import { sound } from '../utils/audio';
import {
  MessageSquare,
  Send,
  Sparkles,
  X,
  Bot,
  User,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface EcoAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextWaste?: WasteAnalysisResult | null;
}

export const EcoAdvisorModal: React.FC<EcoAdvisorModalProps> = ({
  isOpen,
  onClose,
  contextWaste,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: contextWaste
        ? `สวัสดีครับ! ผมคือ EcoBot 🤖 ผู้ช่วย AI ด้านการแยกขยะ กำลังดูข้อมูลเกี่ยวกับ "${contextWaste.itemName}" อยู่ มีข้อสงสัยเกี่ยวกับการจัดการหรือไอเดีย DIY ถามผมได้เลยครับ!`
        : 'สวัสดีครับ! ผมคือ EcoBot 🤖 ผู้เชี่ยวชาญการจัดการขยะตามมาตรฐานกรมควบคุมมลพิษ (คพ.) มีข้อสงสัยเรื่องถังขยะ 4 สี หรือการรีไซเคิลชิ้นไหน ถามได้ทันทีเลยครับ!',
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickQuestions = contextWaste
    ? [
        `ฝาหรือฉลากของ ${contextWaste.itemName} ต้องแยกอย่างไร?`,
        `ไอเดีย D.I.Y. เพิ่มเติมสำหรับ ${contextWaste.itemName}`,
        `ขายให้ร้านรับซื้อของเก่าได้ราคาเท่าไหร่?`,
      ]
    : [
        'ขวดน้ำมันพืชใช้แล้วทิ้งถังสีไหน?',
        'กล่องนม UHT รีไซเคิลได้อย่างไร?',
        'ขยะอิเล็กทรอนิกส์ (E-Waste) ส่งไปทิ้งที่ไหนได้บ้าง?',
      ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    sound.playPop();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          contextItem: contextWaste,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการตอบคำถาม');
      }

      sound.playSuccess();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'ขออภัยครับ ไม่สามารถเชื่อมต่อกับ EcoBot ได้ในขณะนี้ โปรดลองใหม่อีกครั้ง',
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">EcoBot ผู้ช่วย AI</h3>
              <p className="text-[11px] text-emerald-100/80">ตอบทุกข้อสงสัยเรื่องการคัดแยกขยะ 24 ชม.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div
                  className={`text-[9px] mt-1 text-right ${
                    msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>EcoBot กำลังประมวลผลคำตอบ...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 scrollbar-none">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 border border-slate-200/60"
            >
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="พิมพ์คำถามเกี่ยวกับการแยกขยะที่นี่..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-3.5 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { QUIZ_QUESTIONS } from '../data/binGuide';
import { CheckCircle2, XCircle, RotateCcw, HelpCircle, Sparkles, ArrowRight, Award } from 'lucide-react';

export const EcoQuiz: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    sound.playPop();
    setSelectedOptionIndex(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOptionIndex === null) return;

    const isCorrect = selectedOptionIndex === currentQuestion.correctIndex;
    if (isCorrect) {
      sound.playSuccess();
      setScore((prev) => prev + 1);
    } else {
      sound.playPop();
    }
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    sound.playPop();
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizCompleted(true);
      sound.playCelebration();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestartQuiz = () => {
    sound.playPop();
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsQuizCompleted(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Quiz Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> ท้าทายความรู้
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          ควิซทดสอบความรู้การคัดแยกขยะ
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100/80 max-w-md mx-auto leading-relaxed">
          ทดสอบความเข้าใจเรื่องถังขยะ 4 สีตามมาตรฐานกรมควบคุมมลพิษ เพื่อการคัดแยกที่ถูกต้องในชีวิตประจำวัน
        </p>
      </div>

      {/* Main Quiz Box */}
      {!isQuizCompleted ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-4 border-b border-slate-100">
            <span>คำถามที่ {currentQuestionIndex + 1} / {QUIZ_QUESTIONS.length}</span>
            <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ตอบถูกแล้ว: {score} ข้อ
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Answer Options List */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              let btnStyle = 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800';

              if (selectedOptionIndex === idx) {
                btnStyle = 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold';
              }

              if (isAnswerSubmitted) {
                if (idx === currentQuestion.correctIndex) {
                  btnStyle = 'border-emerald-600 bg-emerald-100 text-emerald-950 font-bold';
                } else if (selectedOptionIndex === idx) {
                  btnStyle = 'border-rose-400 bg-rose-50 text-rose-900 font-medium';
                } else {
                  btnStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option.text}</span>
                  </div>

                  {isAnswerSubmitted && idx === currentQuestion.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}

                  {isAnswerSubmitted && selectedOptionIndex === idx && idx !== currentQuestion.correctIndex && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box (Post submission) */}
          {isAnswerSubmitted && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed animate-fadeIn ${
                selectedOptionIndex === currentQuestion.correctIndex
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="font-bold mb-1 flex items-center gap-1.5">
                {selectedOptionIndex === currentQuestion.correctIndex ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ถูกต้อง! 🎉</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>ยังไม่ถูกต้อง คำอธิบาย:</span>
                  </>
                )}
              </div>
              <p>{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            {!isAnswerSubmitted ? (
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={selectedOptionIndex === null}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                ตรวจคำตอบ
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>{currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? 'ข้อถัดไป' : 'ดูผลคะแนนสรุป'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Complete Screen */
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 shadow-md">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              ยินดีด้วย! คุณทำควิซเสร็จสิ้นแล้ว
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ขอบคุณที่ร่วมเรียนรู้วิธีการคัดแยกขยะที่ถูกต้องตามมาตรฐานประเทศไทย
            </p>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 max-w-sm mx-auto space-y-2">
            <div className="text-xs text-emerald-800 font-semibold">คะแนนที่ได้</div>
            <div className="text-4xl font-black text-emerald-700">
              {score} / {QUIZ_QUESTIONS.length}
            </div>
            <p className="text-xs text-emerald-600 font-medium">
              {score === QUIZ_QUESTIONS.length
                ? 'ยอดเยี่ยมมาก! คุณมีความรู้เรื่องการแยกขยะระดับผู้เชี่ยวชาญ'
                : score >= 3
                ? 'เก่งมาก! คุณมีความรู้พื้นฐานที่ดีเยี่ยมในการช่วยดูแลสิ่งแวดล้อม'
                : 'ลองทบทวนคู่มือ 4 สีและฝึกทำใหม่อีกครั้งเพื่อความแม่นยำยิ่งขึ้น'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRestartQuiz}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ทำควิซอีกครั้ง</span>
          </button>
        </div>
      )}
    </div>
  );
};

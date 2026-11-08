import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Award, RotateCcw } from 'lucide-react';
import type { CbsQuizQuestion } from '../../types';

interface CbsInteractiveQuizProps {
  dayNumber: number;
  questions: CbsQuizQuestion[];
  savedScore?: number;
  onSaveScore: (score: number) => void;
}

export const CbsInteractiveQuiz: React.FC<CbsInteractiveQuizProps> = ({
  dayNumber,
  questions,
  savedScore,
  onSaveScore
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(savedScore !== undefined);

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });
    return Math.round((correctCount / questions.length) * 100);
  };

  const handleSubmit = () => {
    const score = calculateScore();
    setIsSubmitted(true);
    onSaveScore(score);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === questions.length;
  const currentScore = isSubmitted ? (savedScore ?? calculateScore()) : calculateScore();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-teal-100/70 text-teal-800">
              <Award className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Day {dayNumber} Self-Check Assessment
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            সঠিক ধারণা নিশ্চিত করতে প্রতিটি প্রশ্নের উত্তর দিন এবং তাৎক্ষণিক ব্যাখ্যা পর্যালোচনা করুন।
          </p>
        </div>

        {isSubmitted && (
          <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Assessment Score</span>
              <span className="text-lg font-black text-emerald-900">{currentScore}%</span>
            </div>
            <button
              onClick={handleReset}
              title="পুনরায় কুইজ দিন"
              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/60 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const selectedOption = selectedAnswers[q.id];
          const hasAnswered = selectedOption !== undefined;
          const isCorrect = selectedOption === q.correctOptionIndex;

          return (
            <div key={q.id} className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/60 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-black text-slate-900 flex-1 leading-snug">
                  <span className="text-teal-700 mr-1.5">Q{idx + 1}.</span>
                  {q.question}
                </span>

                {isSubmitted && (
                  <span className="shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>সঠিক</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-extrabold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ভুল</span>
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                {q.options.map((opt, oIdx) => {
                  const isThisSelected = selectedOption === oIdx;
                  const isThisCorrect = oIdx === q.correctOptionIndex;

                  let optionStyle = 'bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50/30';

                  if (isSubmitted) {
                    if (isThisCorrect) {
                      optionStyle = 'bg-emerald-50/90 border-emerald-500 text-emerald-950 font-bold';
                    } else if (isThisSelected && !isThisCorrect) {
                      optionStyle = 'bg-rose-50/90 border-rose-400 text-rose-950 font-bold';
                    } else {
                      optionStyle = 'bg-white border-slate-200 text-slate-400 opacity-60';
                    }
                  } else if (isThisSelected) {
                    optionStyle = 'bg-teal-50 border-teal-600 text-teal-950 font-bold shadow-xs';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(q.id, oIdx)}
                      className={`text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      {isSubmitted && isThisCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                      )}
                      {isSubmitted && isThisSelected && !isThisCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Explanation (Visible after submission or selection) */}
              {(isSubmitted || hasAnswered) && q.explanation && (
                <div className="mt-2 p-3 rounded-lg bg-teal-50/70 border border-teal-100 text-xs text-teal-900 flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-teal-950 block mb-0.5">ব্যাখ্যা ও সিনিয়র অবজারভেশন:</span>
                    <span>{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      {!isSubmitted && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {answeredCount} / {questions.length} প্রশ্নের উত্তর দেওয়া হয়েছে
          </span>
          <button
            disabled={!allAnswered}
            onClick={handleSubmit}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              allAnswered
                ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)] hover:bg-[#005a5a] active:scale-95 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            কুইজ জমা দিন এবং প্রোগ্রেস সেভ করুন
          </button>
        </div>
      )}
    </div>
  );
};

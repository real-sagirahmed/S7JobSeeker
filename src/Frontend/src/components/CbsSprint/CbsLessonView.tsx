import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Download
} from 'lucide-react';
import type { CbsDayLesson, CbsProgress } from '../../types';
import { CbsInteractiveQuiz } from './CbsInteractiveQuiz';
import { CbsAiAssistant } from './CbsAiAssistant';

interface CbsLessonViewProps {
  lesson: CbsDayLesson;
  progress: CbsProgress;
  onToggleComplete: (dayNumber: number, completed: boolean) => void;
  onSaveQuizScore: (dayNumber: number, score: number) => void;
}

export const CbsLessonView: React.FC<CbsLessonViewProps> = ({
  lesson,
  progress,
  onToggleComplete,
  onSaveQuizScore
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const isCompleted = progress.completedDays.includes(lesson.dayNumber);
  const quizScore = progress.quizScores[lesson.dayNumber.toString()];

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleDownloadMarkdown = () => {
    const filename = `CBS-Sprint-Day-${lesson.dayNumber}-${lesson.subtitle.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    const blob = new Blob([lesson.exportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                Day {lesson.dayNumber} of 14
              </span>
              <span className="flex items-center space-x-1 text-slate-500 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{lesson.estimatedMinutes} মিনিট</span>
              </span>
              {quizScore !== undefined && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  quizScore >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  কুইজ স্কোর: {quizScore}%
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {lesson.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              Role: <span className="text-teal-800">{lesson.targetRole}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onToggleComplete(lesson.dayNumber, !isCompleted)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
                  : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সম্পন্ন হয়েছে ✓</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-slate-400" />
                  <span>সম্পন্ন মার্ক করুন</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadMarkdown}
              title="সম্পূর্ণ দিনের নোট Markdown হিসেবে ডাউনলোড করুন"
              className="p-2.5 rounded-xl text-slate-700 hover:text-teal-900 bg-slate-100 hover:bg-teal-50 border border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Learning Objectives Box */}
        {lesson.objectives && lesson.objectives.length > 0 && (
          <div className="bg-gradient-to-br from-teal-50/70 via-white to-slate-50 p-5 rounded-2xl border border-teal-200/80 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center space-x-2 mb-1">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>আজকের মূল লক্ষ্য ও শেখার বিষয়</span>
            </span>
            <ul className="space-y-1.5">
              {lesson.objectives.map((obj, oIdx) => (
                <li key={oIdx} className="text-xs sm:text-sm text-slate-800 flex items-start space-x-2.5">
                  <span className="text-teal-600 font-black mt-0.5">✓</span>
                  <span className="font-medium leading-relaxed">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main High-Fidelity Markdown Lesson Content */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-10 text-slate-800">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ ...props }) => (
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-3 tracking-tight" {...props} />
            ),
            h2: ({ ...props }) => (
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-8 mb-3 border-b border-slate-200 pb-2 tracking-tight flex items-center space-x-2" {...props} />
            ),
            h3: ({ ...props }) => (
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-6 mb-2 tracking-tight" {...props} />
            ),
            h4: ({ ...props }) => (
              <h4 className="text-sm sm:text-base font-bold text-slate-800 mt-4 mb-2" {...props} />
            ),
            p: ({ ...props }) => (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4 font-normal" {...props} />
            ),
            ul: ({ ...props }) => (
              <ul className="list-disc pl-5 space-y-1.5 mb-4 text-xs sm:text-sm text-slate-700 leading-relaxed" {...props} />
            ),
            ol: ({ ...props }) => (
              <ol className="list-decimal pl-5 space-y-1.5 mb-4 text-xs sm:text-sm text-slate-700 leading-relaxed" {...props} />
            ),
            li: ({ ...props }) => (
              <li className="leading-relaxed" {...props} />
            ),
            blockquote: ({ ...props }) => (
              <blockquote className="border-l-4 border-teal-600 bg-teal-50/70 p-4 rounded-r-2xl text-xs sm:text-sm text-teal-950 font-medium my-4 shadow-2xs" {...props} />
            ),
            hr: () => (
              <hr className="border-slate-200 my-8" />
            ),
            table: ({ ...props }) => (
              <div className="overflow-x-auto my-6 rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse divide-y divide-slate-200" {...props} />
              </div>
            ),
            thead: ({ ...props }) => (
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider" {...props} />
            ),
            th: ({ ...props }) => (
              <th className="px-4 py-3 border-r border-slate-200 last:border-r-0 font-black" {...props} />
            ),
            td: ({ ...props }) => (
              <td className="px-4 py-2.5 border-r border-slate-100 last:border-r-0 text-slate-800 font-medium" {...props} />
            ),
            tr: ({ ...props }) => (
              <tr className="even:bg-slate-50/60 hover:bg-teal-50/30 transition-colors" {...props} />
            ),
            code: ({ inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const lang = match ? match[1] : '';
              const codeText = String(children).replace(/\n$/, '');

              if (!inline && (match || codeText.includes('\n'))) {
                const snippetId = `code-${Math.random().toString(36).substring(2, 9)}`;
                const isCopied = copiedSnippet === snippetId;

                return (
                  <div className="my-5 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                        <span className="font-mono text-teal-400 font-bold uppercase tracking-wider text-[11px] ml-2">
                          {lang || 'code'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(snippetId, codeText)}
                        className="flex items-center space-x-1.5 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400 font-bold">কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px]">কপি কোড</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-300/95 overflow-x-auto leading-relaxed">
                      <code>{codeText}</code>
                    </pre>
                  </div>
                );
              }

              return (
                <code className="bg-slate-100 text-teal-900 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200 font-bold" {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {lesson.exportMarkdown}
        </ReactMarkdown>
      </div>

      {/* Common Mistakes Warning Callout */}
      {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-3xl p-6 sm:p-7 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2.5 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm sm:text-base font-black tracking-tight">
              CBS Support Common Mistakes — যেগুলো কঠোরভাবে এড়িয়ে চলবে
            </h3>
          </div>
          <ul className="space-y-2 pt-1">
            {lesson.commonMistakes.map((mistake, mIdx) => (
              <li key={mIdx} className="text-xs sm:text-sm text-amber-950 flex items-start space-x-2.5">
                <span className="text-amber-600 font-black mr-1 shrink-0">✕</span>
                <span className="leading-relaxed font-medium">{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interactive Self-Check Assessment */}
      <CbsInteractiveQuiz
        dayNumber={lesson.dayNumber}
        questions={lesson.quizzes}
        savedScore={quizScore}
        onSaveScore={(score) => onSaveQuizScore(lesson.dayNumber, score)}
      />

      {/* AI Assistant for Technical Doubts */}
      <CbsAiAssistant
        dayNumber={lesson.dayNumber}
        dayTitle={lesson.subtitle}
      />
    </div>
  );
};

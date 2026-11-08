import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Copy,
  Check,
  AlertTriangle
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

  // Helper to render markdown content with code blocks and headers cleanly
  const renderFormattedMarkdown = (markdown: string) => {
    // Split by code blocks
    const parts = markdown.split(/(```[\s\S]*?```)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const firstLineEnd = part.indexOf('\n');
        const lang = part.substring(3, firstLineEnd).trim() || 'sql';
        const code = part.substring(firstLineEnd + 1, part.length - 3).trim();
        const snippetId = `snippet-${lesson.dayNumber}-${pIdx}`;
        const isCopied = copiedSnippet === snippetId;

        return (
          <div key={pIdx} className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <span className="font-mono text-teal-400 font-bold uppercase tracking-wider text-[11px]">
                {lang}
              </span>
              <button
                onClick={() => handleCopyCode(snippetId, code)}
                className="flex items-center space-x-1.5 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer"
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
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format prose, headers, lists and tables
      const lines = part.split('\n');
      return (
        <div key={pIdx} className="space-y-3">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="h-2" />;

            if (trimmed.startsWith('# Day ')) {
              return null; // Header already rendered on top
            }

            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={lIdx} className="text-base sm:text-lg font-black text-slate-900 mt-6 mb-2 border-b border-slate-200 pb-2 tracking-tight flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                  <span>{trimmed.substring(3)}</span>
                </h2>
              );
            }

            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={lIdx} className="text-sm sm:text-base font-black text-slate-800 mt-4 mb-1">
                  {trimmed.substring(4)}
                </h3>
              );
            }

            if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
              const isChecked = trimmed.startsWith('- [x]');
              const text = trimmed.substring(5).trim();
              return (
                <div key={lIdx} className="flex items-start space-x-2 text-xs text-slate-700 py-1 pl-2">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${isChecked ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'}`}>
                    {isChecked ? '✓' : ''}
                  </span>
                  <span>{text}</span>
                </div>
              );
            }

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              return (
                <li key={lIdx} className="text-xs sm:text-sm text-slate-700 ml-4 list-disc leading-relaxed">
                  {trimmed.substring(2)}
                </li>
              );
            }

            if (/^\d+\.\s/.test(trimmed)) {
              return (
                <div key={lIdx} className="text-xs sm:text-sm text-slate-700 ml-2 font-medium leading-relaxed">
                  {trimmed}
                </div>
              );
            }

            if (trimmed.startsWith('>')) {
              return (
                <blockquote key={lIdx} className="border-l-4 border-teal-500 bg-teal-50/70 p-3 rounded-r-xl text-xs sm:text-sm text-teal-950 font-medium my-2">
                  {trimmed.replace(/^>\s*/, '')}
                </blockquote>
              );
            }

            return (
              <p key={lIdx} className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {trimmed}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                Day {lesson.dayNumber} of 14
              </span>
              <span className="flex items-center space-x-1 text-slate-500 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{lesson.estimatedMinutes} মিনিট</span>
              </span>
              {quizScore !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                  কুইজ স্কোর: {quizScore}%
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
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
                  ? 'bg-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-emerald-700'
                  : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সম্পন্ন হয়েছে</span>
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
          <div className="bg-gradient-to-br from-teal-50/60 to-slate-50 p-4 rounded-xl border border-teal-100/80">
            <span className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center space-x-1.5 mb-2">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>আজকের মূল লক্ষ্য ও শেখার বিষয়</span>
            </span>
            <ul className="space-y-1.5">
              {lesson.objectives.map((obj, oIdx) => (
                <li key={oIdx} className="text-xs sm:text-sm text-slate-800 flex items-start space-x-2">
                  <span className="text-teal-600 font-bold">✓</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Formatted Lesson Content */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-8 space-y-4">
        {renderFormattedMarkdown(lesson.exportMarkdown)}
      </div>

      {/* Common Mistakes Warning Callout */}
      {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center space-x-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm sm:text-base font-black tracking-tight">
              CBS Support Common Mistakes — যেগুলো কঠোরভাবে এড়িয়ে চলবে
            </h3>
          </div>
          <ul className="space-y-2">
            {lesson.commonMistakes.map((mistake, mIdx) => (
              <li key={mIdx} className="text-xs sm:text-sm text-amber-950 flex items-start space-x-2">
                <span className="text-amber-600 font-extrabold mr-1">✕</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interactive Self-Check Quiz */}
      <CbsInteractiveQuiz
        dayNumber={lesson.dayNumber}
        questions={lesson.quizzes}
        savedScore={quizScore}
        onSaveScore={(score) => onSaveQuizScore(lesson.dayNumber, score)}
      />

      {/* AI Assistant for Doubts */}
      <CbsAiAssistant
        dayNumber={lesson.dayNumber}
        dayTitle={lesson.subtitle}
      />
    </div>
  );
};

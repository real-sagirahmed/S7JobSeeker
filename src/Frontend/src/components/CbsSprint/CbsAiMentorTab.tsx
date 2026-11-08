import React, { useState } from 'react';
import {
  HelpCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import type { CbsCurriculumItem, CbsAiDoubtResponse } from '../../types';

interface CbsAiMentorTabProps {
  curriculum: CbsCurriculumItem[];
  selectedDay?: number;
}

interface QnaHistoryItem {
  question: string;
  dayNumber: number;
  response: CbsAiDoubtResponse;
}

export const CbsAiMentorTab: React.FC<CbsAiMentorTabProps> = ({ curriculum, selectedDay = 1 }) => {
  const [targetDay, setTargetDay] = useState<number>(selectedDay);
  const [question, setQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QnaHistoryItem[]>([]);

  const quickQuestions = [
    { text: 'প্রোডাকশন ডেটাবেসে NOLOCK ব্যবহারের ঝুঁকি কী?', day: 1 },
    { text: 'ডাবল-এন্ট্রি অ্যাকাউন্টিংয়ে ডেবিট ও ক্রেডিট কেন সর্বদা সমান হতে হয়?', day: 4 },
    { text: 'Correlation ID দিয়ে ডিস্ট্রিবিউটেড মাইক্রোসার্ভিসে লগ কীভাবে ট্রেস করব?', day: 7 },
    { text: 'ডকার কনটেইনার Exit Code 137 বনাম Exit Code 1 এর তফাত কী?', day: 8 },
    { text: 'CBS EOD ব্যাচ আটকে গেলে রানবুক ছাড়া ডেটাবেস আপডেট কেন বিপজ্জনক?', day: 10 },
    { text: 'নতুন রিলিজের পর রোলব্যাক ভেরিফিকেশনে কী কী বিষয় যাচাই করতে হয়?', day: 12 }
  ];

  const handleAsk = async (queryText?: string, dayOverride?: number) => {
    const q = (queryText || question).trim();
    if (!q) return;

    const dayNum = dayOverride ?? targetDay;
    const dayItem = curriculum.find(c => c.dayNumber === dayNum);
    const dayTitle = dayItem ? dayItem.subtitle || dayItem.title : `Day ${dayNum}`;

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.cbsSprint.askAi({
        dayNumber: dayNum,
        topic: dayTitle,
        question: q
      });

      setHistory(prev => [
        {
          question: q,
          dayNumber: dayNum,
          response: res
        },
        ...prev
      ]);

      if (queryText) setQuestion(queryText);
    } catch (err: any) {
      setError(err?.message || 'AI উত্তর সংগ্রহ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl border border-teal-500/20">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                CBS AI Technical Mentor
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-400/20 text-teal-300 border border-teal-400/30">
                Gemini 2.0
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              কোর ব্যাংকিং সিস্টেম, লিনাক্স ট্রাবলশুটিং, ডকার বা SQL সংক্রান্ত যেকোনো ডাউট বা জটিল সিনারিও জিজ্ঞেস করুন।
            </p>
          </div>
        </div>

        {/* Day Selector & Input Box */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-bold">টপিক নির্বাচন:</span>
            <select
              value={targetDay}
              onChange={(e) => setTargetDay(Number(e.target.value))}
              className="bg-slate-800 text-teal-200 border border-teal-500/30 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-teal-400"
            >
              {curriculum.map((item) => (
                <option key={item.dayNumber} value={item.dayNumber}>
                  Day {item.dayNumber}: {item.subtitle || item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleAsk()}
              placeholder="যেমন: ডাবল-এন্ট্রি লেজারে ট্রানজ্যাকশন রিট্রাই করলে ডুপ্লিকেট পোস্টিং এড়ানোর উপায় কী?"
              className="flex-1 bg-slate-900 border border-teal-500/40 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50"
            />
            <button
              disabled={isLoading || !question.trim()}
              onClick={() => handleAsk()}
              className={`p-3 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                isLoading || !question.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-teal-500 text-slate-950 hover:bg-teal-400 font-black active:scale-95 cursor-pointer shadow-lg shadow-teal-500/20'
              }`}
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-300/70 block mb-2">
            বহুল জিজ্ঞাসিত প্রশ্নাবলি:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((chip, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => {
                  setTargetDay(chip.day);
                  handleAsk(chip.text, chip.day);
                }}
                className="text-[11px] bg-slate-800/80 hover:bg-teal-900/60 text-teal-200 border border-teal-500/30 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer text-left"
              >
                {chip.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Discussion / Q&A Cards Stream */}
      <div className="space-y-4">
        {history.length > 0 ? (
          history.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs"
            >
              {/* Question Header */}
              <div className="flex items-center space-x-2 text-xs border-b border-slate-100 pb-3">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-200">
                  Day {item.dayNumber}
                </span>
                <span className="font-black text-slate-900 text-sm">{item.question}</span>
              </div>

              {/* Senior Insight Callout */}
              {item.response.seniorInsight && (
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase tracking-wider text-[10px] text-teal-800 block mb-0.5">
                      Senior Architect Insight
                    </span>
                    <span className="font-medium">{item.response.seniorInsight}</span>
                  </div>
                </div>
              )}

              {/* Main Answer */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                {item.response.answer}
              </div>

              {/* Related Topics */}
              {item.response.relatedTopicsToReview?.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                    সম্পর্কিত টপিক:
                  </span>
                  {item.response.relatedTopicsToReview.map((topic, tIdx) => (
                    <span
                      key={tIdx}
                      className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500 text-xs space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">এখনও কোনো প্রশ্ন করা হয়নি।</p>
            <p>উপরের ইনপুট বক্সে আপনার প্রশ্ন লিখুন বা সাজেস্টেড প্রশ্নে ক্লিক করুন।</p>
          </div>
        )}
      </div>
    </div>
  );
};

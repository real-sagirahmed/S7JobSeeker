import React, { useState } from 'react';
import { Sparkles, Send, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import type { CbsAiDoubtResponse } from '../../types';

interface CbsAiAssistantProps {
  dayNumber: number;
  dayTitle: string;
}

export const CbsAiAssistant: React.FC<CbsAiAssistantProps> = ({ dayNumber, dayTitle }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<CbsAiDoubtResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quickQuestions = [
    'প্রোডাকশন সিস্টেমে সরাসরি UPDATE কেন নিষিদ্ধ?',
    'লগ অ্যানালাইসিসে Correlation ID কীভাবে কাজ করে?',
    'EOD ব্যাচ ফেইল করলে রোলব্যাক করার পূর্বশর্ত কী?'
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.cbsSprint.askAi({
        dayNumber,
        topic: dayTitle,
        question: q
      });
      setResponse(res);
      if (queryText) setQuestion(queryText);
    } catch (err: any) {
      setError(err?.message || 'AI উত্তর সংগ্রহ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 rounded-2xl p-5 sm:p-7 text-white shadow-xl space-y-5 border border-teal-500/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-teal-500/20 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center space-x-2">
              <span>CBS AI Technical Lead</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30">
                Gemini 2.0
              </span>
            </h3>
            <p className="text-xs text-teal-200/70 mt-0.5">
              Day {dayNumber} বিষয়ক যেকোনো ডাউট, আর্কিটেকচারাল কারণ বা ট্রাবলশুটিং প্রশ্ন জিজ্ঞেস করুন
            </p>
          </div>
        </div>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="text-[10px] font-extrabold text-teal-300/60 uppercase tracking-wider self-center mr-1">
          কুইক প্রশ্ন:
        </span>
        {quickQuestions.map((chip, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleAsk(chip)}
            className="text-[11px] bg-slate-800/80 hover:bg-teal-900/60 text-teal-200 border border-teal-500/30 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer text-left"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleAsk()}
            placeholder="যেমন: এই কুয়েরিতে deadlock হওয়ার ঝুঁকি কীভাবে পরিহার করব?"
            className="w-full bg-slate-900/90 border border-teal-500/40 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50"
          />
        </div>
        <button
          disabled={isLoading || !question.trim()}
          onClick={() => handleAsk()}
          className={`p-3 rounded-xl transition-all flex items-center justify-center shrink-0 ${
            isLoading || !question.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-teal-500 text-slate-950 hover:bg-teal-400 font-black active:scale-95 cursor-pointer shadow-lg shadow-teal-500/20'
          }`}
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* AI Response Card */}
      {response && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-teal-500/30 space-y-4 animate-in fade-in duration-300">
          {/* Senior Insight Callout */}
          {response.seniorInsight && (
            <div className="flex items-start space-x-2.5 bg-teal-950/60 border border-teal-500/40 p-3 rounded-lg text-teal-200 text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-teal-300 block mb-0.5 uppercase tracking-wider text-[10px]">
                  Senior Architect Rule of Thumb
                </span>
                <span className="font-medium">{response.seniorInsight}</span>
              </div>
            </div>
          )}

          {/* Main Answer */}
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2 whitespace-pre-line font-normal">
            {response.answer}
          </div>

          {/* Related Topics Pills */}
          {response.relatedTopicsToReview?.length > 0 && (
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                সম্পর্কিত টপিক:
              </span>
              {response.relatedTopicsToReview.map((topic, tIdx) => (
                <span
                  key={tIdx}
                  className="bg-slate-800 border border-slate-700 text-teal-300 px-2 py-0.5 rounded text-[10px] font-semibold"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

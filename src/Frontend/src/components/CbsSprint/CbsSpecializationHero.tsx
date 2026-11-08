import React from 'react';
import {
  Award,
  BookOpen,
  Clock,
  Download,
  Layers,
  PlayCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import type { CbsCurriculumItem, CbsProgress, User } from '../../types';

interface CbsSpecializationHeroProps {
  curriculum: CbsCurriculumItem[];
  progress: CbsProgress;
  user: User | null;
  onResumeLesson: (dayNumber: number) => void;
  onOpenCertificate: () => void;
  onDownloadFullDossier: () => void;
}

export const CbsSpecializationHero: React.FC<CbsSpecializationHeroProps> = ({
  curriculum,
  progress,
  onResumeLesson,
  onOpenCertificate,
  onDownloadFullDossier
}) => {
  const completedCount = progress.completedDays.length;
  const totalDays = curriculum.length || 14;
  const percentage = Math.round((completedCount / totalDays) * 100);

  // Find next incomplete day
  let nextDay = 1;
  for (let i = 1; i <= totalDays; i++) {
    if (!progress.completedDays.includes(i)) {
      nextDay = i;
      break;
    }
  }

  const isAllComplete = completedCount === totalDays;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-teal-500/20 relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Specialization Pill Header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Specialization Track</span>
          </span>
          <span className="text-xs font-semibold text-slate-300">
            Offered by <span className="font-bold text-teal-200">teamS7 Enterprise Intelligence</span>
          </span>
          <span className="hidden sm:inline-block text-slate-500">·</span>
          <span className="text-xs text-slate-400 hidden sm:inline-block">Banking & Fintech Systems</span>
        </div>

        {/* Title and Short Description */}
        <div className="space-y-2 max-w-4xl">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Junior Software Engineer (Service) — Current & NextGen CBS Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl font-normal">
            একটি হ্যান্ডস-অন ১৪ দিনের প্রফেশনাল স্পেশালাইজেশন—যাতে SQL Server OLTP ফরেনসিক্স, ডাবল-এন্ট্রি অ্যাকাউন্টিং লেজার, লিনাক্স সার্ভিসেস ও প্রসেস ডায়াগনস্টিকস, ডকার কনটেইনার অপারেশনস এবং কোর ব্যাংকিং EOD ব্যাচ ইনসিডেন্ট ম্যানেজমেন্ট নিখুঁতভাবে কভার করা হয়েছে।
          </p>
        </div>

        {/* Stats Strip */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-2 text-xs border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="text-slate-300 font-medium">আনুমানিক <strong className="text-white">২২ ঘণ্টা</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium"><strong className="text-white">৪টি মডিউল</strong> (১৪টি পাঠ)</span>
          </div>

          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span className="text-slate-300 font-medium"><strong className="text-white">৫০+ ল্যাব ও সিনারিও</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-medium"><strong className="text-white">সেলফ-পেসড</strong> লার্নিং</span>
          </div>
        </div>

        {/* Progress Card & Action Buttons */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-teal-500/20">
          {/* Left Progress Bar */}
          <div className="space-y-2 flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-teal-200">স্পেশালাইজেশন অগ্রগতি</span>
              <span className="text-white font-mono">{completedCount} / {totalDays} Days ({percentage}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300 h-full transition-all duration-500 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Right Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onResumeLesson(nextDay)}
              className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center space-x-2 transition-all active:scale-95 shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>
                {isAllComplete ? 'পুনরায় রিভিশন করুন (Day 1)' : `শেখা শুরু করুন: Day ${nextDay}`}
              </span>
            </button>

            <button
              onClick={onOpenCertificate}
              className={`px-4 py-3 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all border ${
                isAllComplete
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 cursor-pointer shadow-md'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700 cursor-pointer'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>{isAllComplete ? 'সার্টিফিকেট ডাউনলোড করুন' : 'সার্টিফিকেট প্রিভিউ'}</span>
            </button>

            <button
              onClick={onDownloadFullDossier}
              title="সম্পূর্ণ সিলেবাস অফলাইন Markdown হিসেবে নামিয়ে নিন"
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

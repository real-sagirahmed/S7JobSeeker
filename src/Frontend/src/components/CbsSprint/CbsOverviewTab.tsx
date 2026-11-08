import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Database,
  Layers,
  Server,
  Terminal,
  Zap,
  ArrowRight
} from 'lucide-react';

interface CbsOverviewTabProps {
  onGoToCurriculum: (dayNumber?: number) => void;
}

export const CbsOverviewTab: React.FC<CbsOverviewTabProps> = ({ onGoToCurriculum }) => {
  const competencies = [
    'প্রোডাকশন ডেটাবেসে লক না ফেলে হাই-কনকারেন্ট OLTP টেবিলে Read-Only SQL ইনভেস্টিগেশন চালানো।',
    'ডাবল-এন্ট্রি অ্যাকাউন্টিং ইনভ্যারিয়েন্ট (Debit = Credit) যাচাই করে লেজার ইমব্যালেন্স শনাক্ত করা।',
    'Correlation ID ও systemd journalctl দিয়ে মাইক্রোসার্ভিস ও ব্যাকএন্ডের ফেইল্ড ট্রানজ্যাকশন ট্রেস করা।',
    'ডকার কনটেইনারের এক্সিট কোড ও এরর লগ বিশ্লেষণ করে ফেইল্ড সার্ভিস রিস্টার্ট ও আইসোলেট করা।',
    'কোর ব্যাংকিং EOD (End of Day) ব্যাচ প্রসেসিং মনিটরিং ও ফেইল্ড ব্যাচ ট্রাবলশুট করা।',
    'SLA গাইডলাইন মেনে L1/L2 ইনসিডেন্ট টিকেট তৈরি, 5-Whys RCA ডকুমেন্টেশন ও রোলব্যাক ভেরিফিকেশন সম্পন্ন করা।'
  ];

  const skills = [
    'SQL Server / T-SQL',
    'Index Seek & Execution Plans',
    'ACID & Idempotency',
    'Double-Entry Accounting',
    'General Ledger Reconciliation',
    'Linux Bash & Permissions',
    'systemctl & journalctl',
    'Docker & Container Logs',
    'Docker Compose & ASP.NET Core',
    'CBS EOD Batch Monitoring',
    'UAT & Data Migration QA',
    'L1/L2 Incident Management',
    'Root Cause Analysis (RCA)',
    'Release & Rollback Verification'
  ];

  const modules = [
    {
      number: 1,
      title: 'Relational Database & SQL Forensics',
      days: 'Day 1 – 3',
      estimatedHours: '৫ ঘণ্টা',
      icon: <Database className="w-5 h-5 text-emerald-600" />,
      description: 'OLTP ব্যাংকিং টেবিল, কাস্টমার ফিল্টারিং, মাল্টিপল টেবিল JOIN, Aggregates, সাব-কোয়েরি, CTE এবং ট্রানজ্যাকশন ডেডলক ও ডুপ্লিকেট শনাক্তকরণ।'
    },
    {
      number: 2,
      title: 'Banking Accounting & General Ledger Invariants',
      days: 'Day 4 – 5',
      estimatedHours: '৩.৫ ঘণ্টা',
      icon: <Layers className="w-5 h-5 text-amber-600" />,
      description: 'অ্যাকাউন্টিং ইকুয়েশন, অ্যাকাউন্ট টাইপস, Debit/Credit নরমাল ব্যালেন্স, জার্নাল এন্ট্রি, লেজার পোস্টিং ও ব্যাংক রিকনসিলিয়েশন।'
    },
    {
      number: 3,
      title: 'Linux & Docker Infrastructure Operations',
      days: 'Day 6 – 9',
      estimatedHours: '৭ ঘণ্টা',
      icon: <Terminal className="w-5 h-5 text-sky-600" />,
      description: 'লিনাক্স ফাইলসিস্টেম, পারমিশন, প্রসেস ট্রাবলশুটিং, সার্ভিস লগస్, নেটওয়ার্ক পোর্টস, ডকার কনটেইনার লাইফসাইকেল ও ASP.NET Core লোকাল ল্যাব।'
    },
    {
      number: 4,
      title: 'Core Banking Systems, Incident Response & Certification',
      days: 'Day 10 – 14',
      estimatedHours: '৬.৫ ঘণ্টা',
      icon: <Server className="w-5 h-5 text-teal-600" />,
      description: 'CBS আর্কিটেকচার, EOD ব্যাচ ও Idempotency, UAT ও ডেটা মাইগ্রেশন টেস্ট, L1/L2 ইনসিডেন্ট RCA, রোলব্যাক ভেরিফিকেশন ও ফাইনাল মক ইন্টারভিউ।'
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* What You'll Learn Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-teal-100/70 text-teal-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              What You Will Learn (মূল দক্ষতা ও সক্ষমতা)
            </h2>
            <p className="text-xs text-slate-500">
              এই ১৪ দিনের স্পেশালাইজেশন সম্পন্ন করলে একজন CBS সাপোর্ট ইঞ্জিনিয়ার হিসেবে নিচের দক্ষতাগুলো অর্জন করবেন:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {competencies.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs sm:text-sm text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Gained Pills */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Skills You Will Gain (অর্জিত টেকনিক্যাল স্কিলস)
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {skills.map((skill, sIdx) => (
            <span
              key={sIdx}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200/80 shadow-2xs"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* 4-Module Syllabus Roadmap */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Specialization Modules (৪টি মডিউলের বিস্তারিত রোডম্যাপ)
            </h2>
            <p className="text-xs text-slate-500">
              Coursera কাঠামোর মত ধাপে ধাপে ফাউন্ডেশন থেকে অ্যাডভান্সড ইনসিডেন্ট ম্যানেজমেন্ট
            </p>
          </div>
          <button
            onClick={() => onGoToCurriculum()}
            className="text-xs font-black text-teal-700 hover:text-teal-900 flex items-center space-x-1 cursor-pointer"
          >
            <span>সম্পূর্ণ কারিকুলাম দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((m) => (
            <div
              key={m.number}
              onClick={() => onGoToCurriculum(m.number === 1 ? 1 : m.number === 2 ? 4 : m.number === 3 ? 6 : 10)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-3 hover:border-teal-500/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-teal-50 transition-colors">
                    {m.icon}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Module {m.number} · {m.days}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{m.estimatedHours}</span>
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-teal-800 transition-colors">
                {m.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {m.description}
              </p>

              <div className="pt-2 flex items-center text-xs font-bold text-teal-700 group-hover:translate-x-1 transition-transform space-x-1">
                <span>মডিউলের পাঠ শুরু করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certification Criteria Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-teal-50/30 to-white rounded-2xl border border-amber-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Certificate of CBS Readiness অর্জনের শর্তাবলি
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              প্রতিটি দিনের পাঠ ও সেলফ-চেক অ্যাসেসমেন্টে ন্যূনতম <strong>৭০% পাসিং স্কোর</strong> অর্জন করতে হবে। ১৪ দিন সফলভাবে সম্পন্ন হলে স্বয়ংক্রিয়ভাবে একটি ভেরিফাইড Coursera-স্টাইল ডিজিটাল সার্টিফিকেট তৈরি হবে।
            </p>
          </div>
        </div>

        <button
          onClick={() => onGoToCurriculum(1)}
          className="px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-black text-xs shrink-0 transition-all active:scale-95 shadow-md cursor-pointer"
        >
          Day 1 থেকে শুরু করুন
        </button>
      </div>
    </div>
  );
};

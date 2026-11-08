import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Database,
  Layers,
  RefreshCw,
  Server,
  Terminal
} from 'lucide-react';
import type { CbsCurriculumItem, CbsDayLesson, CbsProgress } from '../../types';
import { CbsLessonView } from './CbsLessonView';

interface CbsCurriculumTabProps {
  curriculum: CbsCurriculumItem[];
  progress: CbsProgress;
  activeLesson: CbsDayLesson | null;
  isLoadingLesson?: boolean;
  onSelectDay: (dayNumber: number) => void;
  onClearActiveLesson: () => void;
  onToggleComplete: (dayNumber: number, completed: boolean) => void;
  onSaveQuizScore: (dayNumber: number, score: number) => void;
}

export const CbsCurriculumTab: React.FC<CbsCurriculumTabProps> = ({
  curriculum,
  progress,
  activeLesson,
  isLoadingLesson = false,
  onSelectDay,
  onClearActiveLesson,
  onToggleComplete,
  onSaveQuizScore
}) => {
  // Define 4 modules
  const modules = [
    {
      id: 1,
      title: 'Module 1: Relational Database & SQL Forensics',
      description: 'OLTP ডেটাবেস আর্কিটেকচার, কাস্টমার ফিল্টারিং, মাল্টিপল টেবিল JOINs, Aggregates, সাব-কোয়েরি, CTE এবং ট্রানজ্যাকশন ডেডলক ও ডুপ্লিকেট শনাক্তকরণ।',
      dayRange: [1, 2, 3],
      icon: <Database className="w-5 h-5 text-emerald-600" />
    },
    {
      id: 2,
      title: 'Module 2: Banking Accounting & General Ledger Invariants',
      description: 'অ্যাকাউন্টিং ইকুয়েশন, অ্যাকাউন্ট টাইপস, Debit/Credit নরমাল ব্যালেন্স, জার্নাল এন্ট্রি, লেজার পোস্টিং ও ব্যাংক রিকনসিলিয়েশন।',
      dayRange: [4, 5],
      icon: <Layers className="w-5 h-5 text-amber-600" />
    },
    {
      id: 3,
      title: 'Module 3: Linux & Docker Infrastructure Operations',
      description: 'লিনাক্স ফাইলসিস্টেম, পারমিশন, প্রসেস ট্রাবলশুটিং, সার্ভিস লগస్, নেটওয়ার্ক পোর্টস, ডকার কনটেইনার লাইফসাইকেল ও ASP.NET Core লোকাল ল্যাব।',
      dayRange: [6, 7, 8, 9],
      icon: <Terminal className="w-5 h-5 text-sky-600" />
    },
    {
      id: 4,
      title: 'Module 4: Core Banking Systems, Incidents & Certification',
      description: 'CBS আর্কিটেকচার, EOD ব্যাচ ও Idempotency, UAT ও ডেটা মাইগ্রেশন টেস্ট, L1/L2 ইনসিডেন্ট RCA, রোলব্যাক ভেরিফিকেশন ও ফাইনাল মক ইন্টারভিউ।',
      dayRange: [10, 11, 12, 13, 14],
      icon: <Server className="w-5 h-5 text-teal-600" />
    }
  ];

  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true
  });

  const toggleModule = (modId: number) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const getModuleForDay = (day: number) => {
    return modules.find(m => m.dayRange.includes(day)) || modules[0];
  };

  if (isLoadingLesson) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-xs font-bold text-slate-600">Coursera লেসন কন্টেন্ট লোড হচ্ছে...</p>
      </div>
    );
  }

  // If a lesson is active, render In-Place Coursera Lesson Reader
  if (activeLesson) {
    const currentDay = activeLesson.dayNumber;
    const currentModule = getModuleForDay(currentDay);
    const hasPrevious = currentDay > 1;
    const hasNext = currentDay < 14;
    const isCompleted = progress.completedDays.includes(currentDay);

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Coursera-grade Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap py-1">
            <button
              onClick={onClearActiveLesson}
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Syllabus</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">{currentModule.title.split(':')[0]}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-black truncate max-w-[200px] sm:max-w-xs">
              Day {currentDay}: {activeLesson.subtitle}
            </span>
          </div>

          <button
            onClick={onClearActiveLesson}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            ← কারিকুলাম তালিকায় ফিরে যান
          </button>
        </div>

        {/* Main Lesson View */}
        <CbsLessonView
          lesson={activeLesson}
          progress={progress}
          onToggleComplete={onToggleComplete}
          onSaveQuizScore={onSaveQuizScore}
        />

        {/* Floating Bottom Coursera Navigation Bar */}
        <div className="sticky bottom-4 z-30 bg-slate-950/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-teal-500/30 flex items-center justify-between gap-4">
          <div>
            {hasPrevious ? (
              <button
                onClick={() => onSelectDay(currentDay - 1)}
                className="flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">পূর্ববর্তী পাঠ: Day {currentDay - 1}</span>
                <span className="sm:hidden">Day {currentDay - 1}</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          {/* Center Mark Complete */}
          <button
            onClick={() => onToggleComplete(currentDay, !isCompleted)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
              isCompleted
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>সম্পন্ন হয়েছে ✓</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span>পাঠটি সম্পন্ন মার্ক করুন</span>
              </>
            )}
          </button>

          <div>
            {hasNext ? (
              <button
                onClick={() => onSelectDay(currentDay + 1)}
                className="flex items-center space-x-2 text-xs font-bold text-teal-300 hover:text-teal-200 px-3 py-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
              >
                <span className="hidden sm:inline">পরবর্তী পাঠ: Day {currentDay + 1}</span>
                <span className="sm:hidden">Day {currentDay + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClearActiveLesson}
                className="flex items-center space-x-1.5 text-xs font-black text-amber-300 hover:text-amber-200 px-3 py-2 rounded-xl hover:bg-slate-800"
              >
                <Award className="w-4 h-4" />
                <span>কোর্স সম্পন্ন!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render Coursera 4-Module Syllabus Accordion
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Curriculum (মডিউল ও পাঠ তালিকা)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            যে পাঠটি পড়তে চান সেটিতে ক্লিক করুন। সম্পূর্ণ কন্টেন্ট, কোড ল্যাব ও সেলফ-চেক কুইজ তাৎক্ষণিক লোড হবে।
          </p>
        </div>

        <button
          onClick={() => {
            const allExpanded = Object.values(expandedModules).every(v => v);
            const newState = !allExpanded;
            setExpandedModules({ 1: newState, 2: newState, 3: newState, 4: newState });
          }}
          className="text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
        >
          {Object.values(expandedModules).every(v => v) ? 'সবগুলো কলাপস করুন' : 'সবগুলো এক্সপ্যান্ড করুন'}
        </button>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((m) => {
          const isExpanded = !!expandedModules[m.id];
          const moduleDays = curriculum.filter(item => m.dayRange.includes(item.dayNumber));
          const completedInModule = moduleDays.filter(d => progress.completedDays.includes(d.dayNumber)).length;
          const isModuleComplete = completedInModule === moduleDays.length && moduleDays.length > 0;

          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
            >
              {/* Module Accordion Header */}
              <div
                onClick={() => toggleModule(m.id)}
                className="p-5 sm:p-6 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-100"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                    {m.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        {m.dayRange.length} Days · Days {m.dayRange[0]}–{m.dayRange[m.dayRange.length - 1]}
                      </span>
                      {isModuleComplete && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Complete</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                      {m.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-700 block">
                      {completedInModule} / {moduleDays.length} সম্পন্ন
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {Math.round((completedInModule / (moduleDays.length || 1)) * 100)}%
                    </span>
                  </div>

                  <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Module Description & Lesson Items */}
              {isExpanded && (
                <div className="p-4 sm:p-6 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed border-b border-slate-100 pb-3">
                    {m.description}
                  </p>

                  <div className="divide-y divide-slate-100 space-y-1">
                    {moduleDays.map((item) => {
                      const isCompleted = progress.completedDays.includes(item.dayNumber);
                      const score = progress.quizScores[item.dayNumber.toString()];

                      return (
                        <div
                          key={item.dayNumber}
                          onClick={() => onSelectDay(item.dayNumber)}
                          className="pt-2 pb-2 px-3 rounded-xl hover:bg-teal-50/50 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {/* Checkmark */}
                            <div className="shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300 group-hover:text-teal-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-black uppercase text-teal-800 bg-teal-100/70 px-1.5 py-0.2 rounded">
                                  Day {item.dayNumber}
                                </span>
                                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{item.estimatedMinutes} মিনিট</span>
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-teal-950 truncate mt-0.5">
                                {item.subtitle || item.title}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            {score !== undefined ? (
                              <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                                score >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {score}%
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-teal-700 group-hover:underline flex items-center space-x-1">
                                <span>পাঠ খুলুন</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

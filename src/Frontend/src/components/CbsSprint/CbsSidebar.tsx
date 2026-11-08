import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Database,
  Terminal,
  Box,
  Server,
  Activity,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import type { CbsCurriculumItem, CbsProgress } from '../../types';

interface CbsSidebarProps {
  curriculum: CbsCurriculumItem[];
  selectedDay: number;
  progress: CbsProgress;
  onSelectDay: (dayNumber: number) => void;
  className?: string;
}

export const CbsSidebar: React.FC<CbsSidebarProps> = ({
  curriculum,
  selectedDay,
  progress,
  onSelectDay,
  className = ''
}) => {
  const completedCount = progress.completedDays.length;
  const percentage = Math.round((completedCount / (curriculum.length || 14)) * 100);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sql':
        return <Database className="w-4 h-4 text-emerald-600" />;
      case 'accounting':
        return <Layers className="w-4 h-4 text-amber-600" />;
      case 'linux':
        return <Terminal className="w-4 h-4 text-sky-600" />;
      case 'docker':
        return <Box className="w-4 h-4 text-blue-600" />;
      case 'cbs core':
        return <Server className="w-4 h-4 text-teal-600" />;
      case 'operations':
        return <Activity className="w-4 h-4 text-purple-600" />;
      case 'assessment':
        return <Award className="w-4 h-4 text-rose-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <aside className={`w-full lg:w-80 bg-white border-r border-slate-200/80 flex flex-col h-full shrink-0 ${className}`}>
      {/* Progress Header Card */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-teal-50/50 via-white to-slate-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-teal-900">14-Day Sprint Roadmap</span>
          </div>
          <span className="text-xs font-black text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
            {completedCount} / {curriculum.length || 14} Days ({percentage}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Days List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {curriculum.map((item) => {
          const isSelected = item.dayNumber === selectedDay;
          const isCompleted = progress.completedDays.includes(item.dayNumber);
          const score = progress.quizScores[item.dayNumber.toString()];

          return (
            <button
              key={item.dayNumber}
              onClick={() => onSelectDay(item.dayNumber)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-start space-x-3 group active:scale-[0.99] ${
                isSelected
                  ? 'bg-teal-50/90 border border-teal-500/30 shadow-xs'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              {/* Completed Status Check */}
              <div className="pt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                ) : (
                  <Circle className={`w-5 h-5 ${isSelected ? 'text-teal-400' : 'text-slate-300'}`} />
                )}
              </div>

              {/* Day Meta & Title */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center space-x-1.5">
                    {getCategoryIcon(item.category)}
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Day {item.dayNumber} · {item.category}
                    </span>
                  </div>
                  {score !== undefined && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                      score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {score}%
                    </span>
                  )}
                </div>

                <p className={`text-xs font-bold leading-snug line-clamp-2 ${
                  isSelected ? 'text-teal-950 font-black' : 'text-slate-800 group-hover:text-teal-800'
                }`}>
                  {item.subtitle || item.title}
                </p>

                <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500">
                  <span className="flex items-center space-x-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{item.estimatedMinutes}m</span>
                  </span>
                  {item.topicTags.slice(0, 2).map((tag, tIdx) => (
                    <span key={tIdx} className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 text-[9px] font-medium truncate max-w-[80px]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

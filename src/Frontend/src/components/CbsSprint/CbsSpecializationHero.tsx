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
import { useLanguage } from '../../context/LanguageContext';
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
  const { t, language } = useLanguage();
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
            <span>{t.cbsHero.track}</span>
          </span>
          <span className="text-xs font-semibold text-slate-300">
            {t.cbsHero.offeredBy} <span className="font-bold text-teal-200">{t.cbsHero.offeredByTeam}</span>
          </span>
          <span className="hidden sm:inline-block text-slate-500">·</span>
          <span className="text-xs text-slate-400 hidden sm:inline-block">{t.cbsHero.domain}</span>
        </div>

        {/* Title and Short Description */}
        <div className="space-y-2 max-w-4xl">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            {t.cbsHero.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl font-normal">
            {t.cbsHero.subtitle}
          </p>
        </div>

        {/* Stats Strip */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-2 text-xs border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="text-slate-300 font-medium">{t.cbsHero.approxHours}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">{t.cbsHero.modules}</span>
          </div>

          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span className="text-slate-300 font-medium">{t.cbsHero.labs}</span>
          </div>

          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-medium">{t.cbsHero.selfPaced}</span>
          </div>
        </div>

        {/* Progress Card & Action Buttons */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-teal-500/20">
          {/* Left Progress Bar */}
          <div className="space-y-2 flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-teal-200">{t.cbsHero.progress}</span>
              <span className="text-white font-mono">{completedCount} / {totalDays} {language === 'bn' ? 'দিন' : 'Days'} ({percentage}%)</span>
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
                {isAllComplete ? t.cbsHero.revisionDay1 : `${t.cbsHero.startLearning} ${nextDay}`}
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
              <span>{isAllComplete ? t.cbsHero.downloadCert : t.cbsHero.previewCert}</span>
            </button>

            <button
              onClick={onDownloadFullDossier}
              title={t.cbsHero.downloadBlueprint}
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

import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { CbsCurriculumItem, CbsProgress } from '../../types';

interface CbsGradesTabProps {
  curriculum: CbsCurriculumItem[];
  progress: CbsProgress;
  onOpenDay: (dayNumber: number) => void;
  onOpenCertificate: () => void;
}

export const CbsGradesTab: React.FC<CbsGradesTabProps> = ({
  curriculum,
  progress,
  onOpenDay,
  onOpenCertificate
}) => {
  const { t, language } = useLanguage();
  const scores = Object.values(progress.quizScores);
  const attemptedCount = scores.length;
  const averageScore = attemptedCount > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / attemptedCount)
    : 0;

  const isAllComplete = progress.completedDays.length === (curriculum.length || 14);
  const isCertificateReady = isAllComplete && (attemptedCount >= 10 && averageScore >= 70);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Grades Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {t.cbsGrades.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.cbsGrades.subtitle}
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-teal-50 border border-teal-200/80 px-4 py-2.5 rounded-2xl">
            <TrendingUp className="w-5 h-5 text-teal-700" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 block">
                {t.cbsGrades.avgScore}
              </span>
              <span className="text-lg font-black text-teal-950">{averageScore}%</span>
            </div>
          </div>
        </div>

        {/* Certificate Status Banner */}
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isCertificateReady
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-emerald-300'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-start space-x-3.5">
            <div className={`p-2.5 rounded-xl text-white shrink-0 shadow-md ${
              isCertificateReady ? 'bg-amber-400 text-slate-950' : 'bg-slate-400'
            }`}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {isCertificateReady ? t.cbsGrades.certReadyTitle : t.cbsGrades.certProgressTitle}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {isCertificateReady
                  ? t.cbsGrades.certReadyDesc
                  : (language === 'bn'
                      ? `সার্টিফিকেট আনলক করতে ১৪টি পাঠ সম্পন্ন করুন (বর্তমান: ${progress.completedDays.length}/14) এবং গড় স্কোর ৭০% রাখুন।`
                      : `Complete all 14 lessons to unlock certificate (Current: ${progress.completedDays.length}/14) and maintain 70%+ average score.`
                    )
                }
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCertificate}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 active:scale-95 cursor-pointer shadow-md ${
              isCertificateReady
                ? 'bg-teal-900 hover:bg-teal-950 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            {isCertificateReady ? t.cbsGrades.viewCert : (language === 'bn' ? 'সার্টিফিকেট প্রিভিউ' : 'Certificate Preview')}
          </button>
        </div>

        {/* Gradebook Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">{language === 'bn' ? 'পাঠ ও অ্যাসেসমেন্ট' : 'Lesson & Assessment'}</th>
                <th className="py-3 px-3">{t.common.status}</th>
                <th className="py-3 px-3">{language === 'bn' ? 'পাসিং গ্রেড' : 'Passing Grade'}</th>
                <th className="py-3 px-3">{language === 'bn' ? 'আপনার স্কোর' : 'Your Score'}</th>
                <th className="py-3 px-3 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {curriculum.map((item) => {
                const score = progress.quizScores[item.dayNumber.toString()];
                const isAttempted = score !== undefined;
                const isPassed = isAttempted && score >= 70;

                return (
                  <tr key={item.dayNumber} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        Day {item.dayNumber}: {item.subtitle || item.title}
                      </div>
                      <span className="text-[10px] text-slate-400">{item.category}</span>
                    </td>

                    <td className="py-3 px-3">
                      {isAttempted ? (
                        <span className={`inline-flex items-center space-x-1 font-bold ${
                          isPassed ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{isPassed ? 'Passed' : 'Needs Review'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          {language === 'bn' ? 'অসম্পূর্ণ' : 'Not Attempted'}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-500 font-semibold">
                      70%
                    </td>

                    <td className="py-3 px-3">
                      {isAttempted ? (
                        <span className={`font-black font-mono px-2 py-0.5 rounded ${
                          isPassed ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {score}%
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onOpenDay(item.dayNumber)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-teal-800 hover:bg-teal-50 border border-teal-200 transition-all cursor-pointer inline-flex items-center space-x-1"
                      >
                        <span>{isAttempted ? (language === 'bn' ? 'রিটেক করুন' : 'Retake') : (language === 'bn' ? 'কুইজ শুরু করুন' : 'Start Quiz')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

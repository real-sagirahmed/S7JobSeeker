import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Layers,
  RefreshCw,
  Sparkles,
  Terminal
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import type { User, CbsCurriculumItem, CbsDayLesson, CbsProgress } from '../../types';
import { CbsSpecializationHero } from './CbsSpecializationHero';
import { CbsOverviewTab } from './CbsOverviewTab';
import { CbsCurriculumTab } from './CbsCurriculumTab';
import { CbsLabsTab } from './CbsLabsTab';
import { CbsGradesTab } from './CbsGradesTab';
import { CbsAiMentorTab } from './CbsAiMentorTab';
import { CbsCertificateModal } from './CbsCertificateModal';

interface CbsSprintPortalProps {
  user: User | null;
  onOpenAuth: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const LOCAL_STORAGE_KEY = 'cbs_sprint_guest_progress';
type CbsTabType = 'overview' | 'curriculum' | 'labs' | 'grades' | 'mentor';

export const CbsSprintPortal: React.FC<CbsSprintPortalProps> = ({
  user,
  onOpenAuth,
  showToast
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<CbsTabType>('overview');
  const [curriculum, setCurriculum] = useState<CbsCurriculumItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeLesson, setActiveLesson] = useState<CbsDayLesson | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState<boolean>(true);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);

  const [progress, setProgress] = useState<CbsProgress>({
    completedDays: [],
    quizScores: {},
    checklist: {},
    lastAccessedDay: 1,
    updatedAt: new Date().toISOString()
  });

  // 1. Initial Load: Curriculum & Progress
  useEffect(() => {
    const initSprint = async () => {
      setIsLoadingCurriculum(true);
      try {
        const curr = await api.cbsSprint.getCurriculum();
        setCurriculum(curr);

        let prog: CbsProgress = {
          completedDays: [],
          quizScores: {},
          checklist: {},
          lastAccessedDay: 1,
          updatedAt: new Date().toISOString()
        };

        if (user) {
          try {
            prog = await api.cbsSprint.getProgress();
          } catch {
            // fallback
          }
        } else {
          const localStr = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localStr) {
            try {
              prog = JSON.parse(localStr);
            } catch {}
          }
        }

        setProgress(prog);
        const dayToLoad = prog.lastAccessedDay >= 1 && prog.lastAccessedDay <= 14 ? prog.lastAccessedDay : 1;
        setSelectedDay(dayToLoad);
      } catch {
        showToast(language === 'bn' ? 'কারিকুলাম লোড করতে সমস্যা হয়েছে।' : 'Failed to load curriculum.', 'error');
      } finally {
        setIsLoadingCurriculum(false);
      }
    };

    initSprint();
  }, [user]);

  // 2. Select & Load a Day Lesson
  const handleSelectDay = async (dayNumber: number) => {
    setIsLoadingLesson(true);
    setSelectedDay(dayNumber);
    setActiveTab('curriculum');

    try {
      const lesson = await api.cbsSprint.getDayLesson(dayNumber);
      setActiveLesson(lesson);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } catch {
      showToast(language === 'bn' ? `Day ${dayNumber} লেসন লোড করা যায়নি।` : `Failed to load Day ${dayNumber} lesson.`, 'error');
    } finally {
      setIsLoadingLesson(false);
    }
  };

  // 3. Clear Active Lesson (Back to 4-Module Syllabus Accordion)
  const handleClearActiveLesson = () => {
    setActiveLesson(null);
  };

  // 4. Toggle Day Completion
  const handleToggleComplete = async (dayNumber: number, completed: boolean) => {
    const updatedCompletedDays = completed
      ? Array.from(new Set([...progress.completedDays, dayNumber]))
      : progress.completedDays.filter(d => d !== dayNumber);

    const newProg: CbsProgress = {
      ...progress,
      completedDays: updatedCompletedDays,
      lastAccessedDay: dayNumber,
      updatedAt: new Date().toISOString()
    };

    setProgress(newProg);

    if (user) {
      try {
        await api.cbsSprint.updateProgress({
          dayNumber,
          markCompleted: completed
        });
        showToast(completed ? (language === 'bn' ? `Day ${dayNumber} সম্পন্ন মার্ক হয়েছে!` : `Day ${dayNumber} marked as completed!`) : (language === 'bn' ? `Day ${dayNumber} অসম্পূর্ণ মার্ক করা হয়েছে।` : `Day ${dayNumber} marked as incomplete.`), 'success');
      } catch {
        showToast(language === 'bn' ? 'প্রোগ্রেস সার্ভারে সিঙ্ক করতে সমস্যা হয়েছে।' : 'Failed to sync progress with server.', 'error');
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProg));
      showToast(completed ? (language === 'bn' ? `Day ${dayNumber} সম্পন্ন মার্ক হয়েছে!` : `Day ${dayNumber} marked as completed!`) : (language === 'bn' ? `Day ${dayNumber} অসম্পূর্ণ মার্ক হয়েছে।` : `Day ${dayNumber} marked as incomplete.`), 'info');
    }
  };

  // 5. Save Quiz Score
  const handleSaveQuizScore = async (dayNumber: number, score: number) => {
    const newProg: CbsProgress = {
      ...progress,
      quizScores: {
        ...progress.quizScores,
        [dayNumber.toString()]: score
      },
      completedDays: score >= 70 && !progress.completedDays.includes(dayNumber)
        ? [...progress.completedDays, dayNumber]
        : progress.completedDays,
      lastAccessedDay: dayNumber,
      updatedAt: new Date().toISOString()
    };

    setProgress(newProg);

    if (user) {
      try {
        await api.cbsSprint.updateProgress({
          dayNumber,
          quizScore: score,
          markCompleted: score >= 70 ? true : undefined
        });
        showToast(language === 'bn' ? `Day ${dayNumber} কুইজ স্কোর (${score}%) সংরক্ষিত হয়েছে!` : `Day ${dayNumber} quiz score (${score}%) saved!`, 'success');
      } catch {
        showToast(language === 'bn' ? 'কুইজ স্কোর সিঙ্ক করতে সমস্যা হয়েছে।' : 'Failed to sync quiz score with server.', 'error');
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProg));
      showToast(language === 'bn' ? `কুইজ স্কোর (${score}%) ব্রাউজারে সংরক্ষিত হয়েছে।` : `Quiz score (${score}%) saved in local storage.`, 'info');
    }
  };

  // 6. Download Full 14-Day Blueprint (Instant Single-Endpoint Export with Fallback)
  const handleDownloadFullDossier = async () => {
    try {
      showToast(language === 'bn' ? 'সম্পূর্ণ ১৪ দিনের স্পেশালাইজেশন ব্লুপ্রিন্ট প্রস্তুত হচ্ছে...' : 'Preparing full 14-day specialization blueprint...', 'info');

      let fullContent = '';
      let fileName = 'CBS-Support-14-Day-Specialization-Blueprint.md';

      try {
        // Fast single-endpoint export (<50ms)
        const exportRes = await api.cbsSprint.exportAllLessons();
        fullContent = exportRes.fullContent;
        if (exportRes.fileName) fileName = exportRes.fileName;
      } catch (err) {
        console.warn('Single-endpoint export failed, falling back to parallel fetch:', err);
        // Resilient parallel fallback using Promise.all instead of sequential loop
        const lessonPromises = Array.from({ length: 14 }, (_, i) => api.cbsSprint.getDayLesson(i + 1));
        const allLessons = await Promise.all(lessonPromises);
        fullContent =
          `# Junior Software Engineer (Service) – Current & NextGen CBS Support\n## 14-Day Comprehensive Specialization Master Blueprint\n\nGenerated on: ${new Date().toLocaleString()}\n\n---\n\n` +
          allLessons.map((l) => l.exportMarkdown).join('\n\n---\n\n');
      }

      const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(language === 'bn' ? 'সম্পূর্ণ ১৪ দিনের ব্লুপ্রিন্ট সফলভাবে ডাউনলোড হয়েছে!' : 'Full 14-day blueprint downloaded successfully!', 'success');
    } catch {
      showToast(language === 'bn' ? 'ব্লুপ্রিন্ট ডাউনলোড করতে সমস্যা হয়েছে।' : 'Failed to download blueprint.', 'error');
    }
  };

  const scores = Object.values(progress.quizScores);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  if (isLoadingCurriculum) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">{language === 'bn' ? 'teamS7 CBS ইমার্শন লোড হচ্ছে...' : 'Loading teamS7 CBS Immersion...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Guest Mode Alert Banner */}
      {!user && (
        <div className="bg-teal-50 border-b border-teal-100 px-4 py-2 text-center text-xs text-teal-900 font-medium">
          <span>
            {language === 'bn'
              ? 'গেস্ট মোডে আছেন। ১৪টি পাঠ, ল্যাব ও সেলফ-চেক কুইজ উন্মুক্ত। সব ডিভাইসে প্রোগ্রেস ও সার্টিফিকেট পারসিস্ট করতে '
              : 'You are in Guest Mode. All 14 lessons, diagnostic labs and quizzes are accessible. To persist progress and credentials across devices, '}
          </span>
          <button onClick={onOpenAuth} className="font-black text-teal-700 underline hover:text-teal-950 cursor-pointer ml-1">
            {language === 'bn' ? 'লগইন বা ফ্রি সাইনআপ করুন' : 'Sign In or Register Free'}
          </button>
        </div>
      )}

      {/* Main Specialization Container */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* teamS7 Specialization Hero Banner */}
        <CbsSpecializationHero
          curriculum={curriculum}
          progress={progress}
          user={user}
          onResumeLesson={(day) => handleSelectDay(day)}
          onOpenCertificate={() => setIsCertificateOpen(true)}
          onDownloadFullDossier={handleDownloadFullDossier}
        />

        {/* teamS7 5-Tab Navigation Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center overflow-x-auto gap-1">
          {[
            { id: 'overview', label: t.cbs.overviewTab, icon: <BookOpen className="w-4 h-4" /> },
            { id: 'curriculum', label: t.cbs.curriculumTab, icon: <Layers className="w-4 h-4" /> },
            { id: 'labs', label: t.cbs.labsTab, icon: <Terminal className="w-4 h-4" /> },
            { id: 'grades', label: language === 'bn' ? 'গ্রেডবুক ও এসেসমেন্ট' : 'Grades & Assessment', icon: <Award className="w-4 h-4" /> },
            { id: 'mentor', label: language === 'bn' ? 'এআই মেন্টর' : 'AI Mentor', icon: <Sparkles className="w-4 h-4" /> }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as CbsTabType);
                  if (tab.id !== 'curriculum') {
                    setActiveLesson(null);
                  }
                }}
                className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 whitespace-nowrap active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-teal-900 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === 'overview' && (
            <CbsOverviewTab
              onGoToCurriculum={(dayNum) => {
                if (dayNum) handleSelectDay(dayNum);
                else {
                  setActiveTab('curriculum');
                  setActiveLesson(null);
                }
              }}
            />
          )}

          {activeTab === 'curriculum' && (
            <CbsCurriculumTab
              curriculum={curriculum}
              progress={progress}
              activeLesson={activeLesson}
              isLoadingLesson={isLoadingLesson}
              onSelectDay={(dayNum) => handleSelectDay(dayNum)}
              onClearActiveLesson={handleClearActiveLesson}
              onToggleComplete={handleToggleComplete}
              onSaveQuizScore={handleSaveQuizScore}
            />
          )}

          {activeTab === 'labs' && (
            <CbsLabsTab
              onOpenDay={(dayNum) => handleSelectDay(dayNum)}
            />
          )}

          {activeTab === 'grades' && (
            <CbsGradesTab
              curriculum={curriculum}
              progress={progress}
              onOpenDay={(dayNum) => handleSelectDay(dayNum)}
              onOpenCertificate={() => setIsCertificateOpen(true)}
            />
          )}

          {activeTab === 'mentor' && (
            <CbsAiMentorTab
              curriculum={curriculum}
              selectedDay={selectedDay}
            />
          )}
        </div>
      </div>

      {/* Official Certificate Modal */}
      <CbsCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        user={user}
        completedCount={progress.completedDays.length}
        averageScore={averageScore}
        certificateId={progress.certificateId}
        certificateIssuedAt={progress.certificateIssuedAt}
      />
    </div>
  );
};

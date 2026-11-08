import React, { useState, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { api } from '../../services/api';
import type { User, CbsCurriculumItem, CbsDayLesson, CbsProgress } from '../../types';
import { CbsSidebar } from './CbsSidebar';
import { CbsLessonView } from './CbsLessonView';

interface CbsSprintPortalProps {
  user: User | null;
  onOpenAuth: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const LOCAL_STORAGE_KEY = 'cbs_sprint_guest_progress';

export const CbsSprintPortal: React.FC<CbsSprintPortalProps> = ({
  user,
  onOpenAuth,
  showToast
}) => {
  const [curriculum, setCurriculum] = useState<CbsCurriculumItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [currentLesson, setCurrentLesson] = useState<CbsDayLesson | null>(null);
  const [progress, setProgress] = useState<CbsProgress>({
    completedDays: [],
    quizScores: {},
    checklist: {},
    lastAccessedDay: 1,
    updatedAt: new Date().toISOString()
  });

  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(true);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
            // fallback to local
          }
        } else {
          // Read from localStorage for guest
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
        loadLesson(dayToLoad);
      } catch (err: any) {
        showToast('কারিকুলাম লোড করতে সমস্যা হয়েছে।', 'error');
      } finally {
        setIsLoadingCurriculum(false);
      }
    };

    initSprint();
  }, [user]);

  // 2. Load Single Day Lesson
  const loadLesson = async (dayNumber: number) => {
    setIsLoadingLesson(true);
    try {
      const lesson = await api.cbsSprint.getDayLesson(dayNumber);
      setCurrentLesson(lesson);
      setSelectedDay(dayNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(`Day ${dayNumber} লেসন লোড করা যায়নি।`, 'error');
    } finally {
      setIsLoadingLesson(false);
      setIsMobileSidebarOpen(false);
    }
  };

  // 3. Toggle Day Complete
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
        showToast(completed ? `Day ${dayNumber} সফলভাবে সম্পন্ন হয়েছে!` : `Day ${dayNumber} অসম্পূর্ণ মার্ক করা হয়েছে।`, 'success');
      } catch {
        showToast('প্রোগ্রেস সার্ভারে সিঙ্ক করতে সমস্যা হয়েছে।', 'error');
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProg));
      showToast(completed ? `Day ${dayNumber} লোকালি সম্পন্ন মার্ক হয়েছে!` : `Day ${dayNumber} অসম্পূর্ণ মার্ক হয়েছে।`, 'info');
    }
  };

  // 4. Save Quiz Score
  const handleSaveQuizScore = async (dayNumber: number, score: number) => {
    const newProg: CbsProgress = {
      ...progress,
      quizScores: {
        ...progress.quizScores,
        [dayNumber.toString()]: score
      },
      // Automatically mark complete if score >= 60
      completedDays: score >= 60 && !progress.completedDays.includes(dayNumber)
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
          markCompleted: score >= 60 ? true : undefined
        });
        showToast(`Day ${dayNumber} কুইজ স্কোর (${score}%) সফলভাবে সংরক্ষিত হয়েছে!`, 'success');
      } catch {
        showToast('কুইজ স্কোর সিঙ্ক করতে সমস্যা হয়েছে।', 'error');
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProg));
      showToast(`কুইজ স্কোর (${score}%) ব্রাউজারে সংরক্ষিত হয়েছে।`, 'info');
    }
  };

  // 5. Download Full 14-Day Dossier
  const handleDownloadFullDossier = async () => {
    try {
      showToast('সম্পূর্ণ ১৪ দিনের ব্লুপ্রিন্ট প্রস্তুত হচ্ছে...', 'info');
      const allLessons: string[] = [];
      for (let i = 1; i <= 14; i++) {
        const l = await api.cbsSprint.getDayLesson(i);
        allLessons.push(l.exportMarkdown);
      }

      const fullContent = `# Junior Software Engineer (Service) – Current & NextGen CBS Support\n## 14-Day Comprehensive Preparation Master Blueprint\n\nGenerated on: ${new Date().toLocaleString()}\n\n---\n\n` + allLessons.join('\n\n---\n\n');

      const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CBS-Support-14-Day-Master-Blueprint.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('সম্পূর্ণ ১৪ দিনের ব্লুপ্রিন্ট ডাউনলোড হয়েছে!', 'success');
    } catch {
      showToast('ব্লুপ্রিন্ট ডাউনলোড করতে সমস্যা হয়েছে।', 'error');
    }
  };

  if (isLoadingCurriculum) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">CBS Sprint কারিকুলাম ও ল্যাব লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          {/* Mobile Sidebar Toggle & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 active:scale-95"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  CBS Support Sprint (14 Days)
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-200">
                  Self-Paced Track
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Junior Software Engineer (Service) – Current & NextGen CBS Support
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleDownloadFullDossier}
              title="সম্পূর্ণ ১৪ দিনের পাঠ এক ফাইলে ডাউনলোড করুন"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Full 14-Day Dossier (.md)</span>
            </button>

            {!user && (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black bg-[#007070] text-white hover:bg-[#005a5a] shadow-[0_4px_12px_rgba(0,112,112,0.2)] transition-all active:scale-95 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>লগইন করে সিঙ্ক করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Guest Warning Banner */}
        {!user && (
          <div className="bg-teal-50 border-t border-teal-100 px-4 py-1.5 text-center text-xs text-teal-900 font-medium">
            <span>বর্তমানে গেস্ট মোডে আছেন। প্রতিটি দিনের পাঠ ও ল্যাব সম্পূর্ণ উন্মুক্ত। সব ডিভাইসে প্রোগ্রেস ও স্কোর সুরক্ষিত রাখতে </span>
            <button onClick={onOpenAuth} className="font-black text-teal-700 underline hover:text-teal-950 cursor-pointer ml-1">
              লগইন বা ফ্রি সাইনআপ করুন
            </button>
          </div>
        )}
      </header>

      {/* Main Learning Workspace Layout */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex relative">
        {/* Desktop Sidebar */}
        <CbsSidebar
          curriculum={curriculum}
          selectedDay={selectedDay}
          progress={progress}
          onSelectDay={(dayNum) => loadLesson(dayNum)}
          className="hidden lg:flex"
        />

        {/* Mobile Sidebar Overlay Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] bg-white h-full z-10 shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">14-Day CBS Curriculum</span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CbsSidebar
                  curriculum={curriculum}
                  selectedDay={selectedDay}
                  progress={progress}
                  onSelectDay={(dayNum) => loadLesson(dayNum)}
                  className="w-full h-full border-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {isLoadingLesson ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-7 h-7 text-teal-600 animate-spin" />
              <p className="text-xs font-bold text-slate-600">Day {selectedDay} লেসন লোড হচ্ছে...</p>
            </div>
          ) : currentLesson ? (
            <CbsLessonView
              lesson={currentLesson}
              progress={progress}
              onToggleComplete={handleToggleComplete}
              onSaveQuizScore={handleSaveQuizScore}
            />
          ) : (
            <div className="text-center py-16 text-slate-500">
              কোনো লেসন পাওয়া যায়নি। বামপাশের মেনু থেকে একটি দিন নির্বাচন করুন।
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

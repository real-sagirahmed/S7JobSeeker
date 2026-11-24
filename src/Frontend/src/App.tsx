import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ResumeUploader } from './components/ResumeUploader';
import { JobMatchCard } from './components/JobMatchCard';
import { AuthModal } from './components/AuthModal';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { api } from './services/api';
import type { User, ResumeProfile, JobMatch, TailoredApplication, JobPrepGuide } from './types';
import { Sparkles, RefreshCw, Briefcase, FileText, ArrowRight, ShieldCheck, Cpu, DownloadCloud, Search, X } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

// ARCHITECTURAL INTENT: Lazy-load heavy and on-demand components to reduce initial JavaScript bundle by >60%
const PasteAndAnalyze = React.lazy(() => import('./components/PasteAndAnalyze').then(m => ({ default: m.PasteAndAnalyze })));
const TailoredModal = React.lazy(() => import('./components/TailoredModal').then(m => ({ default: m.TailoredModal })));
const JobPrepModal = React.lazy(() => import('./components/JobPrepModal').then(m => ({ default: m.JobPrepModal })));
const CompanyDirectory = React.lazy(() => import('./components/CompanyDirectory').then(m => ({ default: m.CompanyDirectory })));
const BuyCreditsModal = React.lazy(() => import('./components/BuyCreditsModal').then(m => ({ default: m.BuyCreditsModal })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CbsSprintPortal = React.lazy(() => import('./components/CbsSprint/CbsSprintPortal').then(m => ({ default: m.CbsSprintPortal })));
const CertificateVerificationView = React.lazy(() => import('./components/CbsSprint/CertificateVerificationView').then(m => ({ default: m.CertificateVerificationView })));

const ComponentFallback: React.FC = () => {
  const { language } = useLanguage();
  return (
    <div className="p-12 text-center space-y-3">
      <div className="w-8 h-8 border-2 border-[#007070] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-[#7C7C7C] font-semibold">
        {language === 'bn' ? 'মডিউল লোড হচ্ছে...' : 'Loading module...'}
      </p>
    </div>
  );
};

export const App: React.FC = () => {
  const { t, language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'profile' | 'paste' | 'saved' | 'companies' | 'admin' | 'cbs-sprint'>('matches');
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [savedList, setSavedList] = useState<JobMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isSyncingJobs, setIsSyncingJobs] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [buyCreditsInitialView, setBuyCreditsInitialView] = useState<'buy' | 'history'>('buy');
  const [selectedApplication, setSelectedApplication] = useState<TailoredApplication | null>(null);
  const [selectedPrepGuide, setSelectedPrepGuide] = useState<JobPrepGuide | null>(null);
  const [isLoadingPrepGuide, setIsLoadingPrepGuide] = useState(false);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [generatingAppId, setGeneratingAppId] = useState<string | null>(null);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [sourceFilter, setSourceFilter] = useState<number>(0);
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalMatchesCount, setTotalMatchesCount] = useState<number>(0);
  const [hasMoreMatches, setHasMoreMatches] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Public certificate verification route detection (?verify=S7-CBS-... or /verify/S7-CBS-...)
  const [verificationCertId, setVerificationCertId] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyParam = urlParams.get('verify');
    if (verifyParam) return verifyParam;

    if (window.location.pathname.startsWith('/verify/')) {
      const parts = window.location.pathname.split('/');
      if (parts.length >= 3 && parts[2].trim()) {
        return decodeURIComponent(parts[2].trim());
      }
    }
    return null;
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // If user is directly accessing the public certificate verification view, render standalone view
  if (verificationCertId !== null) {
    return (
      <React.Suspense fallback={<ComponentFallback />}>
        <CertificateVerificationView
          initialCertificateId={verificationCertId}
          onBackToApp={() => {
            window.history.replaceState({}, document.title, window.location.pathname.split('?')[0]);
            setVerificationCertId(null);
          }}
        />
      </React.Suspense>
    );
  }

  // Initial user check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.auth.getMe()
        .then((u) => {
          setUser(u);
          loadProfileAndMatches();
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        });
    }
  }, []);

  const loadProfileAndMatches = async () => {
    try {
      const p = await api.profile.getProfile();
      setProfile(p);
      if (p) {
        fetchMatches();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMatches = async (
    targetSource?: number,
    isRemote?: boolean,
    pageToFetch: number = 1,
    isAppending: boolean = false,
    targetSearch?: string,
    targetExperience?: string
  ) => {
    if (isAppending) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingMatches(true);
    }

    try {
      const src = targetSource !== undefined ? targetSource : sourceFilter;
      const rem = isRemote !== undefined ? isRemote : remoteOnly;
      const search = targetSearch !== undefined ? targetSearch : searchKeyword;
      const exp = targetExperience !== undefined ? targetExperience : experienceFilter;
      const res = await api.jobs.getMatches(src, rem, pageToFetch, 20, search, exp);

      if (isAppending) {
        setMatches((prev) => [...prev, ...res.items]);
      } else {
        setMatches(res.items);
      }

      setCurrentPage(res.page);
      setTotalMatchesCount(res.totalCount);
      setHasMoreMatches(res.hasMore);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : t.toasts.loadMatchesError;
      showToast(msg, 'error');
    } finally {
      setIsLoadingMatches(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMoreMatches = () => {
    if (isLoadingMore || !hasMoreMatches) return;
    fetchMatches(sourceFilter, remoteOnly, currentPage + 1, true, searchKeyword, experienceFilter);
  };

  const fetchSavedMatches = async () => {
    setIsLoadingSaved(true);
    try {
      const list = await api.jobs.getSaved();
      setSavedList(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'saved' && user) {
      fetchSavedMatches();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === 'matches' && user && profile && matches.length === 0) {
      fetchMatches(sourceFilter, remoteOnly);
    }
  }, [activeTab, user, profile]);

  useEffect(() => {
    if (activeTab === 'matches' && user && profile) {
      fetchMatches(sourceFilter, remoteOnly);
    }
  }, [sourceFilter, remoteOnly]);

  const handleSyncJobs = async () => {
    setIsSyncingJobs(true);
    try {
      const res = await api.jobs.syncJobs();
      showToast(`Job sync complete! Fetched: ${res.totalFetched}, New: ${res.totalNew}`, 'success');
      fetchMatches();
      if (activeTab === 'saved') fetchSavedMatches();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to trigger job sync.', 'error');
    } finally {
      setIsSyncingJobs(false);
    }
  };

  const handleGenerateApplication = async (jobId: string) => {
    setGeneratingAppId(jobId);
    try {
      const app = await api.jobs.generateTailoredApplication(jobId);
      setSelectedApplication(app);
      showToast('Customized application package generated successfully.', 'success');
      // Refresh user credits
      api.auth.getMe().then(setUser).catch(() => {});
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate tailored application.';
      if (errorMsg.includes('Credit') || errorMsg.includes('402')) {
        showToast(t.toasts.outOfCredits, 'error');
        setIsBuyCreditsOpen(true);
      } else {
        showToast(errorMsg, 'error');
      }
    } finally {
      setGeneratingAppId(null);
    }
  };

  const handleOpenPrepGuide = async (job: JobMatch) => {
    setIsPrepModalOpen(true);
    setSelectedPrepGuide(null);
    setIsLoadingPrepGuide(true);

    try {
      // Backend checks DB cache first (0 credits if already generated, 1 credit if new)
      const guide = await api.jobs.generatePreparationGuide(job.jobId);
      setSelectedPrepGuide(guide);
      api.auth.getMe().then(setUser).catch(() => {});
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate preparation guide.';
      if (errorMsg.includes('Credit') || errorMsg.includes('402')) {
        showToast(t.toasts.outOfCredits, 'error');
        handleOpenBuyCredits();
        setIsPrepModalOpen(false);
      } else {
        showToast(errorMsg, 'error');
        setIsPrepModalOpen(false);
      }
    } finally {
      setIsLoadingPrepGuide(false);
    }
  };

  const handleToggleBookmark = async (jobId: string) => {
    try {
      const isBookmarked = await api.jobs.toggleBookmark(jobId);
      setMatches((prev) =>
        prev.map((m) => (m.jobId === jobId ? { ...m, isBookmarked } : m))
      );
      setSavedList((prev) => {
        if (!isBookmarked) return prev.filter((m) => m.jobId !== jobId);
        const match = matches.find((m) => m.jobId === jobId);
        return match ? [...prev, { ...match, isBookmarked: true }] : prev;
      });
      showToast(isBookmarked ? t.toasts.savedBookmark : t.toasts.removedBookmark, 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to update bookmark.', 'error');
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (remoteOnly && !m.isRemote) return false;
    if (m.overallScore < minScoreFilter) return false;
    if (sourceFilter !== 0 && m.source !== sourceFilter) return false;
    return true;
  });

  const handleOpenBuyCredits = () => {
    setBuyCreditsInitialView('buy');
    setIsBuyCreditsOpen(true);
  };

  const handleOpenTransactionsHistory = () => {
    setBuyCreditsInitialView('history');
    setIsBuyCreditsOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#333333] flex flex-col font-sans overflow-x-hidden">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => {
          api.auth.logout();
          setUser(null);
          setProfile(null);
          setMatches([]);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenBuyCredits={handleOpenBuyCredits}
        onOpenHistory={handleOpenTransactionsHistory}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'cbs-sprint' ? (
          <React.Suspense fallback={<ComponentFallback />}>
            <CbsSprintPortal
              user={user}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              showToast={showToast}
            />
          </React.Suspense>
        ) : !user ? (
          // Landing Hero for Logged-Out Users
          <div className="py-12 text-center space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-center">
              <img
                src="/logo-full.png"
                alt="S7 Job Seeker"
                className="w-36 sm:w-44 h-auto rounded-2xl shadow-xl border border-black/10 object-cover"
              />
            </div>

            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#E6F4F4] border border-[#007070]/30 text-xs font-bold text-[#007070]">
              <Sparkles className="w-4 h-4" />
              <span>{t.hero.tag}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0B0B0B] leading-tight">
              {t.hero.titlePart1}{' '}
              <span className="text-[#007070]">
                {t.hero.titleHighlight}
              </span>
            </h1>

            <p className="text-sm text-[#333333] leading-relaxed max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-[0_8px_30px_rgba(0,112,112,0.25)]"
              >
                <span>{t.hero.getStarted}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
              <div className="p-6 rounded-2xl border border-black/8 bg-white space-y-3 shadow-xs hover:border-[#007070] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4F4] text-[#007070] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0B0B0B] text-sm">{t.hero.feat1Title}</h3>
                <p className="text-xs text-[#7C7C7C] leading-relaxed">
                  {t.hero.feat1Desc}
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-black/8 bg-white space-y-3 shadow-xs hover:border-[#007070] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4F4] text-[#007070] flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0B0B0B] text-sm">{t.hero.feat2Title}</h3>
                <p className="text-xs text-[#7C7C7C] leading-relaxed">
                  {t.hero.feat2Desc}
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-black/8 bg-white space-y-3 shadow-xs hover:border-[#007070] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4F4] text-[#007070] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0B0B0B] text-sm">{t.hero.feat3Title}</h3>
                <p className="text-xs text-[#7C7C7C] leading-relaxed">
                  {t.hero.feat3Desc}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Main Application Dashboard for Logged-in Users
          <div className="space-y-6">
            {/* Top Alert if user has no resume uploaded yet */}
            {!profile && activeTab !== 'profile' && (
              <div className="p-4 rounded-2xl border border-[#007070]/30 bg-[#E6F4F4] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center space-x-3 text-xs text-[#333333] font-medium">
                  <Sparkles className="w-5 h-5 text-[#007070] flex-shrink-0" />
                  <span>
                    আপনি এখনও রেজুমি আপলোড করেননি। আপনার যোগ্যতা অনুযায়ী জব ম্যাচ দেখতে এখনই রেজুমি আপলোড করুন।
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2 rounded-xl bg-[#007070] hover:bg-[#005858] text-white text-xs font-bold whitespace-nowrap transition-colors shadow-[0_4px_16px_rgba(0,112,112,0.25)]"
                >
                  Upload Resume Now
                </button>
              </div>
            )}

            {/* TAB: S7 Match Radar */}
            {activeTab === 'matches' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/8">
                  <div>
                    <h2 className="text-xl font-black text-[#0B0B0B] flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-[#007070]" /> {t.matches.title}
                    </h2>
                    <p className="text-xs text-[#7C7C7C] mt-0.5">
                      {t.matches.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="relative min-w-[170px] sm:min-w-[210px] flex-1 sm:flex-initial">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            fetchMatches(sourceFilter, remoteOnly, 1, false, searchKeyword, experienceFilter);
                          }
                        }}
                        placeholder={t.matches.searchPlaceholder || "Search .NET, C#, Role..."}
                        className="w-full min-h-[40px] pl-8 pr-7 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#333333] placeholder:text-slate-400 focus:outline-none focus:border-[#007070]"
                      />
                      {searchKeyword && (
                        <button
                          onClick={() => {
                            setSearchKeyword('');
                            fetchMatches(sourceFilter, remoteOnly, 1, false, '', experienceFilter);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <select
                      value={experienceFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExperienceFilter(val);
                        fetchMatches(sourceFilter, remoteOnly, 1, false, searchKeyword, val);
                      }}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-black/10 text-base sm:text-xs text-[#333333] focus:outline-none focus:border-[#007070]"
                    >
                      <option value="all">{t.matches.allExperience || 'All Experience Levels'}</option>
                      <option value="fresher_junior">{t.matches.fresherJunior || '🌱 Fresher & Junior (0-3 yrs)'}</option>
                      <option value="fresher">{t.matches.fresher || '🌱 Fresher / Intern / Graduate'}</option>
                      <option value="junior">{t.matches.junior || '⚡ Junior / Associate (1-3 yrs)'}</option>
                      <option value="mid">{t.matches.mid || '🎯 Mid-Level (2-5 yrs)'}</option>
                      <option value="senior">{t.matches.senior || '💎 Senior & Lead (5+ yrs)'}</option>
                    </select>

                    <button
                      onClick={handleSyncJobs}
                      disabled={isSyncingJobs}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#E6F4F4] hover:bg-[#007070]/20 text-[#007070] border border-[#007070]/30 text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50 active:scale-95"
                      title="Fetch latest tech jobs from live sources"
                    >
                      <DownloadCloud className={`w-3.5 h-3.5 ${isSyncingJobs ? 'animate-bounce' : ''}`} />
                      <span>{isSyncingJobs ? t.matches.syncing : t.matches.syncJobs}</span>
                    </button>

                    <label className="min-h-[40px] px-3 py-2 rounded-xl border border-black/10 bg-white flex items-center space-x-2 text-xs text-[#333333] font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remoteOnly}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setRemoteOnly(val);
                          fetchMatches(sourceFilter, val, 1, false, searchKeyword, experienceFilter);
                        }}
                        className="rounded border-black/20 text-[#007070] focus:ring-0"
                      />
                      <span>{t.matches.remoteOnly}</span>
                    </label>

                    <select
                      value={sourceFilter}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSourceFilter(val);
                        fetchMatches(val, remoteOnly, 1, false, searchKeyword, experienceFilter);
                      }}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-black/10 text-base sm:text-xs text-[#333333] focus:outline-none focus:border-[#007070]"
                    >
                      <option value={0}>{t.matches.allSources}</option>
                      <option value={7}>{t.matches.localJobs}</option>
                      <option value={8}>LinkedIn Jobs</option>
                      <option value={3}>Jobicy (Remote)</option>
                      <option value={5}>Himalayas (Remote)</option>
                      <option value={6}>We Work Remotely</option>
                      <option value={1}>Remotive</option>
                      <option value={2}>Arbeitnow</option>
                      <option value={9}>Jobgether (Remote)</option>
                      <option value={4}>Custom Pasted</option>
                    </select>

                    <select
                      value={minScoreFilter}
                      onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-black/10 text-base sm:text-xs text-[#333333] focus:outline-none focus:border-[#007070]"
                    >
                      <option value={0}>{t.matches.anyScore}</option>
                      <option value={60}>{t.matches.fairMatch}</option>
                      <option value={75}>{t.matches.highMatch}</option>
                    </select>

                    <button
                      onClick={() => fetchMatches(sourceFilter, remoteOnly, 1, false, searchKeyword, experienceFilter)}
                      disabled={isLoadingMatches}
                      title="Refresh Matches"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl border border-black/10 text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5 transition-all disabled:opacity-50 active:scale-95"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingMatches ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* S7 Quick Filter Discovery Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1 pb-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.matches.quickFilters || 'Quick Filters:'}</span>
                  
                  <button
                    onClick={() => {
                      setSearchKeyword('.NET');
                      setExperienceFilter('fresher_junior');
                      fetchMatches(sourceFilter, remoteOnly, 1, false, '.NET', 'fresher_junior');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1 ${
                      searchKeyword === '.NET' && experienceFilter === 'fresher_junior'
                        ? 'bg-[#007070] text-white border-[#007070] shadow-sm'
                        : 'bg-teal-50 text-[#007070] border-teal-200 hover:bg-teal-100'
                    }`}
                  >
                    <span>{t.matches.presetJuniorDotNet || '🚀 Junior .NET Developer'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSearchKeyword('.NET');
                      setExperienceFilter('all');
                      fetchMatches(sourceFilter, remoteOnly, 1, false, '.NET', 'all');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1 ${
                      searchKeyword === '.NET' && experienceFilter === 'all'
                        ? 'bg-[#007070] text-white border-[#007070] shadow-sm'
                        : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    <span>{t.matches.presetDotNet || '🔷 .NET / C# Developer'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSearchKeyword('');
                      setExperienceFilter('fresher_junior');
                      fetchMatches(sourceFilter, remoteOnly, 1, false, '', 'fresher_junior');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1 ${
                      !searchKeyword && experienceFilter === 'fresher_junior'
                        ? 'bg-[#007070] text-white border-[#007070] shadow-sm'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span>{t.matches.presetFresherJunior || '🌱 All Fresher & Junior Roles'}</span>
                  </button>

                  {(searchKeyword || experienceFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchKeyword('');
                        setExperienceFilter('all');
                        fetchMatches(sourceFilter, remoteOnly, 1, false, '', 'all');
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                    >
                      {t.matches.resetFilters || 'Reset Filters'}
                    </button>
                  )}
                </div>

                {isLoadingMatches ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-[#007070] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#7C7C7C]">{t.matches.evaluatingSemantic}</p>
                  </div>
                ) : filteredMatches.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      {filteredMatches.map((match) => (
                        <JobMatchCard
                          key={match.jobId}
                          match={match}
                          onGenerateApplication={handleGenerateApplication}
                          onToggleBookmark={handleToggleBookmark}
                          onOpenPrepGuide={handleOpenPrepGuide}
                          isGenerating={generatingAppId === match.jobId}
                        />
                      ))}
                    </div>

                    {hasMoreMatches && (
                      <div className="pt-2 text-center">
                        <button
                          onClick={handleLoadMoreMatches}
                          disabled={isLoadingMore}
                          className="min-h-[44px] px-8 py-3 rounded-2xl bg-white hover:bg-[#E6F4F4] text-[#007070] border border-[#007070]/30 hover:border-[#007070] text-xs font-black shadow-xs hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center space-x-2 active:scale-98 cursor-pointer"
                        >
                          {isLoadingMore ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>{t.matches.loadingMore}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>{t.matches.loadMore}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {!hasMoreMatches && matches.length > 0 && (
                      <div className="pt-4 pb-2 text-center text-xs text-[#7C7C7C] font-medium flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#007070]" />
                        <span>{language === 'bn' ? `সকল ${totalMatchesCount}টি ম্যাচিং অপরচুনিটি প্রদর্শিত হয়েছে` : `Showing all ${totalMatchesCount} matching opportunities`}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-2xl border border-black/8 bg-white space-y-4 shadow-xs">
                    <Briefcase className="w-10 h-10 text-[#7C7C7C] mx-auto" />
                    <h3 className="text-base font-bold text-[#0B0B0B]">{t.matches.noJobsFoundTitle}</h3>
                    <p className="text-xs text-[#7C7C7C] max-w-md mx-auto">
                      {t.matches.noJobsFoundDesc}
                    </p>
                    <button
                      onClick={handleSyncJobs}
                      disabled={isSyncingJobs}
                      className="px-5 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs inline-flex items-center space-x-2 transition-all shadow-[0_4px_16px_rgba(0,112,112,0.25)]"
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>{isSyncingJobs ? t.matches.syncing : t.matches.fetchNow}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: S7 Circular Scanner */}
            {activeTab === 'paste' && (
              <React.Suspense fallback={<ComponentFallback />}>
                <PasteAndAnalyze
                  onGenerateApplication={handleGenerateApplication}
                  onToggleBookmark={handleToggleBookmark}
                  onOpenPrepGuide={handleOpenPrepGuide}
                  onRefreshUser={() => api.auth.getMe().then(setUser).catch(() => {})}
                />
              </React.Suspense>
            )}

            {/* TAB: S7 Talent DNA & Profile */}
            {activeTab === 'profile' && (
              <ResumeUploader
                profile={profile}
                user={user}
                onProfileUpdated={(p) => {
                  setProfile(p);
                  fetchMatches();
                }}
                onNavigateToMatches={() => setActiveTab('matches')}
                onNavigateToCompanies={() => setActiveTab('companies')}
              />
            )}

            {/* TAB: Saved Jobs */}
            {activeTab === 'saved' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-black/8 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-[#0B0B0B]">{t.matches.savedJobsTitle} ({savedList.length})</h2>
                    <p className="text-xs text-[#7C7C7C] mt-0.5">{t.matches.savedJobsSubtitle}</p>
                  </div>
                  <button
                    onClick={fetchSavedMatches}
                    disabled={isLoadingSaved}
                    className="p-2 rounded-xl border border-black/10 hover:border-[#007070] text-[#7C7C7C] hover:text-[#007070] transition-colors"
                    title={t.matches.refreshSaved}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingSaved ? 'animate-spin text-[#007070]' : ''}`} />
                  </button>
                </div>

                {isLoadingSaved ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-[#007070] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#7C7C7C] font-semibold">{t.matches.loadingSaved}</p>
                  </div>
                ) : savedList.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {savedList.map((match) => (
                      <JobMatchCard
                        key={match.jobId}
                        match={match}
                        onGenerateApplication={handleGenerateApplication}
                        onToggleBookmark={handleToggleBookmark}
                        onOpenPrepGuide={handleOpenPrepGuide}
                        isGenerating={generatingAppId === match.jobId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-2xl border border-black/8 bg-white space-y-2 shadow-xs">
                    <p className="text-xs text-[#7C7C7C]">{t.matches.noSavedJobs}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BD Tech Ecosystem */}
            {activeTab === 'companies' && (
              <React.Suspense fallback={<ComponentFallback />}>
                <CompanyDirectory
                  hasProfile={!!profile}
                  onSelectJobForApplication={handleGenerateApplication}
                  showToast={showToast}
                />
              </React.Suspense>
            )}

            {/* TAB: Director Admin Console */}
            {activeTab === 'admin' && user?.isAdmin && (
              <React.Suspense fallback={<ComponentFallback />}>
                <AdminDashboard onNotify={showToast} />
              </React.Suspense>
            )}
          </div>
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(authData) => {
          setUser({
            id: '',
            email: authData.email,
            fullName: authData.fullName,
            targetRole: authData.targetRole,
            isAdmin: authData.isAdmin,
            aiCredits: authData.aiCredits,
            trialEndsAt: authData.trialEndsAt
          });
          loadProfileAndMatches();
        }}
      />

      {isBuyCreditsOpen && (
        <React.Suspense fallback={null}>
          <BuyCreditsModal
            isOpen={isBuyCreditsOpen}
            initialView={buyCreditsInitialView}
            onClose={() => setIsBuyCreditsOpen(false)}
            onSuccess={() => {
              showToast(language === 'bn' ? 'পেমেন্ট রিকোয়েস্ট জমা নেওয়া হয়েছে। পরিচালক ভেরিফাই করলেই ক্রেডিট যুক্ত হবে।' : 'Payment request submitted. Credits will be added once approved by Director.', 'success');
              api.auth.getMe().then(setUser).catch(() => {});
            }}
            userCredits={user?.aiCredits}
          />
        </React.Suspense>
      )}

      {selectedApplication && (
        <React.Suspense fallback={null}>
          <TailoredModal
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
          />
        </React.Suspense>
      )}

      {isPrepModalOpen && (
        <React.Suspense fallback={null}>
          <JobPrepModal
            guide={selectedPrepGuide}
            isLoading={isLoadingPrepGuide}
            onClose={() => {
              setIsPrepModalOpen(false);
              setSelectedPrepGuide(null);
            }}
          />
        </React.Suspense>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <footer className="border-t border-black/8 py-6 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7C7C7C]">
          <div className="flex items-center space-x-2.5">
            <img
              src="/logo-icon.png"
              alt="s7job-seeker"
              className="w-5 h-5 rounded-md object-cover border border-[#007070]/20"
            />
            <span className="font-bold text-[#0B0B0B]">s7job-seeker</span>
            <span>•</span>
            <span>{t.footer.tagline}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1 text-[11px] text-center">
            <span>{t.footer.matcher}</span>
            <span>•</span>
            <span>{t.footer.ragEngine}</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} {t.footer.copyright}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
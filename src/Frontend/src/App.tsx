import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ResumeUploader } from './components/ResumeUploader';
import { JobMatchCard } from './components/JobMatchCard';
import { PasteAndAnalyze } from './components/PasteAndAnalyze';
import { TailoredModal } from './components/TailoredModal';
import { AuthModal } from './components/AuthModal';
import { CompanyDirectory } from './components/CompanyDirectory';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { api } from './services/api';
import type { User, ResumeProfile, JobMatch, TailoredApplication } from './types';
import { Sparkles, RefreshCw, Briefcase, FileText, ArrowRight, ShieldCheck, Cpu, DownloadCloud } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'profile' | 'paste' | 'saved' | 'companies'>('matches');
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [savedList, setSavedList] = useState<JobMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isSyncingJobs, setIsSyncingJobs] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<TailoredApplication | null>(null);
  const [generatingAppId, setGeneratingAppId] = useState<string | null>(null);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [sourceFilter, setSourceFilter] = useState<number>(0);
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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

  const fetchMatches = async (targetSource?: number, isRemote?: boolean) => {
    setIsLoadingMatches(true);
    try {
      const src = targetSource !== undefined ? targetSource : sourceFilter;
      const rem = isRemote !== undefined ? isRemote : remoteOnly;
      const list = await api.jobs.getMatches(src, rem);
      setMatches(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMatches(false);
    }
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
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to generate tailored application.', 'error');
    } finally {
      setGeneratingAppId(null);
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
      showToast(isBookmarked ? 'Job added to bookmarks.' : 'Job removed from bookmarks.', 'info');
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#333333] flex flex-col font-sans">
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
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          // Landing Hero for Logged-Out Users
          <div className="py-16 text-center space-y-8 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#E6F4F4] border border-[#007070]/30 text-xs font-bold text-[#007070]">
              <Sparkles className="w-4 h-4" />
              <span>S7 Semantic & RAG Job Matching System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0B0B0B] leading-tight">
              আপনার যোগ্যতা অনুযায়ী সঠিক জব খুঁজুন{' '}
              <span className="text-[#007070]">
                Semantic AI এর সাহায্যে
              </span>
            </h1>

            <p className="text-sm text-[#333333] leading-relaxed max-w-2xl mx-auto">
              রেজুমি আপলোড করুন। আমাদের AI স্বয়ংক্রিয়ভাবে আপনার স্কিল ও অভিজ্ঞতা বিশ্লেষণ করে রিয়েল-টাইম জবের সাথে
              সিম্যান্টিক ম্যাচিং, স্কিল গ্যাপ অ্যানালাইসিস এবং জবের জন্য কাস্টমাইজড কভার লেটার তৈরি করে দেবে।
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-[0_8px_30px_rgba(0,112,112,0.25)]"
              >
                <span>বিনামূল্যে শুরু করুন (Get Started Free)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
              <div className="p-6 rounded-2xl border border-black/8 bg-white space-y-3 shadow-xs hover:border-[#007070] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4F4] text-[#007070] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0B0B0B] text-sm">Automated Resume Parsing</h3>
                <p className="text-xs text-[#7C7C7C] leading-relaxed">
                  PDF থেকে স্বয়ংক্রিয়ভাবে স্কিল, অভিজ্ঞতা ও ক্যারিয়ার গোল বের করে নির্ভুল প্রোফাইল গঠন।
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-black/8 bg-white space-y-3 shadow-xs hover:border-[#007070] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4F4] text-[#007070] flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0B0B0B] text-sm">Semantic & RAG Matching</h3>
                <p className="text-xs text-[#7C7C7C] leading-relaxed">
                  কি-ওয়ার্ড মেলা ছাড়া শুধু নয়, জবের আসল দায়িত্ব ও কনটেক্সটের সাথে ভেক্টর ভিত্তিক ম্যাচিং স্কোর (0-100%)।
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-black/8 bg-white space-y-3 shadow-xs hover:border-[#007070] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4F4] text-[#007070] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0B0B0B] text-sm">Cover Letter & Tips</h3>
                <p className="text-xs text-[#7C7C7C] leading-relaxed">
                  প্রতিটি জবের স্পেসিফিক রিকোয়ারমেন্ট অনুযায়ী এআই দিয়ে কাস্টম কভার লেটার ও রেজুমি ইমপ্রুভমেন্ট টিপস।
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

            {/* TAB: Smart Matches */}
            {activeTab === 'matches' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/8">
                  <div>
                    <h2 className="text-xl font-black text-[#0B0B0B] flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-[#007070]" /> AI-Ranked Job Matches
                    </h2>
                    <p className="text-xs text-[#7C7C7C] mt-0.5">
                      {filteredMatches.length} opportunities ranked by vector similarity & skill alignment
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSyncJobs}
                      disabled={isSyncingJobs}
                      className="px-3.5 py-1.5 rounded-xl bg-[#E6F4F4] hover:bg-[#007070]/20 text-[#007070] border border-[#007070]/30 text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                      title="Fetch latest tech jobs from BDJobs, Jobicy, Himalayas, WWR, Remotive & Arbeitnow"
                    >
                      <DownloadCloud className={`w-3.5 h-3.5 ${isSyncingJobs ? 'animate-bounce' : ''}`} />
                      <span>{isSyncingJobs ? 'Syncing...' : 'Sync Tech Jobs'}</span>
                    </button>

                    <label className="flex items-center space-x-2 text-xs text-[#333333] font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remoteOnly}
                        onChange={(e) => setRemoteOnly(e.target.checked)}
                        className="rounded border-black/20 text-[#007070] focus:ring-0"
                      />
                      <span>Remote Only</span>
                    </label>

                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs text-[#333333] focus:outline-none focus:border-[#007070]"
                    >
                      <option value={0}>All Sources (৬টি সোর্স)</option>
                      <option value={7}>🇧🇩 BDJobs (Local BD)</option>
                      <option value={3}>Jobicy (Remote)</option>
                      <option value={5}>Himalayas (Remote)</option>
                      <option value={6}>We Work Remotely</option>
                      <option value={1}>Remotive</option>
                      <option value={2}>Arbeitnow</option>
                      <option value={4}>Custom Pasted</option>
                    </select>

                    <select
                      value={minScoreFilter}
                      onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg bg-white border border-black/10 text-xs text-[#333333] focus:outline-none focus:border-[#007070]"
                    >
                      <option value={0}>All Scores</option>
                      <option value={60}>Min 60% Match</option>
                      <option value={75}>Min 75% Match</option>
                      <option value={85}>Min 85% Match</option>
                    </select>

                    <button
                      onClick={() => fetchMatches()}
                      disabled={isLoadingMatches}
                      title="Refresh Matches"
                      className="p-2 rounded-lg border border-black/10 text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingMatches ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {isLoadingMatches ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-[#007070] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#7C7C7C]">Evaluating semantic relevance with Gemini RAG...</p>
                  </div>
                ) : filteredMatches.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredMatches.map((match) => (
                      <JobMatchCard
                        key={match.jobId}
                        match={match}
                        onGenerateApplication={handleGenerateApplication}
                        onToggleBookmark={handleToggleBookmark}
                        isGenerating={generatingAppId === match.jobId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-2xl border border-black/8 bg-white space-y-4 shadow-xs">
                    <Briefcase className="w-10 h-10 text-[#7C7C7C] mx-auto" />
                    <h3 className="text-base font-bold text-[#0B0B0B]">কোনো ম্যাচিং জব পাওয়া যায়নি</h3>
                    <p className="text-xs text-[#7C7C7C] max-w-md mx-auto">
                      ডাটাবেজে নতুন জব ফেচ করার জন্য উপরের <b>"Sync Tech Jobs"</b> বাটনে ক্লিক করুন, অথবা <b>"Paste & Analyze"</b> ট্যাব ব্যবহার করে সরাসরি সার্কুলার পেস্ট করুন।
                    </p>
                    <button
                      onClick={handleSyncJobs}
                      disabled={isSyncingJobs}
                      className="px-5 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs inline-flex items-center space-x-2 transition-all shadow-[0_4px_16px_rgba(0,112,112,0.25)]"
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>{isSyncingJobs ? 'Fetching from APIs...' : 'Fetch & Ingest Live Jobs Now'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Paste & Analyze */}
            {activeTab === 'paste' && (
              <PasteAndAnalyze
                onGenerateApplication={handleGenerateApplication}
                onToggleBookmark={handleToggleBookmark}
              />
            )}

            {/* TAB: Resume & Profile */}
            {activeTab === 'profile' && (
              <ResumeUploader
                profile={profile}
                onProfileUpdated={(p) => {
                  setProfile(p);
                  fetchMatches();
                }}
              />
            )}

            {/* TAB: Saved Jobs */}
            {activeTab === 'saved' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-black/8 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-[#0B0B0B]">Saved Jobs ({savedList.length})</h2>
                    <p className="text-xs text-[#7C7C7C] mt-0.5">Your permanently bookmarked career opportunities</p>
                  </div>
                  <button
                    onClick={fetchSavedMatches}
                    disabled={isLoadingSaved}
                    className="p-2 rounded-xl border border-black/10 hover:border-[#007070] text-[#7C7C7C] hover:text-[#007070] transition-colors"
                    title="Refresh Saved Jobs"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingSaved ? 'animate-spin text-[#007070]' : ''}`} />
                  </button>
                </div>

                {isLoadingSaved ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-[#007070] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#7C7C7C] font-semibold">Loading saved opportunities...</p>
                  </div>
                ) : savedList.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {savedList.map((match) => (
                      <JobMatchCard
                        key={match.jobId}
                        match={match}
                        onGenerateApplication={handleGenerateApplication}
                        onToggleBookmark={handleToggleBookmark}
                        isGenerating={generatingAppId === match.jobId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-2xl border border-black/8 bg-white space-y-2 shadow-xs">
                    <p className="text-xs text-[#7C7C7C]">এখনও কোনো জব বুকমার্ক করেননি। "Smart Matches" থেকে বুকমার্ক করুন।</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BD Tech Ecosystem */}
            {activeTab === 'companies' && (
              <CompanyDirectory
                hasProfile={!!profile}
                onSelectJobForApplication={handleGenerateApplication}
                showToast={showToast}
              />
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
            targetRole: authData.targetRole
          });
          loadProfileAndMatches();
        }}
      />

      <TailoredModal
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <footer className="border-t border-black/8 py-6 text-center text-xs text-[#7C7C7C] bg-white">
        <b>teamS7 Intelligence</b> • s7job-seeker SaaS Platform • Primary Brand <span className="text-[#007070] font-bold">#007070</span>
      </footer>
    </div>
  );
};

export default App;
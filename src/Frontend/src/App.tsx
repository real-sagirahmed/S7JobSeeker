import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ResumeUploader } from './components/ResumeUploader';
import { JobMatchCard } from './components/JobMatchCard';
import { PasteAndAnalyze } from './components/PasteAndAnalyze';
import { TailoredModal } from './components/TailoredModal';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import type { User, ResumeProfile, JobMatch, TailoredApplication } from './types';
import { Sparkles, RefreshCw, Briefcase, FileText, ArrowRight, ShieldCheck, Cpu, DownloadCloud } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'profile' | 'paste' | 'saved'>('matches');
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isSyncingJobs, setIsSyncingJobs] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<TailoredApplication | null>(null);
  const [generatingAppId, setGeneratingAppId] = useState<string | null>(null);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);

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

  const fetchMatches = async () => {
    setIsLoadingMatches(true);
    try {
      const list = await api.jobs.getMatches();
      setMatches(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleSyncJobs = async () => {
    setIsSyncingJobs(true);
    try {
      const res = await api.jobs.syncJobs();
      alert(`Job sync complete! Fetched: ${res.totalFetched}, New additions: ${res.totalNew}`);
      fetchMatches();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to trigger job sync.');
    } finally {
      setIsSyncingJobs(false);
    }
  };

  const handleGenerateApplication = async (jobId: string) => {
    setGeneratingAppId(jobId);
    try {
      const app = await api.jobs.generateTailoredApplication(jobId);
      setSelectedApplication(app);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to generate tailored application.');
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
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (remoteOnly && !m.isRemote) return false;
    if (m.overallScore < minScoreFilter) return false;
    return true;
  });

  const savedMatches = matches.filter((m) => m.isBookmarked);

  return (
    <div className="min-h-screen bg-[#050505] text-[#CCCCCC] flex flex-col font-sans">
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
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#007070]/15 border border-[#007070]/30 text-xs font-bold text-[#007070]">
              <Sparkles className="w-4 h-4" />
              <span>S7 Semantic & RAG Job Matching System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              আপনার যোগ্যতা অনুযায়ী সঠিক জব খুঁজুন{' '}
              <span className="text-[#007070]">
                Semantic AI এর সাহায্যে
              </span>
            </h1>

            <p className="text-sm text-[#CCCCCC] leading-relaxed max-w-2xl mx-auto">
              রেজুমি আপলোড করুন। আমাদের AI স্বয়ংক্রিয়ভাবে আপনার স্কিল ও অভিজ্ঞতা বিশ্লেষণ করে রিয়েল-টাইম জবের সাথে
              সিম্যান্টিক ম্যাচিং, স্কিল গ্যাপ অ্যানালাইসিস এবং জবের জন্য কাস্টমাইজড কভার লেটার তৈরি করে দেবে।
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-[0_8px_30px_rgba(0,112,112,0.35)]"
              >
                <span>বিনামূল্যে শুরু করুন (Get Started Free)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
              <div className="p-5 rounded-2xl border border-white/10 bg-[#141414] space-y-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="w-10 h-10 rounded-xl bg-[#007070]/15 text-[#007070] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Automated Resume Parsing</h3>
                <p className="text-xs text-[#919191] leading-relaxed">
                  PDF থেকে স্বয়ংক্রিয়ভাবে স্কিল, অভিজ্ঞতা ও ক্যারিয়ার গোল বের করে নির্ভুল প্রোফাইল গঠন।
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#141414] space-y-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="w-10 h-10 rounded-xl bg-[#007070]/15 text-[#007070] flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Semantic & RAG Matching</h3>
                <p className="text-xs text-[#919191] leading-relaxed">
                  কি-ওয়ার্ড মেলা ছাড়া শুধু নয়, জবের আসল দায়িত্ব ও কনটেক্সটের সাথে ভেক্টর ভিত্তিক ম্যাচিং স্কোর (0-100%)।
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#141414] space-y-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="w-10 h-10 rounded-xl bg-[#007070]/15 text-[#007070] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Cover Letter & Tips</h3>
                <p className="text-xs text-[#919191] leading-relaxed">
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
              <div className="p-4 rounded-2xl border border-[#007070]/40 bg-[#007070]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-xs text-[#CCCCCC]">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-[#007070]" /> AI-Ranked Job Matches
                    </h2>
                    <p className="text-xs text-[#919191] mt-0.5">
                      {filteredMatches.length} opportunities ranked by vector similarity & skill alignment
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSyncJobs}
                      disabled={isSyncingJobs}
                      className="px-3.5 py-1.5 rounded-xl bg-[#007070]/15 hover:bg-[#007070]/25 text-[#007070] border border-[#007070]/30 text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                      title="Fetch latest tech jobs from Remotive & Arbeitnow"
                    >
                      <DownloadCloud className={`w-3.5 h-3.5 ${isSyncingJobs ? 'animate-bounce' : ''}`} />
                      <span>{isSyncingJobs ? 'Syncing...' : 'Sync Tech Jobs'}</span>
                    </button>

                    <label className="flex items-center space-x-2 text-xs text-[#CCCCCC] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remoteOnly}
                        onChange={(e) => setRemoteOnly(e.target.checked)}
                        className="rounded border-white/10 text-[#007070] focus:ring-0"
                      />
                      <span>Remote Only</span>
                    </label>

                    <select
                      value={minScoreFilter}
                      onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg bg-[#0D0D0D] border border-white/10 text-xs text-[#CCCCCC] focus:outline-none"
                    >
                      <option value={0}>All Scores</option>
                      <option value={60}>Min 60% Match</option>
                      <option value={75}>Min 75% Match</option>
                      <option value={85}>Min 85% Match</option>
                    </select>

                    <button
                      onClick={fetchMatches}
                      disabled={isLoadingMatches}
                      title="Refresh Matches"
                      className="p-2 rounded-lg border border-white/10 text-[#919191] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingMatches ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {isLoadingMatches ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-[#007070] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#919191]">Evaluating semantic relevance with Gemini RAG...</p>
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
                  <div className="p-12 text-center rounded-2xl border border-white/10 bg-[#141414] space-y-4">
                    <Briefcase className="w-10 h-10 text-[#7C7C7C] mx-auto" />
                    <h3 className="text-base font-bold text-white">কোনো ম্যাচিং জব পাওয়া যায়নি</h3>
                    <p className="text-xs text-[#919191] max-w-md mx-auto">
                      ডাটাবেজে নতুন জব ফেচ করার জন্য উপরের <b>"Sync Tech Jobs"</b> বাটনে ক্লিক করুন, অথবা <b>"Paste & Analyze"</b> ট্যাব ব্যবহার করে সরাসরি সার্কুলার পেস্ট করুন।
                    </p>
                    <button
                      onClick={handleSyncJobs}
                      disabled={isSyncingJobs}
                      className="px-5 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs inline-flex items-center space-x-2 transition-all shadow-[0_4px_16px_rgba(0,112,112,0.30)]"
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
                <div className="pb-4 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">Saved Jobs ({savedMatches.length})</h2>
                  <p className="text-xs text-[#919191] mt-0.5">Your bookmarked career opportunities</p>
                </div>

                {savedMatches.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {savedMatches.map((match) => (
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
                  <div className="p-12 text-center rounded-2xl border border-white/10 bg-[#141414] space-y-2">
                    <p className="text-xs text-[#919191]">এখনও কোনো জব বুকমার্ক করেননি।</p>
                  </div>
                )}
              </div>
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

      <footer className="border-t border-white/10 py-6 text-center text-xs text-[#919191] bg-[#0B0B0B]">
        <b>teamS7 Intelligence</b> • s7job-seeker SaaS Platform • Primary Brand <span className="text-[#007070] font-bold">#007070</span>
      </footer>
    </div>
  );
};

export default App;

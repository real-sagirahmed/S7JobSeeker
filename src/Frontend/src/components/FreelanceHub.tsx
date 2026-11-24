import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Zap,
  DownloadCloud
} from 'lucide-react';
import type { JobMatch, ResumeProfile, FreelanceProposalRequest, FreelanceProposalResponse } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface FreelanceHubProps {
  profile: ResumeProfile | null;
  onOpenPrepGuide?: (match: JobMatch) => void;
  onRefreshUser?: () => void;
}

export const FreelanceHub: React.FC<FreelanceHubProps> = ({
  profile,
  onRefreshUser
}) => {
  const { t } = useLanguage();

  // Active sub-tab in Hub: 'launchers' | 'liveRadar' | 'proposalCopilot'
  const [hubTab, setHubTab] = useState<'launchers' | 'liveRadar' | 'proposalCopilot'>('launchers');

  // Freelance Jobs from Backend
  const [freelanceJobs, setFreelanceJobs] = useState<JobMatch[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isSyncingFreelance, setIsSyncingFreelance] = useState(false);

  const fetchFreelanceProjects = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await api.jobs.getMatches(13, true, 1, 30);
      setFreelanceJobs(res.items || []);
    } catch (err) {
      console.error('Failed to load freelance projects:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleSyncFreelanceProjects = async () => {
    setIsSyncingFreelance(true);
    try {
      await api.jobs.syncJobs('Freelancer');
      await fetchFreelanceProjects();
    } catch (err) {
      console.error('Failed to sync freelance projects:', err);
    } finally {
      setIsSyncingFreelance(false);
    }
  };

  // Fetch live freelance jobs (source === 13 / Freelancer)
  useEffect(() => {
    fetchFreelanceProjects();
  }, []);
  const [projectTitle, setProjectTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<'Upwork' | 'Freelancer' | 'Fiverr'>('Upwork');
  const [projectDescription, setProjectDescription] = useState('');
  const [customAngle, setCustomAngle] = useState('');
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [proposalResult, setProposalResult] = useState<FreelanceProposalResponse | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [copiedProposal, setCopiedProposal] = useState(false);

  // Extract Top 5 candidate skills
  const topCandidateSkills = useMemo(() => {
    if (!profile?.skills || profile.skills.length === 0) {
      return ['C#', '.NET', 'ASP.NET Core', 'SQL Server', 'REST API'];
    }
    return profile.skills.slice(0, 6).map((s: any) => s.Name || s.name || '');
  }, [profile]);

  // High-demand freelance service offerings generated from CV
  const freelanceServices = useMemo(() => {
    const list = [
      {
        title: '.NET Web API & Microservices Development',
        query: 'ASP.NET Core Web API',
        tag: 'High Demand',
        desc: 'Building high-throughput REST APIs, authentication, and backend integrations.'
      },
      {
        title: 'C# / .NET Bug Fixing & Refactoring',
        query: 'C# bug fix',
        tag: 'Quick Delivery',
        desc: 'Diagnosing runtime exceptions, async bottlenecks, and legacy framework migration.'
      },
      {
        title: 'SQL Server & Database Query Optimization',
        query: 'SQL Server optimization',
        tag: 'Performance',
        desc: 'Indexing strategy, query execution plan tuning, and EF Core performance audits.'
      },
      {
        title: 'Fullstack .NET & React SaaS Feature Implementation',
        query: 'React .NET developer',
        tag: 'Fullstack',
        desc: 'Modern frontend with responsive UI, integrated with robust ASP.NET Core backends.'
      }
    ];
    return list;
  }, []);



  // Handle generating freelance proposal
  const handleGenerateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim() && !projectDescription.trim()) {
      setProposalError('Please provide a project title or paste the client description.');
      return;
    }

    setIsGeneratingProposal(true);
    setProposalError(null);

    try {
      const req: FreelanceProposalRequest = {
        projectTitle: projectTitle.trim(),
        clientName: clientName.trim(),
        projectDescription: projectDescription.trim(),
        targetPlatform,
        customAngle: customAngle.trim() || undefined
      };

      const result = await api.jobs.generateFreelanceProposal(req);
      setProposalResult(result);
      onRefreshUser?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate proposal.';
      setProposalError(msg);
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  // Populate Proposal Copilot from a Live Project
  const handleDraftProposalFromJob = (job: JobMatch) => {
    setProjectTitle(job.title);
    setClientName(job.company);
    setProjectDescription(job.description || `${job.title} at ${job.company}`);
    setTargetPlatform('Freelancer');
    setHubTab('proposalCopilot');
    setProposalResult(null);
  };

  const handleCopyProposal = () => {
    if (!proposalResult) return;
    navigator.clipboard.writeText(proposalResult.fullProposalText);
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 2000);
  };

  // Helper to open marketplace search link with pre-filtered settings
  const openUpworkSearch = (query: string) => {
    const url = `https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(query)}&sort=recency&payment_verified=1`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openFreelancerSearch = (query: string) => {
    const url = `https://www.freelancer.com/jobs/?keyword=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openFiverrSearch = (query: string) => {
    const url = `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#003B3B] via-[#004D4D] to-[#007070] text-white shadow-sm border border-white/10 relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-semibold backdrop-blur-xs">
            <Briefcase className="w-3.5 h-3.5" />
            <span>S7 Marketplace Ecosystem Integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.freelance?.title || 'S7 Freelance Marketplace Hub'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            {t.freelance?.subtitle ||
              'Discover high-paying client projects on Freelancer.com, Upwork, and Fiverr matching your CV skills'}
          </p>

          {/* Quick Skill Tags */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-teal-200 mr-1">Your Core Tech Stack:</span>
            {topCandidateSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md text-xs bg-white/15 text-white border border-white/20 font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-black/10 space-x-2">
        <button
          onClick={() => setHubTab('launchers')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            hubTab === 'launchers'
              ? 'border-[#007070] text-[#007070]'
              : 'border-transparent text-[#7C7C7C] hover:text-[#333333]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>1-Click Marketplace Launchers</span>
        </button>

        <button
          onClick={() => setHubTab('liveRadar')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            hubTab === 'liveRadar'
              ? 'border-[#007070] text-[#007070]'
              : 'border-transparent text-[#7C7C7C] hover:text-[#333333]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Live Freelancer Radar ({freelanceJobs.length})</span>
        </button>

        <button
          onClick={() => setHubTab('proposalCopilot')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            hubTab === 'proposalCopilot'
              ? 'border-[#007070] text-[#007070]'
              : 'border-transparent text-[#7C7C7C] hover:text-[#333333]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Proposal & Bid Copilot</span>
        </button>
      </div>

      {/* SUB-TAB 1: 1-Click Launchers */}
      {hubTab === 'launchers' && (
        <div className="space-y-6">
          {/* Card: High-converting Freelance Niches from CV */}
          <div className="p-6 rounded-2xl bg-white border border-black/8 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#0B0B0B]">
                {t.freelance?.launchersTitle || '1-Click Marketplace Deep Launchers'}
              </h2>
              <p className="text-xs text-[#7C7C7C]">
                {t.freelance?.launchersSubtitle ||
                  'Targeted search strings pre-configured with client payment verification and recency filters'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {freelanceServices.map((svc, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-black/8 hover:border-[#007070]/40 transition-all bg-[#F8FAFC] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B0B0B]">{svc.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#007070] border border-teal-200">
                        {svc.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[#7C7C7C] leading-relaxed">{svc.desc}</p>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2 border-t border-black/5">
                    <button
                      onClick={() => openUpworkSearch(svc.query)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#14a800]/10 hover:bg-[#14a800]/20 text-[#14a800] text-xs font-bold flex items-center space-x-1 transition-colors"
                      title="Search Upwork with Payment Verified filter"
                    >
                      <span>Upwork</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>

                    <button
                      onClick={() => openFreelancerSearch(svc.query)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#29b2fe]/10 hover:bg-[#29b2fe]/20 text-[#0288d1] text-xs font-bold flex items-center space-x-1 transition-colors"
                      title="Search Freelancer.com Active Projects"
                    >
                      <span>Freelancer</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>

                    <button
                      onClick={() => openFiverrSearch(svc.query)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1dbf73]/10 hover:bg-[#1dbf73]/20 text-[#1dbf73] text-xs font-bold flex items-center space-x-1 transition-colors"
                      title="Explore Fiverr Gig Demand"
                    >
                      <span>Fiverr Gigs</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Custom Search Bar */}
          <div className="p-6 rounded-2xl bg-white border border-black/8 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-[#333333] uppercase tracking-wider">
              Custom Marketplace Query Launcher
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter skill or role (e.g. C# WPF, Entity Framework Core, ASP.NET Microservices)..."
                defaultValue={topCandidateSkills.slice(0, 3).join(' ')}
                id="customMarketplaceInput"
                className="flex-1 px-3 py-2.5 rounded-xl border border-black/10 text-xs text-[#333333] focus:outline-none focus:border-[#007070]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('customMarketplaceInput') as HTMLInputElement;
                    if (el) openUpworkSearch(el.value);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#14a800] hover:bg-[#108c00] text-white text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                >
                  <span>Launch Upwork</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('customMarketplaceInput') as HTMLInputElement;
                    if (el) openFreelancerSearch(el.value);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0288d1] hover:bg-[#0277bd] text-white text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                >
                  <span>Launch Freelancer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('customMarketplaceInput') as HTMLInputElement;
                    if (el) openFiverrSearch(el.value);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#1dbf73] hover:bg-[#19a463] text-white text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                >
                  <span>Launch Fiverr</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Live Freelance Radar */}
      {hubTab === 'liveRadar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0B0B0B]">
                {t.freelance?.liveProjectsTitle || 'Live Freelance Radar'}
              </h2>
              <p className="text-xs text-[#7C7C7C]">
                {t.freelance?.liveProjectsSubtitle ||
                  'Active freelance projects ingested directly via Freelancer.com API with S7 Match Scoring'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#007070] bg-[#E6F4F4] px-2.5 py-1.5 rounded-xl border border-[#007070]/20">
                {freelanceJobs.length} Active Projects
              </span>
              <button
                onClick={handleSyncFreelanceProjects}
                disabled={isSyncingFreelance || isLoadingJobs}
                className="px-3.5 py-1.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white text-xs font-bold inline-flex items-center space-x-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <DownloadCloud className={`w-3.5 h-3.5 ${isSyncingFreelance ? 'animate-bounce' : ''}`} />
                <span>{isSyncingFreelance ? (t.matches?.syncing || 'Syncing...') : (t.matches?.syncSource || 'Sync Freelancer')}</span>
              </button>
            </div>
          </div>

          {isLoadingJobs ? (
            <div className="p-12 text-center text-xs text-[#7C7C7C]">Loading active freelance projects...</div>
          ) : freelanceJobs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-black/8 space-y-4 shadow-xs">
              <Briefcase className="w-10 h-10 text-[#7C7C7C] mx-auto" />
              <p className="text-xs text-[#7C7C7C] max-w-md mx-auto">
                {t.freelance?.noProjectsFound || 'No freelance projects found matching your current filter. Click below to ingest live projects directly from Freelancer.com API.'}
              </p>
              <button
                onClick={handleSyncFreelanceProjects}
                disabled={isSyncingFreelance}
                className="px-5 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs inline-flex items-center space-x-2 transition-all shadow-[0_4px_16px_rgba(0,112,112,0.25)]"
              >
                <DownloadCloud className={`w-4 h-4 ${isSyncingFreelance ? 'animate-bounce' : ''}`} />
                <span>{isSyncingFreelance ? (t.matches?.syncing || 'Syncing...') : (t.matches?.syncFreelancerNow || 'Ingest Live Freelancer.com Projects')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {freelanceJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="p-5 rounded-2xl bg-white border border-black/8 shadow-2xs hover:border-[#007070]/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-[#0288d1] border border-sky-200">
                          Freelancer.com
                        </span>
                        {job.jobType && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                            {job.jobType}
                          </span>
                        )}
                        {job.salaryRange && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {job.salaryRange}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#0B0B0B] mt-1">{job.title}</h3>
                      <div className="text-xs text-[#7C7C7C] flex items-center space-x-2 mt-0.5">
                        <span>{job.company}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-center">
                        <div className="text-[10px] text-teal-800 font-bold uppercase">Match</div>
                        <div className="text-sm font-black text-[#007070]">{job.overallScore}%</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#333333] leading-relaxed line-clamp-3">
                    {job.description}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/5">
                    <div className="flex flex-wrap gap-1">
                      {job.matchingSkills?.slice(0, 4).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDraftProposalFromJob(job)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#007070] to-[#005858] hover:from-[#005858] hover:to-[#004040] text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Draft Freelance Bid</span>
                      </button>

                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] border border-black/10 text-xs font-bold flex items-center space-x-1.5 transition-all"
                        >
                          <span>Open Project</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: AI Proposal & Bid Copilot */}
      {hubTab === 'proposalCopilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="p-6 rounded-2xl bg-white border border-black/8 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#0B0B0B]">
                {t.freelance?.proposalCopilotTitle || 'AI Freelance Proposal & Bid Copilot'}
              </h2>
              <p className="text-xs text-[#7C7C7C]">
                {t.freelance?.proposalCopilotSubtitle ||
                  'Generate high-converting 3-part freelance proposals tailored to any client project brief'}
              </p>
            </div>

            <form onSubmit={handleGenerateProposal} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#333333]">
                  {t.freelance?.platformLabel || 'Target Marketplace'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Upwork', 'Freelancer', 'Fiverr'] as const).map((plt) => (
                    <button
                      key={plt}
                      type="button"
                      onClick={() => setTargetPlatform(plt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        targetPlatform === plt
                          ? 'bg-teal-50 border-[#007070] text-[#007070]'
                          : 'bg-[#F8FAFC] border-black/10 text-[#7C7C7C] hover:text-[#333333]'
                      }`}
                    >
                      {plt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#333333]">Project Title</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder={t.freelance?.projectTitlePlaceholder || 'Project Title (e.g. C# ASP.NET Core API Optimization)'}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs text-[#333333] focus:outline-none focus:border-[#007070]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#333333]">Client Name (Optional)</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={t.freelance?.clientNamePlaceholder || 'Client Name (optional)'}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs text-[#333333] focus:outline-none focus:border-[#007070]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#333333]">Client Brief / Job Description</label>
                <textarea
                  rows={5}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder={t.freelance?.projectDescPlaceholder || 'Paste the client job description or brief here...'}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs text-[#333333] focus:outline-none focus:border-[#007070] leading-relaxed resize-y"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#333333]">Custom Angle or Milestone Goal</label>
                <input
                  type="text"
                  value={customAngle}
                  onChange={(e) => setCustomAngle(e.target.value)}
                  placeholder={t.freelance?.customAnglePlaceholder || 'Custom pitch angle (e.g. emphasize SQL query optimization, 24h milestone)'}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs text-[#333333] focus:outline-none focus:border-[#007070]"
                />
              </div>

              {proposalError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200">
                  {proposalError}
                </div>
              )}

              <button
                type="submit"
                disabled={isGeneratingProposal}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#007070] to-[#005858] hover:from-[#005858] hover:to-[#004040] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGeneratingProposal
                    ? t.freelance?.generatingProposal || 'Drafting client proposal with AI...'
                    : t.freelance?.generateProposalBtn || 'Generate Winning Freelance Proposal'}
                </span>
              </button>
            </form>
          </div>

          {/* Proposal Output */}
          <div className="space-y-4">
            {proposalResult ? (
              <div className="p-6 rounded-2xl bg-white border border-[#007070]/20 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/8">
                  <div>
                    <span className="text-xs font-bold text-[#007070] uppercase tracking-wider">
                      Tailored for {targetPlatform}
                    </span>
                    <h3 className="text-sm font-bold text-[#0B0B0B]">Winning Bid Proposal Ready</h3>
                  </div>

                  <button
                    onClick={handleCopyProposal}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 text-[#007070] border border-teal-200 hover:bg-teal-100 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    {copiedProposal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedProposal ? t.freelance?.copiedSuccess || 'Copied!' : t.freelance?.copyFullProposal || 'Copy Proposal'}</span>
                  </button>
                </div>

                {/* Structured Insights */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-black/5 space-y-1">
                    <div className="text-[11px] font-bold text-[#007070]">
                      {t.freelance?.hookLabel || 'The Attention Hook (First 2 Lines)'}
                    </div>
                    <p className="text-xs text-[#333333] leading-relaxed font-medium">
                      {proposalResult.hook}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-black/5 space-y-1">
                    <div className="text-[11px] font-bold text-[#007070]">
                      {t.freelance?.proofLabel || 'Relevant Experience & CV Proof'}
                    </div>
                    <p className="text-xs text-[#333333] leading-relaxed">
                      {proposalResult.relevantExperienceProof}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-black/5 space-y-1">
                    <div className="text-[11px] font-bold text-[#007070]">
                      {t.freelance?.questionsLabel || 'Smart Clarifying Questions'}
                    </div>
                    <ul className="text-xs text-[#333333] space-y-1 list-disc list-inside">
                      {proposalResult.clarifyingQuestions.map((q, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#333333]">
                      {t.freelance?.fullProposalLabel || 'Complete Ready-to-Paste Bid'}
                    </label>
                    <textarea
                      readOnly
                      rows={8}
                      value={proposalResult.fullProposalText}
                      className="w-full p-3 rounded-xl bg-[#F8FAFC] border border-black/10 text-xs text-[#333333] leading-relaxed font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white border border-black/8 space-y-3">
                <Sparkles className="w-8 h-8 text-[#007070] mx-auto" />
                <h3 className="text-sm font-bold text-[#0B0B0B]">Proposal Preview</h3>
                <p className="text-xs text-[#7C7C7C] max-w-sm mx-auto leading-relaxed">
                  Fill in the project brief or select any project from the Live Radar to generate an elite, high-converting proposal.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

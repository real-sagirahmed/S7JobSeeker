import React, { useState, useEffect, useCallback } from 'react';
import type { BdCompany, TailoredPitch, JobMatch, ClusterSummary } from '../types';
import { CompanyCard } from './CompanyCard';
import { CompanyPitchModal } from './CompanyPitchModal';
import { SuggestCompanyModal } from './SuggestCompanyModal';
import { api } from '../services/api';
import {
  Search,
  Building2,
  Sparkles,
  Filter,
  X,
  ArrowLeft,
  ArrowRight,
  PlusCircle,
  Rocket,
  CreditCard,
  Cloud,
  Cpu,
  Palette,
  Code2,
  Check
} from 'lucide-react';

interface CompanyDirectoryProps {
  hasProfile: boolean;
  onSelectJobForApplication: (jobId: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORIES = [
  { id: 0, name: 'All Sectors' },
  { id: 1, name: 'Enterprise & Global Services' },
  { id: 2, name: 'Global SaaS & Products' },
  { id: 3, name: 'Fintech & High-Scale' },
  { id: 4, name: 'Cloud & DevOps' },
  { id: 5, name: 'AI & Data Intelligence' },
  { id: 6, name: 'Digital Agencies' }
];

const CLUSTER_STYLES: Record<string, {
  icon: typeof Rocket;
  gradient: string;
  border: string;
  iconColor: string;
  activeRing: string;
  badgeBg: string;
}> = {
  dotnet: {
    icon: Code2,
    gradient: 'from-purple-600/20 to-indigo-600/10',
    border: 'border-purple-300',
    iconColor: 'text-purple-700',
    activeRing: 'ring-purple-600/30 border-purple-500 bg-purple-50/60',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  GlobalSaaSAndProduct: {
    icon: Rocket,
    gradient: 'from-emerald-500/15 to-teal-500/5',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-700',
    activeRing: 'ring-emerald-600/30 border-emerald-500 bg-emerald-50/60',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  EnterpriseOutsourcing: {
    icon: Building2,
    gradient: 'from-blue-500/15 to-indigo-500/5',
    border: 'border-blue-200',
    iconColor: 'text-blue-700',
    activeRing: 'ring-blue-600/30 border-blue-500 bg-blue-50/60',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  FintechAndHighScale: {
    icon: CreditCard,
    gradient: 'from-amber-500/15 to-orange-500/5',
    border: 'border-amber-200',
    iconColor: 'text-amber-700',
    activeRing: 'ring-amber-600/30 border-amber-500 bg-amber-50/60',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  CloudDevOpsAndInfra: {
    icon: Cloud,
    gradient: 'from-cyan-500/15 to-sky-500/5',
    border: 'border-cyan-200',
    iconColor: 'text-cyan-700',
    activeRing: 'ring-cyan-600/30 border-cyan-500 bg-cyan-50/60',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  AIAndDataIntelligence: {
    icon: Cpu,
    gradient: 'from-purple-500/15 to-pink-500/5',
    border: 'border-purple-200',
    iconColor: 'text-purple-700',
    activeRing: 'ring-purple-600/30 border-purple-500 bg-purple-50/60',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  DigitalAgencyAndConsulting: {
    icon: Palette,
    gradient: 'from-rose-500/15 to-pink-500/5',
    border: 'border-rose-200',
    iconColor: 'text-rose-700',
    activeRing: 'ring-rose-600/30 border-rose-500 bg-rose-50/60',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
  }
};

export const CompanyDirectory: React.FC<CompanyDirectoryProps> = ({
  hasProfile,
  onSelectJobForApplication,
  showToast
}) => {
  const [companies, setCompanies] = useState<BdCompany[]>([]);
  const [clustersSummary, setClustersSummary] = useState<ClusterSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedClusterKey, setSelectedClusterKey] = useState<string>('all');
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [workModel, setWorkModel] = useState<string>('All');
  const [isBestFitMode, setIsBestFitMode] = useState(false);

  // Modals
  const [pitchCompany, setPitchCompany] = useState<BdCompany | null>(null);
  const [pitchData, setPitchData] = useState<TailoredPitch | null>(null);
  const [pitchType, setPitchType] = useState('ColdEmail');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  // Suggest company modal
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  // Active jobs modal
  const [activeJobsCompany, setActiveJobsCompany] = useState<BdCompany | null>(null);
  const [activeJobs, setActiveJobs] = useState<JobMatch[]>([]);
  const [isLoadingActiveJobs, setIsLoadingActiveJobs] = useState(false);

  // Fetch dynamic clusters summary
  const fetchClustersSummary = useCallback(async () => {
    setIsLoadingClusters(true);
    try {
      const summaries = await api.companies.getClustersSummary();
      setClustersSummary(summaries);
    } catch (err) {
      console.error('Failed to load clusters summary:', err);
    } finally {
      setIsLoadingClusters(false);
    }
  }, []);

  useEffect(() => {
    fetchClustersSummary();
  }, [fetchClustersSummary]);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeTechFilter = selectedTech || (selectedClusterKey === 'dotnet' ? '.NET' : undefined);

      if (isBestFitMode && hasProfile) {
        const matches = await api.companies.getTopMatches(60);
        let filtered = matches;

        if (selectedClusterKey === 'dotnet') {
          filtered = filtered.filter((c) =>
            c.primaryTechStack.some((t) =>
              ['.net', 'c#', 'dotnet', 'asp.net', 'ef core'].includes(t.toLowerCase())
            )
          );
        } else if (selectedCategory > 0) {
          filtered = filtered.filter((c) => c.category === selectedCategory);
        }

        if (activeTechFilter && selectedClusterKey !== 'dotnet') {
          const t = activeTechFilter.toLowerCase();
          filtered = filtered.filter((c) =>
            c.primaryTechStack.some((s) => s.toLowerCase() === t)
          );
        }

        if (workModel !== 'All') {
          filtered = filtered.filter((c) => c.workModel === workModel);
        }

        if (search.trim()) {
          const term = search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(term) ||
              c.description.toLowerCase().includes(term) ||
              c.globalProducts.toLowerCase().includes(term) ||
              c.primaryTechStack.some((s) => s.toLowerCase().includes(term))
          );
        }

        setCompanies(filtered);
        setTotalCount(filtered.length);
        setTotalPages(1);
      } else {
        const res = await api.companies.getAll({
          search: search.trim() || undefined,
          category: selectedClusterKey === 'dotnet' ? undefined : (selectedCategory > 0 ? selectedCategory : undefined),
          tech: activeTechFilter,
          workModel: workModel !== 'All' ? workModel : undefined,
          page: currentPage,
          pageSize: 18
        });
        setCompanies(res.items);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load company directory.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    isBestFitMode,
    hasProfile,
    selectedCategory,
    selectedClusterKey,
    selectedTech,
    workModel,
    search,
    currentPage,
    showToast
  ]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleClusterClick = (clusterKey: string, categoryId: number) => {
    if (selectedClusterKey === clusterKey) {
      // Toggle off
      setSelectedClusterKey('all');
      setSelectedCategory(0);
      if (clusterKey === 'dotnet') {
        setSelectedTech('');
      }
    } else {
      setSelectedClusterKey(clusterKey);
      if (clusterKey === 'dotnet') {
        setSelectedTech('.NET');
        setSelectedCategory(0);
      } else {
        setSelectedCategory(categoryId);
        if (selectedTech === '.NET') setSelectedTech('');
      }
    }
    setCurrentPage(1);
  };

  const handleSelectTech = (tech: string) => {
    if (selectedTech.toLowerCase() === tech.toLowerCase()) {
      setSelectedTech('');
    } else {
      setSelectedTech(tech);
      if (['.net', 'c#', 'dotnet', 'asp.net', 'ef core'].includes(tech.toLowerCase())) {
        setSelectedClusterKey('dotnet');
        setSelectedCategory(0);
      }
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory(0);
    setSelectedClusterKey('all');
    setSelectedTech('');
    setWorkModel('All');
    setCurrentPage(1);
  };

  const handleGeneratePitch = async (company: BdCompany, type: string = 'ColdEmail') => {
    setPitchCompany(company);
    setPitchType(type);
    setIsGeneratingPitch(true);
    try {
      const res = await api.companies.generatePitch(company.id, type);
      setPitchData(res);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to generate tailored pitch.', 'error');
      setPitchCompany(null);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handlePitchTypeChange = (newType: string) => {
    if (pitchCompany) {
      handleGeneratePitch(pitchCompany, newType);
    }
  };

  const handleViewActiveJobs = async (company: BdCompany) => {
    setActiveJobsCompany(company);
    setIsLoadingActiveJobs(true);
    try {
      const jobs = await api.companies.getActiveJobs(company.id);
      setActiveJobs(jobs);
    } catch (err) {
      console.error(err);
      showToast('Failed to load active jobs for this company.', 'error');
    } finally {
      setIsLoadingActiveJobs(false);
    }
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    selectedCategory > 0 ||
    selectedClusterKey !== 'all' ||
    selectedTech ||
    workModel !== 'All'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-black/10 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#E6F4F4] text-[#007070]">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="font-bold text-lg sm:text-xl text-[#0B0B0B]">
              180+ BD Global Tech Companies Ecosystem
            </h2>
          </div>
          <p className="text-xs text-[#555555]">
            Curated directory of top enterprise software houses, global SaaS creators & high-growth tech innovators in Bangladesh.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Suggest a Company Button */}
          <button
            onClick={() => setIsSuggestModalOpen(true)}
            className="flex-1 sm:flex-initial min-h-[44px] justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 bg-[#E6F4F4] text-[#007070] hover:bg-[#007070] hover:text-white border border-[#007070]/20 shrink-0 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Suggest a Company</span>
          </button>

          {/* Best Fit Switch */}
          {hasProfile && (
            <button
              onClick={() => {
                setIsBestFitMode(!isBestFitMode);
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-initial min-h-[44px] justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 active:scale-95 ${
                isBestFitMode
                  ? 'bg-[#007070] text-white shadow-md'
                  : 'bg-[#F8FAFC] text-[#333333] hover:bg-[#E6F4F4] hover:text-[#007070] border border-black/10'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isBestFitMode ? 'Showing: My Best Tech Fits' : 'Sort by: My Best Tech Fits'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Visual Clusters Section (Header + Grid) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Interactive Industry Clusters & .NET Hub
          </span>
          {isLoadingClusters && (
            <span className="text-[11px] text-slate-400 animate-pulse">Syncing real-time stats...</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
          {clustersSummary.map((cl) => {
            const style = CLUSTER_STYLES[cl.clusterKey] || CLUSTER_STYLES.EnterpriseOutsourcing;
            const Icon = style.icon;
            const isSelected = selectedClusterKey === cl.clusterKey;

            return (
              <button
                key={cl.clusterKey}
                onClick={() => handleClusterClick(cl.clusterKey, cl.categoryId)}
                className={`text-left p-3 sm:p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between active:scale-[0.98] ${
                  isSelected
                    ? `${style.activeRing} ring-2 shadow-sm`
                    : cl.isSpecial
                    ? 'border-purple-300 bg-gradient-to-br from-purple-50/50 to-white hover:border-purple-500 hover:shadow-xs'
                    : 'border-slate-200 bg-white hover:border-[#007070]/40 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${style.gradient} ${style.iconColor} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {cl.isSpecial ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-600 text-white shadow-2xs">
                        .NET Special
                      </span>
                    ) : isSelected ? (
                      <span className="text-[10px] font-bold text-[#007070] bg-white px-1.5 py-0.5 rounded-md border border-[#007070]/30 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Active
                      </span>
                    ) : cl.activeJobsCount > 0 ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {cl.activeJobsCount} jobs
                      </span>
                    ) : null}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mb-1">
                    {cl.title}
                  </h4>

                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#007070] mb-1">
                    <span>{cl.totalCompanies} Companies</span>
                    {cl.activeJobsCount > 0 && (
                      <span className="text-[10px] font-medium text-emerald-600">
                        • {cl.activeJobsCount} open
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 line-clamp-1 mb-2">
                    {cl.tagline}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium truncate" title={cl.featuredCompanies.join(', ')}>
                  {cl.featuredCompanies.length > 0 ? cl.featuredCompanies.join(', ') : 'Verified BD firms'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C7C7C]" />
            <input
              type="text"
              placeholder="Search companies by name, products, or tech stack (e.g., .NET, React, Python)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-10 py-2.5 min-h-[44px] bg-[#F8FAFC] border border-black/10 rounded-xl text-base sm:text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-hidden focus:border-[#007070] focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[#7C7C7C] hover:text-[#0B0B0B] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Work Model Selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#7C7C7C]" />
            <select
              value={workModel}
              onChange={(e) => {
                setWorkModel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2.5 min-h-[44px] bg-[#F8FAFC] border border-black/10 rounded-xl text-base sm:text-xs text-[#333333] font-medium focus:outline-hidden focus:border-[#007070]"
            >
              <option value="All">All Work Models</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>
        </div>

        {/* Category Pills & Active Filter Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                if (selectedClusterKey === 'dotnet') setSelectedClusterKey('all');
                setCurrentPage(1);
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                selectedCategory === cat.id && selectedClusterKey !== 'dotnet'
                  ? 'bg-[#007070] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#555555] hover:bg-[#E6F4F4] hover:text-[#007070] border border-black/5'
              }`}
            >
              {cat.name}
            </button>
          ))}

          {/* Active Quick Filters */}
          {selectedClusterKey === 'dotnet' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs">
              <span>🟣 .NET & C# Companies</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedClusterKey('all');
                  setSelectedTech('');
                }}
                className="hover:text-rose-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {selectedTech && selectedClusterKey !== 'dotnet' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#E6F4F4] text-[#007070] border border-[#007070]/30 shadow-2xs">
              <span>Tech: {selectedTech}</span>
              <button
                type="button"
                onClick={() => setSelectedTech('')}
                className="hover:text-rose-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 ml-auto transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#7C7C7C] px-1">
        <span>
          Showing <strong className="text-[#0B0B0B]">{companies.length}</strong> of{' '}
          <strong className="text-[#0B0B0B]">{totalCount}</strong> verified tech companies
          {selectedClusterKey === 'dotnet' && (
            <span className="text-purple-700 font-bold ml-1.5 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              (.NET Ecosystem)
            </span>
          )}
        </span>
        {isBestFitMode && (
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            ✓ Ranked by your resume tech overlap
          </span>
        )}
      </div>

      {/* Grid of Companies */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#007070] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#7C7C7C]">Loading ecosystem directory & calculating fit scores...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 mx-auto text-[#7C7C7C]" />
          <h3 className="font-bold text-sm text-[#0B0B0B]">No companies matched your filter criteria</h3>
          <p className="text-xs text-[#7C7C7C]">Try clearing the search term or choosing "All Sectors".</p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#007070] text-white hover:bg-[#005a5a] transition-all inline-flex items-center gap-1.5"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onGeneratePitch={(c) => handleGeneratePitch(c, 'ColdEmail')}
              onViewActiveJobs={handleViewActiveJobs}
              onSelectTech={handleSelectTech}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isBestFitMode && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-black/10 bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Previous page"
          >
            <ArrowLeft className="w-4 h-4 text-[#333333]" />
          </button>
          <span className="text-xs font-semibold px-4 text-[#333333]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-black/10 bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Next page"
          >
            <ArrowRight className="w-4 h-4 text-[#333333]" />
          </button>
        </div>
      )}

      {/* Pitch Modal */}
      {pitchCompany && pitchData && (
        <CompanyPitchModal
          company={pitchCompany}
          pitch={pitchData}
          pitchType={pitchType}
          onPitchTypeChange={handlePitchTypeChange}
          isLoading={isGeneratingPitch}
          onClose={() => {
            setPitchCompany(null);
            setPitchData(null);
          }}
        />
      )}

      {/* Active Jobs in S7 Modal */}
      {activeJobsCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="font-bold text-base text-[#0B0B0B]">
                  Active Openings at {activeJobsCompany.name}
                </h3>
                <p className="text-xs text-[#7C7C7C]">
                  Available directly in S7JobSeeker database
                </p>
              </div>
              <button
                onClick={() => setActiveJobsCompany(null)}
                className="p-1.5 rounded-lg text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {isLoadingActiveJobs ? (
                <div className="py-8 text-center text-xs text-[#7C7C7C]">Loading active circulars...</div>
              ) : activeJobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7C7C7C]">
                  No active openings currently tracked in database.
                </div>
              ) : (
                activeJobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="p-4 rounded-xl border border-black/10 bg-[#F8FAFC] hover:bg-white hover:border-[#007070]/30 transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-[#0B0B0B]">{job.title}</h4>
                      <div className="text-[11px] text-[#7C7C7C] flex items-center space-x-2 mt-0.5">
                        <span>{job.location}</span>
                        {job.salaryRange && <span>• {job.salaryRange}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-black/10 text-[#333333] hover:text-[#007070]"
                        >
                          Apply ↗
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setActiveJobsCompany(null);
                          onSelectJobForApplication(job.jobId);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#007070] text-white hover:bg-[#005a5a]"
                      >
                        Tailor Application
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggest Company Modal */}
      <SuggestCompanyModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        onSuccess={() => {
          showToast('Company submitted successfully! Added to BD Tech Directory.', 'success');
          fetchCompanies();
          fetchClustersSummary();
        }}
      />
    </div>
  );
};

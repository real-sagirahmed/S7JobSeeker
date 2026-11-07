import React, { useState, useEffect, useCallback } from 'react';
import type { BdCompany, TailoredPitch, JobMatch } from '../types';
import { CompanyCard } from './CompanyCard';
import { CompanyPitchModal } from './CompanyPitchModal';
import { api } from '../services/api';
import { Search, Building2, Sparkles, Filter, X, ArrowLeft, ArrowRight } from 'lucide-react';

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

export const CompanyDirectory: React.FC<CompanyDirectoryProps> = ({
  hasProfile,
  onSelectJobForApplication,
  showToast
}) => {
  const [companies, setCompanies] = useState<BdCompany[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [workModel, setWorkModel] = useState<string>('All');
  const [isBestFitMode, setIsBestFitMode] = useState(false);

  // Modals
  const [pitchCompany, setPitchCompany] = useState<BdCompany | null>(null);
  const [pitchData, setPitchData] = useState<TailoredPitch | null>(null);
  const [pitchType, setPitchType] = useState('ColdEmail');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  // Active jobs modal
  const [activeJobsCompany, setActiveJobsCompany] = useState<BdCompany | null>(null);
  const [activeJobs, setActiveJobs] = useState<JobMatch[]>([]);
  const [isLoadingActiveJobs, setIsLoadingActiveJobs] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isBestFitMode && hasProfile) {
        const matches = await api.companies.getTopMatches(50);
        let filtered = matches;
        if (selectedCategory > 0) {
          filtered = filtered.filter((c) => c.category === selectedCategory);
        }
        if (workModel !== 'All') {
          filtered = filtered.filter((c) => c.workModel === workModel);
        }
        if (search.trim()) {
          const t = search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(t) ||
              c.description.toLowerCase().includes(t) ||
              c.primaryTechStack.some((s) => s.toLowerCase().includes(t))
          );
        }
        setCompanies(filtered);
        setTotalCount(filtered.length);
        setTotalPages(1);
      } else {
        const res = await api.companies.getAll({
          search: search.trim() || undefined,
          category: selectedCategory > 0 ? selectedCategory : undefined,
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
  }, [isBestFitMode, hasProfile, selectedCategory, workModel, search, currentPage, showToast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#E6F4F4] text-[#007070]">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="font-bold text-xl text-[#0B0B0B]">
              180+ BD Global Tech Companies Ecosystem
            </h2>
          </div>
          <p className="text-xs text-[#555555]">
            Curated directory of top enterprise software houses, global SaaS creators & high-growth tech innovators in Bangladesh.
          </p>
        </div>

        {/* Best Fit Switch */}
        {hasProfile && (
          <button
            onClick={() => {
              setIsBestFitMode(!isBestFitMode);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
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
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-black/10 rounded-xl text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-hidden focus:border-[#007070] focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C7C7C] hover:text-[#0B0B0B]"
              >
                <X className="w-3.5 h-3.5" />
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
              className="px-3 py-2.5 bg-[#F8FAFC] border border-black/10 rounded-xl text-xs text-[#333333] font-medium focus:outline-hidden focus:border-[#007070]"
            >
              <option value="All">All Work Models</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#007070] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#555555] hover:bg-[#E6F4F4] hover:text-[#007070] border border-black/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#7C7C7C] px-1">
        <span>
          Showing <strong className="text-[#0B0B0B]">{companies.length}</strong> of{' '}
          <strong className="text-[#0B0B0B]">{totalCount}</strong> verified tech companies
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onGeneratePitch={(c) => handleGeneratePitch(c, 'ColdEmail')}
              onViewActiveJobs={handleViewActiveJobs}
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
            className="p-2 rounded-xl border border-black/10 bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#333333]" />
          </button>
          <span className="text-xs font-semibold px-4 text-[#333333]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-black/10 bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                className="p-1.5 rounded-lg text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5"
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
    </div>
  );
};

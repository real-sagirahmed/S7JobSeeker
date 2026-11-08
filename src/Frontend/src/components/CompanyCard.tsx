import React from 'react';
import type { BdCompany } from '../types';
import { ExternalLink, Sparkles, ShieldCheck, MapPin, Briefcase, Globe, Users } from 'lucide-react';

interface CompanyCardProps {
  company: BdCompany;
  onGeneratePitch: (company: BdCompany) => void;
  onViewActiveJobs: (company: BdCompany) => void;
}

const CATEGORY_NAMES: Record<number, string> = {
  1: 'Enterprise Outsourcing',
  2: 'Global SaaS & Product',
  3: 'Fintech & High-Scale',
  4: 'Cloud & DevOps Infra',
  5: 'AI & Data Intelligence',
  6: 'Digital Agency & Consulting'
};

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onGeneratePitch,
  onViewActiveJobs
}) => {
  const matchingSet = new Set(company.matchingSkills?.map((s) => s.toLowerCase()) ?? []);

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-4 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header: Name, Verified Badge & Fit Score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base sm:text-lg text-[#0B0B0B] group-hover:text-[#007070] transition-colors leading-tight truncate">
                {company.name}
              </h3>
              {company.isVerified && (
                <span title="Verified BD Global Tech Company">
                  <ShieldCheck className="w-4 h-4 text-[#007070] shrink-0" />
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1 flex-wrap">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F8FAFC] text-[#555555] border border-black/5">
                {CATEGORY_NAMES[company.category] || 'Tech'}
              </span>
              <span className="text-xs text-[#7C7C7C] flex items-center">
                <MapPin className="w-3 h-3 mr-0.5 text-[#7C7C7C]" /> {company.headquarters.split(',')[0]}
              </span>
            </div>
          </div>

          {/* Tech Fit % Badge */}
          {company.fitScore !== undefined && company.fitScore !== null && (
            <div
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center shrink-0 ${
                company.fitScore >= 70
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : company.fitScore >= 40
                  ? 'bg-[#E6F4F4] text-[#007070] border-[#007070]/20'
                  : 'bg-stone-50 text-stone-600 border-stone-200'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Tech Fit</span>
              <span className="text-base font-extrabold">{company.fitScore}%</span>
            </div>
          )}
        </div>

        {/* Global Products / Solutions */}
        {company.globalProducts && (
          <div className="text-xs font-semibold text-[#007070] mb-2 line-clamp-1">
            🚀 {company.globalProducts}
          </div>
        )}

        {/* Company Description */}
        <p className="text-xs text-[#555555] leading-relaxed line-clamp-2 mb-4">
          {company.description}
        </p>

        {/* Primary Tech Stack Pills */}
        <div className="mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7C7C7C] mb-1.5">
            Core Tech Stack
          </div>
          <div className="flex flex-wrap gap-1.5">
            {company.primaryTechStack.map((tech) => {
              const isMatch = matchingSet.has(tech.toLowerCase());
              return (
                <span
                  key={tech}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                    isMatch
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                      : 'bg-[#F8FAFC] text-[#444444] border-black/5'
                  }`}
                >
                  {isMatch && '✓ '}
                  {tech}
                </span>
              );
            })}
          </div>
        </div>

        {/* Meta Info: Global Offices & Work Model */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#7C7C7C] pt-3 border-t border-black/5 mb-4">
          <span className="flex items-center">
            <Briefcase className="w-3.5 h-3.5 mr-1 text-[#007070]" /> {company.workModel}
          </span>
          <span className="flex items-center">
            <Users className="w-3.5 h-3.5 mr-1 text-[#7C7C7C]" /> {company.employeeCountRange}
          </span>
          {company.globalOffices && (
            <span className="flex items-center truncate max-w-[200px]" title={company.globalOffices}>
              <Globe className="w-3.5 h-3.5 mr-1 text-[#007070]" /> {company.globalOffices}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-black/10 flex flex-col gap-2">
        {/* Active Jobs Link in S7 if available */}
        {company.activeJobsCount > 0 ? (
          <button
            onClick={() => onViewActiveJobs(company)}
            className="w-full min-h-[40px] py-1.5 px-3 rounded-xl text-xs font-bold bg-[#E6F4F4] text-[#007070] hover:bg-[#d0eded] active:scale-[0.98] transition-colors flex items-center justify-center space-x-1.5 border border-[#007070]/20"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{company.activeJobsCount} Active Circular{company.activeJobsCount > 1 ? 's' : ''} in S7</span>
          </button>
        ) : (
          <div className="text-[11px] text-[#7C7C7C] text-center italic py-1">
            No active openings in S7 today • Pitch proactively below
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {/* Official Careers Portal Button */}
          <a
            href={company.careersUrl || company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] active:scale-[0.98] transition-colors flex items-center justify-center space-x-1.5 border border-black/10"
          >
            <span>Careers Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* AI Targeted Pitch Generator Button */}
          <button
            onClick={() => onGeneratePitch(company)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-[#007070] hover:bg-[#005a5a] text-white active:scale-[0.98] transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tailor Pitch</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ExternalLink, Bookmark, Sparkles, CheckCircle2, AlertTriangle, FileEdit } from 'lucide-react';
import type { JobMatch } from '../types';

interface JobMatchCardProps {
  match: JobMatch;
  onGenerateApplication: (jobId: string) => void;
  onToggleBookmark: (jobId: string) => void;
  isGenerating?: boolean;
}

export const JobMatchCard: React.FC<JobMatchCardProps> = ({
  match,
  onGenerateApplication,
  onToggleBookmark,
  isGenerating
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#007070] bg-[#E6F4F4] border-[#007070]/40';
    if (score >= 65) return 'text-sky-700 bg-sky-50 border-sky-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const getSourceBadge = () => {
    const name = match.sourceName || (
      match.source === 7 ? 'BDJobs' :
      match.source === 3 ? 'Jobicy' :
      match.source === 5 ? 'Himalayas' :
      match.source === 6 ? 'We Work Remotely' :
      match.source === 1 ? 'Remotive' :
      match.source === 2 ? 'Arbeitnow' :
      match.source === 4 ? 'Custom Opportunity' : null
    );

    if (!name) return null;

    let style = 'bg-slate-100 text-slate-700 border-slate-200';
    if (name.includes('BDJobs') || match.source === 7) {
      style = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold';
    } else if (name.includes('Jobicy') || match.source === 3) {
      style = 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
    } else if (name.includes('Himalayas') || match.source === 5) {
      style = 'bg-purple-50 text-purple-800 border-purple-200 font-bold';
    } else if (name.includes('We Work Remotely') || match.source === 6) {
      style = 'bg-orange-50 text-orange-800 border-orange-200 font-bold';
    } else if (name.includes('Remotive') || match.source === 1) {
      style = 'bg-sky-50 text-sky-800 border-sky-200 font-bold';
    } else if (name.includes('Arbeitnow') || match.source === 2) {
      style = 'bg-slate-50 text-slate-800 border-slate-200 font-bold';
    }

    return (
      <span className={`px-2 py-0.5 text-[11px] rounded-md border flex items-center space-x-1 ${style}`}>
        <span>{name}</span>
      </span>
    );
  };

  const getDirectApplicationUrl = (url?: string) => {
    if (!url) return undefined;
    // ARCHITECTURAL INTENT: Direct route to BDJobs Angular SPA details/:id to prevent 404
    if (url.includes('bdjobs.com/')) {
      const idMatch = url.match(/(?:id=|details\/)(\d+)/);
      if (idMatch && idMatch[1]) {
        return `https://bdjobs.com/h/details/${idMatch[1]}`;
      }
    }
    return url;
  };

  const directUrl = getDirectApplicationUrl(match.url);

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-6 space-y-5 hover:border-[#007070] transition-all shadow-[0_8px_25px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#0B0B0B] transition-colors">
              {match.title}
            </h3>
            {getSourceBadge()}
            {match.isRemote && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-[#E6F4F4] text-[#007070] border border-[#007070]/20">
                Remote
              </span>
            )}
            {match.jobType && (
              <span className="px-2 py-0.5 text-xs rounded-md bg-[#F8FAFC] text-[#333333] border border-black/8">
                {match.jobType}
              </span>
            )}
          </div>
          <div className="text-xs font-medium text-[#7C7C7C]">
            {match.company} • <span className="text-[#333333]">{match.location || 'Anywhere'}</span>
            {match.salaryRange && <span className="text-[#007070] ml-2 font-bold">• {match.salaryRange}</span>}
          </div>
        </div>

        {/* Overall Match Badge */}
        <div className="flex items-center space-x-3 self-start">
          <button
            onClick={() => onToggleBookmark(match.jobId)}
            title={match.isBookmarked ? 'Remove Bookmark' : 'Save Job'}
            className={`p-2.5 rounded-xl border transition-colors ${
              match.isBookmarked
                ? 'bg-amber-100 border-amber-300 text-amber-700'
                : 'border-black/10 text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-[#F8FAFC]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${match.isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <div className={`px-4 py-2 rounded-xl border text-center font-bold ${getScoreColor(match.overallScore)}`}>
            <div className="text-xl leading-none font-black">{match.overallScore}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">Match Score</div>
          </div>
        </div>
      </div>

      {/* Score breakdown metrics */}
      <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8FAFC] p-3 rounded-xl border border-black/5">
        <div>
          <span className="text-[#7C7C7C]">Semantic Relevance:</span>{' '}
          <span className="font-bold text-[#007070]">{match.semanticSimilarityScore}%</span>
        </div>
        <div>
          <span className="text-[#7C7C7C]">Skill Competency:</span>{' '}
          <span className="font-bold text-emerald-700">{match.skillMatchScore}%</span>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="space-y-3">
        {match.matchingSkills.length > 0 && (
          <div>
            <div className="text-xs font-bold text-emerald-800 flex items-center mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Matching Competencies ({match.matchingSkills.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.matchingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {match.missingSkills.length > 0 && (
          <div>
            <div className="text-xs font-bold text-amber-800 flex items-center mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Skill Gaps To Bridge ({match.missingSkills.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md text-xs bg-amber-50 text-amber-900 border border-amber-200 font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {match.recommendations && (
        <div className="p-3.5 rounded-xl bg-[#E6F4F4]/70 border border-[#007070]/25 text-xs text-[#333333] space-y-1">
          <div className="font-bold text-[#007070] flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Advisor Insight
          </div>
          <p className="leading-relaxed">{match.recommendations}</p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-3 border-t border-black/8 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onGenerateApplication(match.jobId)}
          disabled={isGenerating}
          className="px-4 py-2 rounded-xl bg-[#007070] hover:bg-[#005858] text-white text-xs font-bold flex items-center space-x-2 transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(0,112,112,0.20)]"
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Drafting Application...' : 'Generate Cover Letter & Tips'}</span>
        </button>

        {directUrl && (
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] text-xs font-bold flex items-center space-x-1.5 transition-colors border border-black/8"
          >
            <span>Apply on {match.sourceName || 'Portal'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};

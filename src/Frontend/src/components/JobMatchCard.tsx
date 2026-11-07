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
    if (score >= 80) return 'text-[#007070] bg-[#007070]/15 border-[#007070]/40';
    if (score >= 65) return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 space-y-5 hover:border-[#007070]/60 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-white transition-colors">
              {match.title}
            </h3>
            {match.isRemote && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-[#007070]/15 text-[#007070] border border-[#007070]/30">
                Remote
              </span>
            )}
            {match.jobType && (
              <span className="px-2 py-0.5 text-xs rounded-md bg-[#1A1A1A] text-[#CCCCCC] border border-white/10">
                {match.jobType}
              </span>
            )}
          </div>
          <div className="text-xs font-medium text-[#919191]">
            {match.company} • <span className="text-[#CCCCCC]">{match.location || 'Anywhere'}</span>
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
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'border-white/10 text-[#919191] hover:text-white hover:bg-white/5'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${match.isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <div className={`px-4 py-2 rounded-xl border text-center font-bold ${getScoreColor(match.overallScore)}`}>
            <div className="text-xl leading-none">{match.overallScore}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">Match Score</div>
          </div>
        </div>
      </div>

      {/* Score breakdown metrics */}
      <div className="grid grid-cols-2 gap-3 text-xs bg-[#0D0D0D] p-3 rounded-xl border border-white/5">
        <div>
          <span className="text-[#919191]">Semantic Relevance:</span>{' '}
          <span className="font-bold text-[#007070]">{match.semanticSimilarityScore}%</span>
        </div>
        <div>
          <span className="text-[#919191]">Skill Competency:</span>{' '}
          <span className="font-bold text-emerald-400">{match.skillMatchScore}%</span>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="space-y-3">
        {match.matchingSkills.length > 0 && (
          <div>
            <div className="text-xs font-bold text-emerald-400 flex items-center mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Matching Competencies ({match.matchingSkills.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.matchingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {match.missingSkills.length > 0 && (
          <div>
            <div className="text-xs font-bold text-amber-400 flex items-center mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Skill Gaps To Bridge ({match.missingSkills.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium"
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
        <div className="p-3.5 rounded-xl bg-[#007070]/10 border border-[#007070]/30 text-xs text-[#CCCCCC] space-y-1">
          <div className="font-bold text-[#007070] flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Advisor Insight
          </div>
          <p className="leading-relaxed">{match.recommendations}</p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onGenerateApplication(match.jobId)}
          disabled={isGenerating}
          className="px-4 py-2 rounded-xl bg-[#007070] hover:bg-[#005858] text-white text-xs font-bold flex items-center space-x-2 transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(0,112,112,0.25)]"
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Drafting Application...' : 'Generate Cover Letter & Tips'}</span>
        </button>

        {match.url && (
          <a
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#0B0B0B] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-white/10"
          >
            <span>Apply on Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};

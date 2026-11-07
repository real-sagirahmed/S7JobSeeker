import React, { useState } from 'react';
import { ClipboardCheck, Sparkles, AlertCircle } from 'lucide-react';
import type { JobMatch } from '../types';
import { api } from '../services/api';
import { JobMatchCard } from './JobMatchCard';

interface PasteAndAnalyzeProps {
  onGenerateApplication: (jobId: string) => void;
  onToggleBookmark: (jobId: string) => void;
}

export const PasteAndAnalyze: React.FC<PasteAndAnalyzeProps> = ({
  onGenerateApplication,
  onToggleBookmark
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluatedMatch, setEvaluatedMatch] = useState<JobMatch | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide the job description text.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await api.jobs.pasteAndMatch(title, company, description);
      setEvaluatedMatch(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to analyze custom job.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#007070]/15 border border-[#007070]/30 flex items-center justify-center text-[#007070]">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Paste & Analyze Custom Circular</h3>
            <p className="text-xs text-[#919191]">Paste any job circular from LinkedIn, BDJobs or an email to evaluate candidate fit</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#CCCCCC] mb-1">Job Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Senior .NET Architect"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#CCCCCC] mb-1">Company (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Microsoft / Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#CCCCCC] mb-1">
              Job Circular / Requirements Text <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={6}
              required
              placeholder="Paste the job requirements, responsibilities, or entire circular text here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070] font-mono leading-relaxed"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-5 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs flex items-center space-x-2 transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(0,112,112,0.30)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? 'Evaluating Match via Gemini RAG...' : 'Evaluate Match with My Resume'}</span>
            </button>
          </div>
        </form>
      </div>

      {evaluatedMatch && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-1.5 text-[#007070]" /> Evaluation Result
          </h4>
          <JobMatchCard
            match={evaluatedMatch}
            onGenerateApplication={onGenerateApplication}
            onToggleBookmark={onToggleBookmark}
          />
        </div>
      )}
    </div>
  );
};

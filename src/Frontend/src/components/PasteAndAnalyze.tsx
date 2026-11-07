import React, { useState } from 'react';
import { ClipboardCheck, Sparkles, AlertCircle, RotateCcw, CheckSquare, BookOpen } from 'lucide-react';
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
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluatedMatch, setEvaluatedMatch] = useState<JobMatch | null>(null);
  const [checkedSkills, setCheckedSkills] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide the job description text.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await api.jobs.pasteAndMatch(title, company, description, url);
      setEvaluatedMatch(result);
      setCheckedSkills({});
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

  const handleReset = () => {
    setTitle('');
    setCompany('');
    setUrl('');
    setDescription('');
    setEvaluatedMatch(null);
    setError(null);
    setCheckedSkills({});
  };

  const handleLocalToggleBookmark = (jobId: string) => {
    onToggleBookmark(jobId);
    if (evaluatedMatch && evaluatedMatch.jobId === jobId) {
      setEvaluatedMatch((prev) => (prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null));
    }
  };

  const toggleSkillCheck = (skill: string) => {
    setCheckedSkills((prev) => ({
      ...prev,
      [skill]: !prev[skill]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/8 bg-white p-6 space-y-5 shadow-[0_8px_25px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between pb-4 border-b border-black/8">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4F4] border border-[#007070]/20 flex items-center justify-center text-[#007070]">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-[#0B0B0B] text-base">Paste & Analyze Custom Circular</h3>
              <p className="text-xs text-[#7C7C7C]">Paste any job circular from LinkedIn, BDJobs or an email to evaluate candidate fit</p>
            </div>
          </div>
          {evaluatedMatch && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 text-xs text-[#333333] font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#7C7C7C]" />
              <span>Clear & Paste Another</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1">Job Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Senior .NET Architect"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-black/10 text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1">Company (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Microsoft / Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-black/10 text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1">Circular / Application URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-black/10 text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1">
              Job Circular / Requirements Text <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              placeholder="Paste the job requirements, responsibilities, or entire circular text here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-black/10 text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070] font-mono leading-relaxed"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {evaluatedMatch && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-xs text-[#333333] font-semibold transition-colors"
              >
                Reset
              </button>
            )}
            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-5 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs flex items-center space-x-2 transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(0,112,112,0.25)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? 'Evaluating Match via Gemini RAG...' : 'Evaluate Match with My Resume'}</span>
            </button>
          </div>
        </form>
      </div>

      {evaluatedMatch && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#0B0B0B] flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-[#007070]" /> Evaluation Result & Actions
            </h4>
            <span className="text-xs text-[#7C7C7C]">
              Persisted in Database & ready for tailored cover letter or bookmarking
            </span>
          </div>

          <JobMatchCard
            match={evaluatedMatch}
            onGenerateApplication={onGenerateApplication}
            onToggleBookmark={handleLocalToggleBookmark}
          />

          {evaluatedMatch.missingSkills && evaluatedMatch.missingSkills.length > 0 && (
            <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-50/50 space-y-3">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Skill Gap Bridge & Interview Preparation Checklist</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                এই সার্কুলারে উল্লিখিত নিচের স্কিলগুলো আপনার রেজুমিতে পাওয়া যায়নি। ইন্টারভিউতে অংশ নেওয়ার আগে বা কভার লেটারে হাইলাইট করার জন্য এগুলো রিভিশন দিন:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {evaluatedMatch.missingSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkillCheck(skill)}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl border text-xs text-left transition-all ${
                      checkedSkills[skill]
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 line-through opacity-70'
                        : 'bg-white border-amber-200/80 text-[#333333] hover:border-amber-400'
                    }`}
                  >
                    <CheckSquare
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        checkedSkills[skill] ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    />
                    <span className="font-medium truncate">{skill}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  Sparkles,
  AlertCircle,
  Layers,
  Plus,
  X,
  RefreshCw,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Shield,
  FileText,
  Building2,
  Zap
} from 'lucide-react';
import type { ResumeProfile, User } from '../types';
import { api } from '../services/api';

interface ResumeUploaderProps {
  profile: ResumeProfile | null;
  user?: User | null;
  onProfileUpdated: (profile: ResumeProfile) => void;
  onNavigateToMatches?: () => void;
  onNavigateToCompanies?: () => void;
}

const RECOMMENDED_SKILLS = [
  { name: 'Docker', category: 4 },
  { name: 'Azure', category: 4 },
  { name: 'Microservices', category: 7 },
  { name: 'Redis', category: 3 },
  { name: 'Kubernetes', category: 4 },
  { name: 'PostgreSQL', category: 3 },
  { name: 'CI/CD', category: 4 },
  { name: 'MongoDB', category: 3 }
];

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  profile,
  user,
  onProfileUpdated,
  onNavigateToMatches,
  onNavigateToCompanies
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [showUploaderDrawer, setShowUploaderDrawer] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number>(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const updatedProfile = await api.profile.uploadResume(file);
      onProfileUpdated(updatedProfile);
      setShowUploaderDrawer(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during resume parsing.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSkill = async (skillName: string, category: number = 9) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    setIsAddingSkill(true);
    setError(null);
    try {
      const updated = await api.profile.addSkill(trimmed, category);
      onProfileUpdated(updated);
      setNewSkillName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add skill');
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (skillName: string) => {
    setError(null);
    try {
      const updated = await api.profile.deleteSkill(skillName);
      onProfileUpdated(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove skill');
    }
  };

  const getCategoryLabel = (cat: number): string => {
    switch (cat) {
      case 1: return 'Backend';
      case 2: return 'Frontend';
      case 3: return 'Database';
      case 4: return 'Cloud & DevOps';
      case 5: return 'AI & Data';
      case 6: return 'Mobile';
      case 7: return 'Architecture';
      case 8: return 'Soft Skill';
      default: return 'General';
    }
  };

  const getCategoryBadgeClass = (cat: number): string => {
    switch (cat) {
      case 1: return 'bg-blue-50 text-blue-700 border-blue-200';
      case 2: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 3: return 'bg-amber-50 text-amber-700 border-amber-200';
      case 4: return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 5: return 'bg-purple-50 text-purple-700 border-purple-200';
      case 7: return 'bg-teal-50 text-[#007070] border-teal-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const displayName = profile?.fullName && profile.fullName.toLowerCase() !== 'candidate'
    ? profile.fullName
    : user?.fullName || 'Candidate';

  const displayEmail = profile?.email || user?.email || '';

  const filteredSkills = profile?.skills
    ? selectedCategoryFilter === 0
      ? profile.skills
      : profile.skills.filter((s) => s.category === selectedCategoryFilter)
    : [];

  const unaddedRecommendations = RECOMMENDED_SKILLS.filter(
    (rec) => !profile?.skills.some((s) => s.name.toLowerCase() === rec.name.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#E6F4F4] text-[#007070] shrink-0">
              <FileCheck className="w-5 h-5" />
            </span>
            <h1 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-snug">
              Career Profile & Resume Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            AI-extracted competencies, career summary, and verified credentials for BD & Global tech matching.
          </p>
        </div>

        {profile && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowUploaderDrawer(!showUploaderDrawer)}
              className="flex-1 sm:flex-initial min-h-[44px] justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 bg-[#F8FAFC] text-slate-700 hover:bg-[#E6F4F4] hover:text-[#007070] border border-slate-200 shrink-0 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{showUploaderDrawer ? 'Hide Re-upload' : 'Update Resume'}</span>
            </button>
            {onNavigateToMatches && (
              <button
                onClick={onNavigateToMatches}
                className="flex-1 sm:flex-initial min-h-[44px] justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 bg-[#007070] text-white hover:bg-[#005a5a] shadow-xs shrink-0 active:scale-95"
              >
                <span>View Job Matches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-xs shadow-xs animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Re-Upload Dropzone Drawer / Initial Upload Screen */}
      {(!profile || showUploaderDrawer) && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-teal-300 bg-gradient-to-b from-[#F0FDF4]/30 to-[#E6F4F4]/50 hover:border-[#007070] transition-all text-center relative group shadow-sm">
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#007070]/20 flex items-center justify-center text-[#007070] group-hover:scale-105 transition-transform shadow-md">
              {isUploading ? (
                <div className="w-7 h-7 border-3 border-[#007070] border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isUploading ? 'Extracting Resume & Structuring Profile...' : 'Upload your Resume / CV'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Drag and drop your PDF or TXT resume here (Max 10MB)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="inline-flex items-center text-[11px] font-semibold text-[#007070] bg-white px-3 py-1 rounded-full border border-[#007070]/20 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Auto-extracts skills & role
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                <Shield className="w-3.5 h-3.5 mr-1 text-slate-400" /> Private & Secure
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Structured Profile Display */}
      {profile && (
        <div className="space-y-6">
          {/* Hero Profile Overview Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-50/60 to-transparent rounded-bl-full pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-0">
              <div className="flex items-start sm:items-center gap-4">
                {/* Initials Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#007070] to-[#009b9b] text-white flex items-center justify-center text-xl font-bold tracking-tight shadow-md shrink-0">
                  {displayName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {displayName}
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> AI-Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm font-semibold text-[#007070]">
                      {profile.targetRole || user?.targetRole || '.NET & Full Stack Developer'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-600 flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {profile.totalYearsOfExperience || 3}+ Years Experience
                    </span>
                  </div>

                  {/* Contact Row */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                    {displayEmail && (
                      <a
                        href={`mailto:${displayEmail}`}
                        className="flex items-center hover:text-[#007070] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <span>{displayEmail}</span>
                      </a>
                    )}
                    {profile.phone && (
                      <span className="flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <span>{profile.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Strength & Quick CTA */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 lg:min-w-[260px] space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Profile Strength
                  </span>
                  <span className="text-emerald-700 font-bold">92% Complete</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full w-[92%]" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  High semantic match rating for top BD tech firms & global remote engineering roles.
                </p>
                {onNavigateToCompanies && (
                  <button
                    onClick={onNavigateToCompanies}
                    className="w-full text-center text-xs font-bold text-[#007070] hover:text-[#005a5a] pt-1 flex items-center justify-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Browse 180+ BD Tech Firms ↗</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Executive Professional Summary */}
          {profile.summary && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#007070]" />
                  Executive Professional Summary
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  AI-Extracted Overview
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100 font-normal">
                {profile.summary}
              </p>
            </div>
          )}

          {/* Extracted Skills & Competencies */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#007070]" />
                  Extracted Skills & Competencies ({profile.skills.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Categorized skills extracted from your resume used in semantic RAG matching
                </p>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setSelectedCategoryFilter(0)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    selectedCategoryFilter === 0
                      ? 'bg-[#007070] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({profile.skills.length})
                </button>
                {[1, 2, 3, 4, 7].map((catId) => {
                  const count = profile.skills.filter((s) => s.category === catId).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={catId}
                      onClick={() => setSelectedCategoryFilter(catId)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                        selectedCategoryFilter === catId
                          ? 'bg-[#007070] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {getCategoryLabel(catId)} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skill Badges */}
            <div className="flex flex-wrap gap-2.5">
              {filteredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${getCategoryBadgeClass(
                    skill.category
                  )}`}
                >
                  <span>{skill.name}</span>
                  <span className="ml-1.5 text-[10px] opacity-75 font-normal">
                    • {getCategoryLabel(skill.category)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSkill(skill.name)}
                    className="ml-2 p-0.5 rounded-full hover:bg-black/10 transition-colors"
                    title={`Remove ${skill.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Recommended Skills 1-Click Add */}
            {unaddedRecommendations.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Frequently Required Skills in Target Roles (1-Click Add):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unaddedRecommendations.slice(0, 6).map((rec) => (
                    <button
                      key={rec.name}
                      onClick={() => handleAddSkill(rec.name, rec.category)}
                      disabled={isAddingSkill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:border-[#007070] hover:text-[#007070] hover:bg-[#E6F4F4] transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{rec.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Skill Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSkill(newSkillName);
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2"
            >
              <input
                type="text"
                placeholder="Add another skill (e.g., PostgreSQL, RabbitMQ, Tailwind)..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007070] focus:border-transparent flex-1 shadow-2xs"
              />
              <button
                type="submit"
                disabled={isAddingSkill || !newSkillName.trim()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] active:scale-[0.98] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingSkill ? 'Adding...' : 'Add Skill'}</span>
              </button>
            </form>
          </div>

          {/* Career Experiences */}
          {profile.experiences.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#007070]" />
                Key Career Experiences ({profile.experiences.length})
              </h3>
              <div className="space-y-3">
                {profile.experiences.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-[#007070]/30 transition-all"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{exp.role}</h4>
                        <div className="text-xs text-[#007070] font-semibold mt-0.5">{exp.company}</div>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        {exp.duration}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

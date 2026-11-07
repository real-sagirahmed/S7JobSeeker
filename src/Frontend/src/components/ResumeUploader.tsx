import React, { useState } from 'react';
import { UploadCloud, FileCheck, Sparkles, AlertCircle, Layers } from 'lucide-react';
import type { ResumeProfile } from '../types';
import { api } from '../services/api';

interface ResumeUploaderProps {
  profile: ResumeProfile | null;
  onProfileUpdated: (profile: ResumeProfile) => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({ profile, onProfileUpdated }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const updatedProfile = await api.profile.uploadResume(file);
      onProfileUpdated(updatedProfile);
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

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="p-8 rounded-2xl border-2 border-dashed border-white/10 bg-[#141414] hover:border-[#007070]/60 transition-all text-center relative group shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <input
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#007070]/15 border border-[#007070]/30 flex items-center justify-center text-[#007070] group-hover:scale-105 transition-transform shadow-[0_4px_16px_rgba(0,112,112,0.20)]">
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-[#007070] border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              {isUploading ? 'Parsing Resume with Gemini AI...' : 'Upload your Resume / CV'}
            </h3>
            <p className="text-xs text-[#919191] mt-1">
              Drag and drop your PDF or TXT file here (max 10MB)
            </p>
          </div>

          <span className="inline-flex items-center text-xs font-bold text-[#007070] bg-[#007070]/15 px-3 py-1 rounded-full border border-[#007070]/30">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Auto-extracts skills, experience & role
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Extracted Profile Details */}
      {profile && (
        <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-[#007070]" />
                <h2 className="text-xl font-bold text-white">{profile.fullName}</h2>
              </div>
              <p className="text-xs text-[#007070] font-bold mt-1">
                {profile.targetRole || 'Software Professional'} • {profile.totalYearsOfExperience || 0}+ Years Experience
              </p>
            </div>
            {(profile.email || profile.phone) && (
              <div className="text-xs text-[#919191] space-y-1">
                {profile.email && <div>Email: {profile.email}</div>}
                {profile.phone && <div>Phone: {profile.phone}</div>}
              </div>
            )}
          </div>

          {/* Professional Summary */}
          {profile.summary && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#919191] mb-2">
                Executive Professional Summary
              </h4>
              <p className="text-xs text-[#CCCCCC] leading-relaxed bg-[#0D0D0D] p-4 rounded-xl border border-white/5">
                {profile.summary}
              </p>
            </div>
          )}

          {/* Skills Badges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#919191] flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-[#007070]" /> Extracted Skills & Competencies ({profile.skills.length})
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${
                    skill.isPrimary
                      ? 'bg-[#007070]/20 text-[#007070] border-[#007070]/50'
                      : 'bg-[#0D0D0D] text-[#CCCCCC] border-white/10'
                  }`}
                >
                  {skill.name}
                  <span className="ml-1.5 text-[10px] text-[#919191] opacity-75">
                    ({getCategoryLabel(skill.category)})
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Experiences */}
          {profile.experiences.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#919191] mb-3">
                Key Career Experiences
              </h4>
              <div className="space-y-3">
                {profile.experiences.map((exp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#0D0D0D] border border-white/5">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-white text-xs">{exp.role}</div>
                      <div className="text-xs text-[#007070] font-bold">{exp.duration}</div>
                    </div>
                    <div className="text-xs text-[#919191] font-medium mt-0.5">{exp.company}</div>
                    {exp.description && (
                      <p className="text-xs text-[#CCCCCC] mt-2 leading-relaxed">{exp.description}</p>
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

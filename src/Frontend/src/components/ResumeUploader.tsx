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
      <div className="p-8 rounded-2xl border-2 border-dashed border-black/10 bg-[#F8FAFC] hover:border-[#007070] transition-all text-center relative group shadow-xs">
        <input
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#E6F4F4] border border-[#007070]/20 flex items-center justify-center text-[#007070] group-hover:scale-105 transition-transform shadow-[0_4px_16px_rgba(0,112,112,0.15)]">
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-[#007070] border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-black text-[#0B0B0B]">
              {isUploading ? 'Parsing Resume with Gemini AI...' : 'Upload your Resume / CV'}
            </h3>
            <p className="text-xs text-[#7C7C7C] mt-1 font-medium">
              Drag and drop your PDF or TXT file here (max 10MB)
            </p>
          </div>

          <span className="inline-flex items-center text-xs font-bold text-[#007070] bg-[#E6F4F4] px-3.5 py-1 rounded-full border border-[#007070]/25">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Auto-extracts skills, experience & role
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Extracted Profile Details */}
      {profile && (
        <div className="rounded-2xl border border-black/8 bg-white p-6 space-y-6 shadow-[0_8px_25px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-black/8 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-[#007070]" />
                <h2 className="text-xl font-black text-[#0B0B0B]">{profile.fullName}</h2>
              </div>
              <p className="text-xs text-[#007070] font-bold mt-1">
                {profile.targetRole || 'Software Professional'} • {profile.totalYearsOfExperience || 0}+ Years Experience
              </p>
            </div>
            {(profile.email || profile.phone) && (
              <div className="text-xs text-[#7C7C7C] space-y-1">
                {profile.email && <div>Email: {profile.email}</div>}
                {profile.phone && <div>Phone: {profile.phone}</div>}
              </div>
            )}
          </div>

          {/* Professional Summary */}
          {profile.summary && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C7C7C] mb-2">
                Executive Professional Summary
              </h4>
              <p className="text-xs text-[#333333] leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-black/5">
                {profile.summary}
              </p>
            </div>
          )}

          {/* Skills Badges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C7C7C] flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-[#007070]" /> Extracted Skills & Competencies ({profile.skills.length})
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${
                    skill.isPrimary
                      ? 'bg-[#E6F4F4] text-[#007070] border-[#007070]/30 shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#333333] border-black/8'
                  }`}
                >
                  {skill.name}
                  <span className="ml-1.5 text-[10px] text-[#7C7C7C]">
                    ({getCategoryLabel(skill.category)})
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Experiences */}
          {profile.experiences.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C7C7C] mb-3">
                Key Career Experiences
              </h4>
              <div className="space-y-3">
                {profile.experiences.map((exp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-black/5">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-[#0B0B0B] text-xs">{exp.role}</div>
                      <div className="text-xs text-[#007070] font-bold">{exp.duration}</div>
                    </div>
                    <div className="text-xs text-[#7C7C7C] font-semibold mt-0.5">{exp.company}</div>
                    {exp.description && (
                      <p className="text-xs text-[#333333] mt-2 leading-relaxed">{exp.description}</p>
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

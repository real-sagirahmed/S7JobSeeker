import React, { useState } from 'react';
import type { BdCompany, TailoredPitch } from '../types';
import { X, Copy, Check, Download, Sparkles, Building2 } from 'lucide-react';

interface CompanyPitchModalProps {
  company: BdCompany;
  pitch: TailoredPitch;
  pitchType: string;
  onPitchTypeChange: (type: string) => void;
  isLoading: boolean;
  onClose: () => void;
}

export const CompanyPitchModal: React.FC<CompanyPitchModalProps> = ({
  company,
  pitch,
  pitchType,
  onPitchTypeChange,
  isLoading,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullText = `SUBJECT: ${pitch.subject}\n\n${pitch.content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fullText = `TARGET COMPANY: ${company.name}\nPITCH TYPE: ${pitch.pitchType}\nSUBJECT: ${pitch.subject}\nDATE: ${new Date().toLocaleDateString()}\n\n${pitch.content}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tailored-Pitch-${company.slug}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-black/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-black/10 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#E6F4F4] text-[#007070] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#0B0B0B] flex items-center gap-1.5 leading-tight">
                Targeted Pitch for <span className="text-[#007070]">{company.name}</span>
              </h2>
              <p className="text-xs text-[#7C7C7C] mt-0.5">
                Bespoke outreach highlighting your overlapping stack & value proposition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded-lg text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pitch Format Selector */}
        <div className="px-5 sm:px-6 py-3 bg-white border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#555555]">Format:</span>
            <button
              onClick={() => onPitchTypeChange('ColdEmail')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                pitchType === 'ColdEmail'
                  ? 'bg-[#007070] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#555555] hover:bg-[#E6F4F4] border border-black/5'
              }`}
            >
              Cold Email Outreach
            </button>
            <button
              onClick={() => onPitchTypeChange('CoverLetter')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                pitchType === 'CoverLetter'
                  ? 'bg-[#007070] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#555555] hover:bg-[#E6F4F4] border border-black/5'
              }`}
            >
              Formal Cover Letter
            </button>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={handleDownload}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] flex items-center space-x-1.5 transition-colors border border-black/10 active:scale-95"
              title="Download as .txt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.txt</span>
            </button>
            <button
              onClick={handleCopy}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] flex items-center space-x-1.5 transition-colors border border-black/10 active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#007070] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#7C7C7C]">
                Synthesizing company domain, products & matching tech stack...
              </p>
            </div>
          ) : (
            <>
              {/* Subject Line */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-black/10 text-xs">
                <span className="font-bold text-[#7C7C7C] uppercase tracking-wider block mb-1">
                  Subject Line:
                </span>
                <span className="font-semibold text-[#0B0B0B] font-mono select-all">
                  {pitch.subject}
                </span>
              </div>

              {/* Pitch Body */}
              <div className="p-4 rounded-xl bg-[#0B0B0B] border border-black/10 text-xs text-[#D8F3F3] font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto shadow-inner select-all">
                {pitch.content}
              </div>

              {/* Company Context Pill */}
              <div className="flex items-center justify-between text-xs text-[#7C7C7C] pt-2 border-t border-black/5">
                <span className="flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-[#007070]" />
                  {company.headquarters} • {company.employeeCountRange} Employees
                </span>
                {company.careersUrl && (
                  <a
                    href={company.careersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#007070] font-bold hover:underline"
                  >
                    View Official Career Page ↗
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

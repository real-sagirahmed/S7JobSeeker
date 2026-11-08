import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, FileText, Download } from 'lucide-react';
import type { TailoredApplication } from '../types';

interface TailoredModalProps {
  application: TailoredApplication | null;
  onClose: () => void;
}

export const TailoredModal: React.FC<TailoredModalProps> = ({ application, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!application) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(application.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([application.coverLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tailored-Cover-Letter-${Date.now()}.txt`;
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
        <div className="px-5 sm:px-6 py-4 border-b border-black/8 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4F4] border border-[#007070]/20 flex items-center justify-center text-[#007070] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-black text-[#0B0B0B] text-base leading-tight">Customized Job Application Package</h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded-lg text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
          {/* Resume Tips */}
          {application.resumeTips && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
              <div className="text-xs font-bold text-amber-900 flex items-center uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" /> High-Impact Resume Optimization Tips
              </div>
              <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-line">
                {application.resumeTips}
              </p>
            </div>
          )}

          {/* Cover Letter */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#0B0B0B] flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-[#007070] shrink-0" /> Tailored Cover Letter
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] flex items-center space-x-1.5 transition-colors border border-black/10 active:scale-95"
                  title="Download as .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] flex items-center space-x-1.5 transition-colors border border-black/10 active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0B0B] border border-black/10 text-xs text-[#D8F3F3] font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto shadow-inner">
              {application.coverLetter}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-black/8 bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,112,112,0.20)] active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

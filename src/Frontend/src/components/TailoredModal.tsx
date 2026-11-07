import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, FileText } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4F4] border border-[#007070]/20 flex items-center justify-center text-[#007070]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-black text-[#0B0B0B] text-base">Customized Job Application Package</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Resume Tips */}
          {application.resumeTips && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
              <div className="text-xs font-bold text-amber-900 flex items-center uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> High-Impact Resume Optimization Tips
              </div>
              <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-line">
                {application.resumeTips}
              </p>
            </div>
          )}

          {/* Cover Letter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B0B0B] flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-[#007070]" /> Tailored Cover Letter
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] flex items-center space-x-1.5 transition-colors border border-black/10"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0B0B] border border-black/10 text-xs text-[#D8F3F3] font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto shadow-inner">
              {application.coverLetter}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-black/8 bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#007070] hover:bg-[#005858] text-white text-xs font-bold transition-colors shadow-[0_4px_14px_rgba(0,112,112,0.20)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

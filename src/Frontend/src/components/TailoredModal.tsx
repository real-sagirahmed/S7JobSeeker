import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, FileText, Download, ExternalLink, HelpCircle, UserCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import type { TailoredApplication, ApplicationCopilotResponse } from '../types';

interface TailoredModalProps {
  application: TailoredApplication | null;
  onClose: () => void;
}

export const TailoredModal: React.FC<TailoredModalProps> = ({ application, onClose }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'coverLetter' | 'copilot'>('coverLetter');
  const [copied, setCopied] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedAnswerIdx, setCopiedAnswerIdx] = useState<number | null>(null);

  // Copilot State
  const defaultQuestions = "Why are you interested in this role and company?\nDescribe a technical challenge you solved relevant to this position.";
  const [questionsText, setQuestionsText] = useState(defaultQuestions);
  const [isLoadingCopilot, setIsLoadingCopilot] = useState(false);
  const [copilotData, setCopilotData] = useState<ApplicationCopilotResponse | null>(null);
  const [copilotError, setCopilotError] = useState<string | null>(null);

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

  const handleGenerateCopilot = async () => {
    const qList = questionsText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    if (qList.length === 0) {
      setCopilotError("Please enter at least one screening question.");
      return;
    }

    setIsLoadingCopilot(true);
    setCopilotError(null);

    try {
      const res = await api.copilot.generateAnswers({
        jobId: application.jobId,
        jobTitle: application.title,
        companyName: application.company,
        screeningQuestions: qList
      });
      setCopilotData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate copilot answers.";
      setCopilotError(msg);
    } finally {
      setIsLoadingCopilot(false);
    }
  };

  const handleCopyAnswer = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswerIdx(idx);
    setTimeout(() => setCopiedAnswerIdx(null), 2000);
  };

  const handleCopyPitch = () => {
    if (copilotData?.coldEmailPitch) {
      navigator.clipboard.writeText(copilotData.coldEmailPitch);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-black/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-black/8 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4F4] border border-[#007070]/20 flex items-center justify-center text-[#007070] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-[#0B0B0B] text-base leading-tight">{t.tailoredModal.title}</h3>
              {application.company && (
                <p className="text-xs text-[#7C7C7C] font-medium mt-0.5">
                  {application.title ? `${application.title} • ` : ''}{application.company}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded-lg text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5 transition-colors shrink-0"
            aria-label={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-black/8 px-4 sm:px-6 bg-[#FAFAFA]">
          <button
            onClick={() => setActiveTab('coverLetter')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'coverLetter'
                ? 'border-[#007070] text-[#007070]'
                : 'border-transparent text-[#7C7C7C] hover:text-[#0B0B0B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.tailoredModal.coverLetterTab}</span>
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'copilot'
                ? 'border-[#007070] text-[#007070]'
                : 'border-transparent text-[#7C7C7C] hover:text-[#0B0B0B]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{t.tailoredModal.copilotTab}</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-black">AI</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
          {activeTab === 'coverLetter' ? (
            <>
              {/* Resume Tips */}
              {application.resumeTips && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="text-xs font-bold text-amber-900 flex items-center uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" /> {t.tailoredModal.resumeTips}
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
                    <FileText className="w-4 h-4 mr-1.5 text-[#007070] shrink-0" /> {t.tailoredModal.coverLetter}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleDownload}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] flex items-center space-x-1.5 transition-colors border border-black/10 active:scale-95 cursor-pointer"
                      title="Download as .txt"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.tailoredModal.download}</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] flex items-center space-x-1.5 transition-colors border border-black/10 active:scale-95 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? t.tailoredModal.copied : t.tailoredModal.copy}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0B0B] border border-black/10 text-xs text-[#D8F3F3] font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto shadow-inner">
                  {application.coverLetter}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Copilot Input */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center">
                    <HelpCircle className="w-4 h-4 text-purple-600 mr-1.5" />
                    Screening Questions (Greenhouse / Lever / Portal)
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">1 Question per line (Max 5)</span>
                </div>
                <textarea
                  value={questionsText}
                  onChange={(e) => setQuestionsText(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-hidden bg-white text-slate-900 font-sans"
                  placeholder={t.tailoredModal.questionsPlaceholder}
                />
                {copilotError && (
                  <p className="text-xs text-rose-600 font-semibold">{copilotError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateCopilot}
                    disabled={isLoadingCopilot}
                    className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isLoadingCopilot ? t.tailoredModal.generating : t.tailoredModal.generateAnswers}</span>
                  </button>
                </div>
              </div>

              {/* Copilot Generated Q&A */}
              {copilotData && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
                    Tailored Answers & Evidence Highlights
                  </h4>
                  <div className="space-y-3">
                    {copilotData.answers.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            Q{idx + 1}: {item.question}
                          </p>
                          <button
                            onClick={() => handleCopyAnswer(item.answer, idx)}
                            className="min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 flex items-center space-x-1 transition-colors shrink-0 cursor-pointer"
                          >
                            {copiedAnswerIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedAnswerIdx === idx ? t.tailoredModal.copied : t.tailoredModal.copy}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white p-3 rounded-lg border border-purple-100">
                          {item.answer}
                        </p>
                        {item.keyHighlights && item.keyHighlights.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-500 font-bold">{t.tailoredModal.keyHighlights}:</span>
                            {item.keyHighlights.map((hl, hIdx) => (
                              <span key={hIdx} className="text-[10px] font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                                {hl}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Recruiter Outreach & Cold InMail Pitch */}
                  <div className="mt-6 pt-5 border-t border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-4 h-4 text-[#007070]" />
                        <span className="text-xs font-bold text-slate-900">{t.tailoredModal.recruiterSection}</span>
                      </div>
                      {copilotData.recruiterSearchUrl && (
                        <a
                          href={copilotData.recruiterSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#007070] hover:text-[#005858] hover:underline flex items-center space-x-1"
                        >
                          <span>{t.tailoredModal.openRecruiterSearch}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>

                    {copilotData.coldEmailPitch && (
                      <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-emerald-400">{t.tailoredModal.coldEmailPitch}</span>
                          <button
                            onClick={handleCopyPitch}
                            className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedPitch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedPitch ? t.tailoredModal.copied : t.tailoredModal.copy}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                          {copilotData.coldEmailPitch}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-black/8 bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] text-white text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,112,112,0.20)] active:scale-[0.98] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

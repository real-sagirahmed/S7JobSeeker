import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  BookOpen,
  Terminal,
  HelpCircle,
  CheckSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import type { JobPrepGuide } from '../types';

interface JobPrepModalProps {
  guide: JobPrepGuide | null;
  isLoading?: boolean;
  onClose: () => void;
}

export const JobPrepModal: React.FC<JobPrepModalProps> = ({ guide, isLoading, onClose }) => {
  const [activeTab, setActiveTab] = useState<'domain' | 'labs' | 'mock' | 'checklist'>('domain');
  const [viewMode, setViewMode] = useState<'personalized' | 'full'>('personalized');
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  if (!guide && !isLoading) return null;

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetIndex(id);
    setTimeout(() => setCopiedSnippetIndex(null), 2000);
  };

  const handleDownloadDossier = () => {
    if (!guide) return;
    const content = guide.exportMarkdown || `# Interview Preparation Master Guide - ${guide.targetRole} (${guide.companyName})\n\nGenerated on ${new Date(guide.createdAt).toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview-Prep-${guide.companyName.replace(/\s+/g, '_')}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCheckItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-black/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-black/8 bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden pr-2">
            <div className="w-9 h-9 rounded-xl bg-[#E6F4F4] border border-[#007070]/20 flex items-center justify-center text-[#007070] shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-[#0B0B0B] text-base leading-tight truncate">
                  {guide ? guide.targetRole : 'Generating Preparation Master Guide...'}
                </h3>
                {guide?.companyName && (
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold rounded-md bg-[#007070]/10 text-[#007070]">
                    {guide.companyName}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7C7C7C] truncate">
                Enterprise 4-Stage Interview & Assessment Master Blueprint
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {guide && (
              <button
                onClick={handleDownloadDossier}
                className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#E6F4F4] text-[#333333] hover:text-[#007070] flex items-center space-x-1.5 transition-colors border border-black/10 active:scale-95 shadow-xs"
                title="Download Master Dossier (.md)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Export Dossier</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-[#007070]/20 border-t-[#007070] animate-spin" />
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-sm">Synthesizing Technical Interview Blueprint...</h4>
              <p className="text-xs text-gray-500 max-w-md">
                Analyzing practical SQL test patterns, Linux/Docker diagnostic commands, Core Banking transaction flows, and incident scenarios.
              </p>
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!isLoading && guide && (
          <>
            {/* View Mode Bar + Tabs Header */}
            <div className="border-b border-black/8 bg-white px-4 sm:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Navigation Tabs */}
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveTab('domain')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                    activeTab === 'domain'
                      ? 'bg-[#007070] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>1. Domain Fundamentals</span>
                </button>

                <button
                  onClick={() => setActiveTab('labs')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                    activeTab === 'labs'
                      ? 'bg-[#007070] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-slate-100'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>2. Diagnostic Labs</span>
                </button>

                <button
                  onClick={() => setActiveTab('mock')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                    activeTab === 'mock'
                      ? 'bg-[#007070] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>3. Mock Assessment</span>
                </button>

                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                    activeTab === 'checklist'
                      ? 'bg-[#007070] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>4. Readiness Checklist</span>
                </button>
              </div>

              {/* View Switcher: Personalized Gap Focus vs Full Circular */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('personalized')}
                  className={`min-h-[32px] px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
                    viewMode === 'personalized'
                      ? 'bg-white text-[#007070] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Personalized Gap Focus</span>
                </button>
                <button
                  onClick={() => setViewMode('full')}
                  className={`min-h-[32px] px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
                    viewMode === 'full'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Full Role Syllabus</span>
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* TAB 1: DOMAIN FUNDAMENTALS */}
              {activeTab === 'domain' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Overview Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F0FDF4] border border-emerald-200 shadow-xs space-y-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                      <h4 className="font-bold text-sm text-emerald-950">Domain Architecture Overview</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                      {guide.domainFundamentals.overview}
                    </p>
                  </div>

                  {/* Candidate Gap Highlights */}
                  {guide.domainFundamentals.candidateGapHighlights?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5 shadow-xs">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                          High-Priority Assessment Focus (Your Skill Gaps)
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {guide.domainFundamentals.candidateGapHighlights.map((gap, idx) => (
                          <div key={idx} className="flex items-start space-x-2 p-2 rounded-xl bg-white/70 border border-amber-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span className="text-xs text-amber-950 font-medium leading-snug">{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Core Topics Grid */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-[#0B0B0B] uppercase tracking-wider flex items-center">
                      <BookOpen className="w-4 h-4 mr-1.5 text-[#007070]" />
                      Core Production Pillars ({guide.domainFundamentals.coreTopics.length})
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {guide.domainFundamentals.coreTopics.map((topic, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-black/8 bg-white hover:border-[#007070]/30 hover:shadow-md transition-all flex flex-col justify-between space-y-2.5"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <h6 className="font-bold text-[#0B0B0B] text-sm leading-snug">
                                {topic.title}
                              </h6>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                Pillar {idx + 1}
                              </span>
                            </div>
                            <p className="text-xs text-[#4A5568] leading-relaxed">
                              {topic.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-[#007070] block leading-tight">
                              Why it matters:
                            </span>
                            <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                              {topic.whyItMattersInRole}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DIAGNOSTIC LABS */}
              {activeTab === 'labs' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-[#00E599]" />
                      <span>Production Assessment Command & Script Benchmarks</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      Click "Copy" to test in your local sandbox
                    </span>
                  </div>

                  {/* SQL Section */}
                  {guide.diagnosticLabs.sqlQueries?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-[#007070]" />
                        <h5 className="font-bold text-xs uppercase tracking-wider text-[#0B0B0B]">
                          1. Practical SQL Test & Reconciliation Labs
                        </h5>
                      </div>

                      <div className="space-y-3">
                        {guide.diagnosticLabs.sqlQueries.map((item, idx) => {
                          const snippetId = `sql-${idx}`;
                          const isCopied = copiedSnippetIndex === snippetId;
                          return (
                            <div key={idx} className="rounded-2xl border border-black/8 bg-white overflow-hidden shadow-xs">
                              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-800">
                                  {item.scenario}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(snippetId, item.commandOrCode)}
                                  className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1 transition-all active:scale-95"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{isCopied ? 'Copied' : 'Copy SQL'}</span>
                                </button>
                              </div>

                              <div className="p-3 bg-[#0B0B0B] text-[#D8F3F3] font-mono text-xs overflow-x-auto leading-relaxed border-b border-black/10">
                                <pre className="font-mono">{item.commandOrCode}</pre>
                              </div>

                              <div className="p-3 bg-white space-y-1 text-xs">
                                <div className="text-slate-700">
                                  <span className="font-bold text-[#007070]">Diagnostic Intent: </span>
                                  {item.explanation}
                                </div>
                                {item.expectedOutputOrAction && (
                                  <div className="text-slate-500 text-[11px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="font-bold text-slate-700">Expected Result: </span>
                                    {item.expectedOutputOrAction}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Linux Section */}
                  {guide.diagnosticLabs.linuxCommands?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center space-x-2">
                        <Server className="w-4 h-4 text-[#007070]" />
                        <h5 className="font-bold text-xs uppercase tracking-wider text-[#0B0B0B]">
                          2. Linux Diagnostic Exercises & Incident Troubleshooting
                        </h5>
                      </div>

                      <div className="space-y-3">
                        {guide.diagnosticLabs.linuxCommands.map((item, idx) => {
                          const snippetId = `linux-${idx}`;
                          const isCopied = copiedSnippetIndex === snippetId;
                          return (
                            <div key={idx} className="rounded-2xl border border-black/8 bg-white overflow-hidden shadow-xs">
                              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-800">
                                  {item.scenario}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(snippetId, item.commandOrCode)}
                                  className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1 transition-all active:scale-95"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>

                              <div className="p-3 bg-[#0B0B0B] text-[#00E599] font-mono text-xs overflow-x-auto leading-relaxed border-b border-black/10">
                                <pre className="font-mono">{item.commandOrCode}</pre>
                              </div>

                              <div className="p-3 bg-white space-y-1 text-xs">
                                <div className="text-slate-700">
                                  <span className="font-bold text-[#007070]">Scenario Rationale: </span>
                                  {item.explanation}
                                </div>
                                {item.expectedOutputOrAction && (
                                  <div className="text-slate-500 text-[11px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="font-bold text-slate-700">Expected Action: </span>
                                    {item.expectedOutputOrAction}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Docker Section */}
                  {guide.diagnosticLabs.dockerOps?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-[#007070]" />
                        <h5 className="font-bold text-xs uppercase tracking-wider text-[#0B0B0B]">
                          3. Docker Operational Tasks & Container Health
                        </h5>
                      </div>

                      <div className="space-y-3">
                        {guide.diagnosticLabs.dockerOps.map((item, idx) => {
                          const snippetId = `docker-${idx}`;
                          const isCopied = copiedSnippetIndex === snippetId;
                          return (
                            <div key={idx} className="rounded-2xl border border-black/8 bg-white overflow-hidden shadow-xs">
                              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-800">
                                  {item.scenario}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(snippetId, item.commandOrCode)}
                                  className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1 transition-all active:scale-95"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>

                              <div className="p-3 bg-[#0B0B0B] text-sky-300 font-mono text-xs overflow-x-auto leading-relaxed border-b border-black/10">
                                <pre className="font-mono">{item.commandOrCode}</pre>
                              </div>

                              <div className="p-3 bg-white space-y-1 text-xs">
                                <div className="text-slate-700">
                                  <span className="font-bold text-[#007070]">Docker Operation: </span>
                                  {item.explanation}
                                </div>
                                {item.expectedOutputOrAction && (
                                  <div className="text-slate-500 text-[11px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="font-bold text-slate-700">Expected Output: </span>
                                    {item.expectedOutputOrAction}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MOCK ASSESSMENT & SCENARIOS */}
              {activeTab === 'mock' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Technical Assessment Questions */}
                  {guide.mockAssessment.technicalQuestions?.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-[#0B0B0B] uppercase tracking-wider flex items-center">
                        <Terminal className="w-4 h-4 mr-1.5 text-[#007070]" />
                        Technical Assessment Questions ({guide.mockAssessment.technicalQuestions.length})
                      </h5>

                      <div className="space-y-2.5">
                        {guide.mockAssessment.technicalQuestions.map((q, idx) => {
                          const qId = `tech-${idx}`;
                          const isExpanded = expandedQuestions[qId] ?? true;
                          return (
                            <div key={idx} className="rounded-2xl border border-black/8 bg-white overflow-hidden shadow-xs">
                              <button
                                onClick={() => toggleQuestion(qId)}
                                className="w-full text-left px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition-colors"
                              >
                                <span className="font-bold text-xs sm:text-sm text-slate-900 pr-2">
                                  Q{idx + 1}: {q.question}
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                              </button>

                              {isExpanded && (
                                <div className="p-4 space-y-3 border-t border-slate-200/60 bg-white">
                                  <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center">
                                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                      Senior Engineer Model Answer
                                    </span>
                                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                      {q.seniorAnswerGuide}
                                    </p>
                                  </div>

                                  {q.commonPitfallsToAvoid && (
                                    <div className="space-y-1">
                                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center">
                                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                                        Common Pitfalls to Avoid
                                      </span>
                                      <p className="text-xs text-rose-900 leading-relaxed bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                                        {q.commonPitfallsToAvoid}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Production Scenario Troubleshooting */}
                  {guide.mockAssessment.scenarioTroubleshooting?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h5 className="text-xs font-bold text-[#0B0B0B] uppercase tracking-wider flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
                        Live Production Incident Scenarios ({guide.mockAssessment.scenarioTroubleshooting.length})
                      </h5>

                      <div className="space-y-2.5">
                        {guide.mockAssessment.scenarioTroubleshooting.map((q, idx) => {
                          const qId = `scen-${idx}`;
                          const isExpanded = expandedQuestions[qId] ?? true;
                          return (
                            <div key={idx} className="rounded-2xl border border-amber-200/80 bg-white overflow-hidden shadow-xs">
                              <button
                                onClick={() => toggleQuestion(qId)}
                                className="w-full text-left px-4 py-3 bg-amber-50/60 hover:bg-amber-100/60 flex items-center justify-between transition-colors"
                              >
                                <span className="font-bold text-xs sm:text-sm text-amber-950 pr-2">
                                  Incident #{idx + 1}: {q.question}
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-700 shrink-0" /> : <ChevronDown className="w-4 h-4 text-amber-700 shrink-0" />}
                              </button>

                              {isExpanded && (
                                <div className="p-4 space-y-3 border-t border-amber-100 bg-white">
                                  <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center">
                                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                      Incident RCA & Resolution Playbook
                                    </span>
                                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                      {q.seniorAnswerGuide}
                                    </p>
                                  </div>

                                  {q.commonPitfallsToAvoid && (
                                    <div className="space-y-1">
                                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center">
                                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                                        Critical Mistake to Avoid (P1 Risk)
                                      </span>
                                      <p className="text-xs text-rose-900 leading-relaxed bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                                        {q.commonPitfallsToAvoid}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Behavioral & Learning Agility */}
                  {guide.mockAssessment.behavioralAgility?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h5 className="text-xs font-bold text-[#0B0B0B] uppercase tracking-wider flex items-center">
                        <HelpCircle className="w-4 h-4 mr-1.5 text-sky-600" />
                        Learning Agility & Production Mindset ({guide.mockAssessment.behavioralAgility.length})
                      </h5>

                      <div className="space-y-2.5">
                        {guide.mockAssessment.behavioralAgility.map((q, idx) => {
                          const qId = `behav-${idx}`;
                          const isExpanded = expandedQuestions[qId] ?? false;
                          return (
                            <div key={idx} className="rounded-2xl border border-black/8 bg-white overflow-hidden shadow-xs">
                              <button
                                onClick={() => toggleQuestion(qId)}
                                className="w-full text-left px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition-colors"
                              >
                                <span className="font-bold text-xs sm:text-sm text-slate-900 pr-2">
                                  {q.question}
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                              </button>

                              {isExpanded && (
                                <div className="p-4 space-y-3 border-t border-slate-200/60 bg-white">
                                  <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                                      Strategic Senior Response
                                    </span>
                                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-sky-50/40 p-3 rounded-xl border border-sky-100">
                                      {q.seniorAnswerGuide}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: READINESS CHECKLIST */}
              {activeTab === 'checklist' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Pre-Test Action List */}
                  {guide.readinessChecklist.preTestActions?.length > 0 && (
                    <div className="p-5 rounded-2xl bg-white border border-black/8 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckSquare className="w-4 h-4 text-[#007070]" />
                          <h5 className="font-bold text-xs sm:text-sm text-[#0B0B0B] uppercase tracking-wider">
                            1. Pre-Assessment Setup & Verification
                          </h5>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {guide.readinessChecklist.preTestActions.filter((_, i) => checkedItems[`pre-${i}`]).length} of {guide.readinessChecklist.preTestActions.length} completed
                        </span>
                      </div>

                      <div className="space-y-2">
                        {guide.readinessChecklist.preTestActions.map((action, idx) => {
                          const itemId = `pre-${idx}`;
                          const isChecked = !!checkedItems[itemId];
                          return (
                            <label
                              key={idx}
                              onClick={() => toggleCheckItem(itemId)}
                              className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 line-through opacity-80'
                                  : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-400 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-xs font-medium leading-relaxed select-none">
                                {action}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Practical Drills */}
                  {guide.readinessChecklist.practicalDrills?.length > 0 && (
                    <div className="p-5 rounded-2xl bg-white border border-black/8 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Terminal className="w-4 h-4 text-[#007070]" />
                          <h5 className="font-bold text-xs sm:text-sm text-[#0B0B0B] uppercase tracking-wider">
                            2. Practical 48-Hour Drills
                          </h5>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {guide.readinessChecklist.practicalDrills.filter((_, i) => checkedItems[`drill-${i}`]).length} of {guide.readinessChecklist.practicalDrills.length} completed
                        </span>
                      </div>

                      <div className="space-y-2">
                        {guide.readinessChecklist.practicalDrills.map((drill, idx) => {
                          const itemId = `drill-${idx}`;
                          const isChecked = !!checkedItems[itemId];
                          return (
                            <label
                              key={idx}
                              onClick={() => toggleCheckItem(itemId)}
                              className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 line-through opacity-80'
                                  : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-400 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-xs font-medium leading-relaxed select-none">
                                {drill}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Keywords to Highlight */}
                  {guide.readinessChecklist.resumeKeywordsToHighlight?.length > 0 && (
                    <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-black/8 shadow-xs space-y-3">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#007070]" />
                        <h5 className="font-bold text-xs sm:text-sm text-[#0B0B0B] uppercase tracking-wider">
                          3. High-Impact Resume & Interview Keywords
                        </h5>
                      </div>
                      <p className="text-xs text-slate-600">
                        Weave these exact terms into your resume summary, project bullets, and verbal interview answers:
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {guide.readinessChecklist.resumeKeywordsToHighlight.map((kw, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-xl text-xs font-bold bg-white text-[#007070] border border-[#007070]/20 shadow-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3 border-t border-black/8 bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 text-center sm:text-left">
                Cached in DB • Instant 0-Credit Reload anytime
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={handleDownloadDossier}
                  className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center space-x-1.5 active:scale-95 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md Guide</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none min-h-[44px] px-6 py-2 rounded-xl text-xs font-bold bg-[#007070] hover:bg-[#005a5a] text-white transition-colors active:scale-95 shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

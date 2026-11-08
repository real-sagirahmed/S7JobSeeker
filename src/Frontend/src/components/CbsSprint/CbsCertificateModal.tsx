import React from 'react';
import { Award, Printer, ShieldCheck, X } from 'lucide-react';
import type { User } from '../../types';

interface CbsCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  completedCount: number;
  averageScore: number;
  completionDate?: string;
}

export const CbsCertificateModal: React.FC<CbsCertificateModalProps> = ({
  isOpen,
  onClose,
  user,
  completedCount,
  averageScore,
  completionDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}) => {
  if (!isOpen) return null;

  const candidateName = user?.fullName || 'CBS Support Candidate';
  const certificateId = `S7-CBS-${(user?.email || 'GUEST').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-black tracking-tight">Coursera-Grade Verified Certificate</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF সেভ করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Area */}
        <div className="p-6 sm:p-12 bg-white print:p-8">
          <div className="relative border-8 border-double border-teal-900/40 p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-teal-50/20 via-white to-amber-50/20 text-center space-y-6 shadow-inner">
            {/* Top Seal & Organization Header */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-teal-900 text-white flex items-center justify-center shadow-lg border-2 border-amber-400">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-teal-900">
                teamS7 Enterprise Intelligence & Learning
              </span>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Specialized Career Readiness Assessment Program
              </p>
            </div>

            {/* Certificate Title */}
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-serif italic text-slate-600 block">
                This is to officially certify that
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight underline decoration-teal-600/40 underline-offset-8">
                {candidateName}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-serif">
              has successfully completed all 14 rigorous curriculum modules, hands-on diagnostic labs, and role-specific incident troubleshooting assessments for the track:
            </p>

            {/* Specialization Name */}
            <div className="bg-teal-900 text-white py-3 px-6 rounded-xl inline-block shadow-md">
              <h2 className="text-sm sm:text-lg font-black tracking-wide">
                Junior Software Engineer (Service) — Current & NextGen CBS Support
              </h2>
            </div>

            {/* Competency Badges Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[10px] font-bold text-slate-700">
              <span className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">SQL Server Forensics & OLTP</span>
              <span className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">Double-Entry Accounting GL</span>
              <span className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">Linux Services & Logs</span>
              <span className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">Docker Container Ops</span>
              <span className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">CBS EOD Batch Triage</span>
              <span className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">L1/L2 Incident RCA & Rollback</span>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 max-w-md mx-auto pt-4 border-t border-b border-slate-200 py-3 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                <span className="text-sm font-black text-slate-900">{completedCount} / 14 Days</span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Grade</span>
                <span className="text-sm font-black text-emerald-700">{averageScore}%</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audit Trail</span>
                <span className="text-sm font-black text-teal-800">Verified</span>
              </div>
            </div>

            {/* Footer Signatures and Verification */}
            <div className="pt-6 flex items-end justify-between border-t border-slate-200/80 text-left text-xs">
              <div className="space-y-1">
                <div className="w-36 border-b border-slate-400 pb-1 font-serif italic text-teal-950 font-bold">
                  Ashraful Islam
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Principal Systems Architect
                </span>
                <span className="text-[9px] text-slate-400">teamS7 Engineering</span>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full border border-dashed border-teal-600 flex items-center justify-center mx-auto text-[8px] font-bold text-teal-800 uppercase tracking-tighter">
                  OFFICIAL<br/>SEAL
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">Issued: {completionDate}</span>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Credential Verification
                </span>
                <span className="font-mono text-[10px] text-teal-800 font-bold block">{certificateId}</span>
                <span className="text-[9px] text-slate-400">https://s7jobseeker.com/verify</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

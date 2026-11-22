import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Award,
  Calendar,
  ArrowLeft,
  Copy,
  Check,
  GraduationCap
} from 'lucide-react';
import { api } from '../../services/api';
import type { CbsCertificateVerification } from '../../types';

interface CertificateVerificationViewProps {
  initialCertificateId?: string;
  onBackToApp: () => void;
}

export const CertificateVerificationView: React.FC<CertificateVerificationViewProps> = ({
  initialCertificateId = '',
  onBackToApp
}) => {
  const [searchId, setSearchId] = useState(initialCertificateId);
  const [data, setData] = useState<CbsCertificateVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialCertificateId.trim()) {
      verifyId(initialCertificateId.trim());
    }
  }, [initialCertificateId]);

  const verifyId = async (id: string) => {
    if (!id.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setData(null);

    try {
      const res = await api.cbsSprint.verifyCertificate(id.trim());
      setData(res);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Certificate not found or unverified.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyId(searchId);
  };

  const handleCopyId = () => {
    if (!data?.certificateId) return;
    navigator.clipboard.writeText(data.certificateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Top Navbar Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-sm tracking-widest uppercase font-bold text-teal-400 block">
                teamS7 Verification Portal
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Official Credential Authentication Network
              </span>
            </div>
          </div>

          <button
            onClick={onBackToApp}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-2 transition-all active:scale-95 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>S7 Job Seeker-এ ফিরুন</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 py-10 flex-1 space-y-8">
        {/* Search Header Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Enterprise Core Banking Systems Track</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Verify Candidate Credential
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Validate candidate completion of the intensive 14-Day CBS Engineering &amp; Incident Troubleshooting Sprint.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto pt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Certificate ID লিখুন (যেমন: S7-CBS-202611-XXXXXXXX)"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchId.trim()}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs sm:text-sm font-black rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              {isLoading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
            </button>
          </form>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">ডাটাবেজে সার্টিফিকেট রেকর্ড সার্চ করা হচ্ছে...</p>
          </div>
        )}

        {/* Not Found Error Card */}
        {!isLoading && errorMessage && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-3 max-w-lg mx-auto animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">সার্টিফিকেট পাওয়া যায়নি বা ভেরিফিকেশন ব্যর্থ হয়েছে</h3>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              আইডি <strong>{searchId}</strong>-এর সাথে মিলে এমন কোনো অফিসিয়াল সার্টিফিকেট রেকর্ড সিস্টেমে মেলেনি। অনুগ্রহ করে সঠিক আইডি টাইপ করুন অথবা প্রার্থীর সাথে যোগাযোগ করুন।
            </p>
          </div>
        )}

        {/* Success Certificate Card */}
        {!isLoading && data && (
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Verified Ribbon */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    Official Credential Authenticated
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    This certification record is permanently registered in teamS7 Enterprise Registry.
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  {data.certificateId}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  title="Copy Certificate ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Certified Candidate
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900">
                  {data.candidateName}
                </h2>
              </div>

              {/* Specialization Track */}
              <div className="border-b border-slate-100 pb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Assessment Track &amp; Program
                </span>
                <h3 className="text-base sm:text-lg font-black text-teal-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-700 shrink-0" />
                  <span>{data.trackTitle}</span>
                </h3>
              </div>

              {/* Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Curriculum Completed
                  </span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">
                    {data.completedDaysCount} / 14 Days (100%)
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Average Assessment Score
                  </span>
                  <span className="text-lg font-black text-emerald-700 mt-0.5 block">
                    {data.averageScore}% Grade
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Issue Date
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 mt-1 block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(data.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </span>
                </div>
              </div>

              {/* Verified Competencies */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
                  Verified Production Competencies
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.competencies.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-teal-50 border border-teal-200/80 text-teal-900 text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Signatory Organization */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                <span>Issuing Body: <strong>{data.issuer}</strong></span>
                <span className="font-mono text-[10px] text-slate-400">Cryptographically Verified Entry · SHA256 Safe</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} teamS7 Enterprise Intelligence &amp; Learning. All credentials authenticated.
      </footer>
    </div>
  );
};

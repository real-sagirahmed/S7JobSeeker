import React from 'react';
import { User as UserIcon, LogOut, Sparkles, FileText, Bookmark, ClipboardCheck, Building2 } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: 'matches' | 'profile' | 'paste' | 'saved' | 'companies';
  setActiveTab: (tab: 'matches' | 'profile' | 'paste' | 'saved' | 'companies') => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAuth
}) => {
  return (
    <>
      {/* Sleek Top Brand Line */}
      <div className="h-1 bg-[#007070] w-full" />

      <header className="border-b border-black/8 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3.5 cursor-pointer" onClick={() => setActiveTab('matches')}>
            <img
              src="/logo-icon.png"
              alt="S7 Job Seeker Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-[0_4px_16px_rgba(0,112,112,0.25)] border border-[#007070]/20"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-[#0B0B0B]">
                  s7job-seeker
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#E6F4F4] text-[#007070] border border-[#007070]/20">
                  RAG AI
                </span>
              </div>
              <p className="text-[11px] text-[#7C7C7C] font-semibold leading-none mt-0.5">
                teamS7 Intelligence
              </p>
            </div>
          </div>

          {user ? (
            <nav className="hidden md:flex items-center space-x-1.5">
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'matches'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Matches</span>
              </button>

              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'paste'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Paste & Analyze</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'profile'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Resume & Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'saved'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Jobs</span>
              </button>

              <button
                onClick={() => setActiveTab('companies')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'companies'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>BD Tech</span>
              </button>
            </nav>
          ) : null}

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-[#0B0B0B]">{user.fullName}</div>
                  <div className="text-[11px] text-[#7C7C7C] font-medium">{user.targetRole || user.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 rounded-xl border border-black/10 text-[#7C7C7C] hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-extrabold text-xs transition-all shadow-[0_6px_20px_rgba(0,112,112,0.25)] flex items-center space-x-2"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

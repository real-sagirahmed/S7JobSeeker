import React from 'react';
import { User as UserIcon, LogOut, Sparkles, FileText, Bookmark, ClipboardCheck } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: 'matches' | 'profile' | 'paste' | 'saved';
  setActiveTab: (tab: 'matches' | 'profile' | 'paste' | 'saved') => void;
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
    <header className="border-b border-white/10 bg-[#0B0B0B]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3.5 cursor-pointer" onClick={() => setActiveTab('matches')}>
          <div className="w-10 h-10 border-[3.5px] border-[#007070] rounded-xl flex items-center justify-center font-black text-base text-[#007070] bg-white -skew-x-6 shadow-[0_8px_25px_rgba(0,112,112,0.25)]">
            S7
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">
                s7job-seeker
              </span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#007070]/15 text-[#007070] border border-[#007070]/30">
                RAG AI
              </span>
            </div>
            <p className="text-[11px] text-[#919191] font-medium leading-none mt-0.5">
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
                  ? 'bg-[#007070] text-white shadow-[0_4px_16px_rgba(0,112,112,0.30)]'
                  : 'text-[#CCCCCC] hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Matches</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'paste'
                  ? 'bg-[#007070] text-white shadow-[0_4px_16px_rgba(0,112,112,0.30)]'
                  : 'text-[#CCCCCC] hover:text-white hover:bg-white/5'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Paste & Analyze</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'profile'
                  ? 'bg-[#007070] text-white shadow-[0_4px_16px_rgba(0,112,112,0.30)]'
                  : 'text-[#CCCCCC] hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resume & Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'saved'
                  ? 'bg-[#007070] text-white shadow-[0_4px_16px_rgba(0,112,112,0.30)]'
                  : 'text-[#CCCCCC] hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Jobs</span>
            </button>
          </nav>
        ) : null}

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-white">{user.fullName}</div>
                <div className="text-[11px] text-[#919191]">{user.targetRole || user.email}</div>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-xl border border-white/10 text-[#919191] hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-[#007070] hover:bg-[#005858] text-white font-bold text-xs transition-all shadow-[0_6px_20px_rgba(0,112,112,0.30)] flex items-center space-x-2"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

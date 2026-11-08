import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  Sparkles,
  FileText,
  Bookmark,
  ClipboardCheck,
  Building2,
  Zap,
  ShieldCheck,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: 'matches' | 'profile' | 'paste' | 'saved' | 'companies' | 'admin';
  setActiveTab: (tab: 'matches' | 'profile' | 'paste' | 'saved' | 'companies' | 'admin') => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenBuyCredits: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAuth,
  onOpenBuyCredits
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    if (isMobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (tab: 'matches' | 'profile' | 'paste' | 'saved' | 'companies' | 'admin') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Sleek Top Brand Line */}
      <div className="h-1 bg-[#007070] w-full shrink-0" />

      <header className="border-b border-black/8 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center space-x-2.5 sm:space-x-3.5 cursor-pointer shrink-0"
            onClick={() => handleNavClick('matches')}
          >
            <img
              src="/logo-icon.png"
              alt="S7 Job Seeker Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-[0_4px_16px_rgba(0,112,112,0.25)] border border-[#007070]/20 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-[#0B0B0B] truncate">
                  s7job-seeker
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#E6F4F4] text-[#007070] border border-[#007070]/20 shrink-0">
                  RAG AI
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#7C7C7C] font-semibold leading-none mt-0.5 hidden xs:block truncate">
                teamS7 Intelligence
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (>= md) */}
          {user ? (
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => handleNavClick('matches')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 ${
                  activeTab === 'matches'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Matches</span>
              </button>

              <button
                onClick={() => handleNavClick('paste')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 ${
                  activeTab === 'paste'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Paste & Analyze</span>
              </button>

              <button
                onClick={() => handleNavClick('profile')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 ${
                  activeTab === 'profile'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Resume & Profile</span>
              </button>

              <button
                onClick={() => handleNavClick('saved')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 ${
                  activeTab === 'saved'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Jobs</span>
              </button>

              <button
                onClick={() => handleNavClick('companies')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 ${
                  activeTab === 'companies'
                    ? 'bg-[#007070] text-white shadow-[0_4px_14px_rgba(0,112,112,0.25)]'
                    : 'text-[#333333] hover:text-[#007070] hover:bg-[#E6F4F4]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>BD Tech</span>
              </button>

              {user.isAdmin && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 ${
                    activeTab === 'admin'
                      ? 'bg-slate-900 text-teal-300 shadow-[0_4px_14px_rgba(15,23,42,0.3)] border border-teal-500/30'
                      : 'text-slate-800 hover:text-teal-700 hover:bg-slate-100 font-extrabold'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Director Console</span>
                </button>
              )}
            </nav>
          ) : null}

          {/* Right Action Icons / User Pills */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {user ? (
              <>
                {/* AI Credits Badge / Paywall Trigger */}
                <button
                  onClick={onOpenBuyCredits}
                  title="Click to view AI Credits or Top Up via bKash/Nagad"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black bg-[#E6F4F4] text-[#007070] border border-[#007070]/25 hover:bg-[#d4eded] active:scale-95 transition-all flex items-center space-x-1 sm:space-x-1.5 min-h-[40px]"
                >
                  <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>
                    {user.isAdmin ? 'Unlimited' : user.aiCredits ?? 0}
                  </span>
                  <span className="hidden sm:inline font-semibold">
                    {user.isAdmin ? '' : 'Credits'}
                  </span>
                </button>

                {/* User Profile Info (Desktop) */}
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-[#0B0B0B] flex items-center justify-end gap-1">
                    <span>{user.fullName}</span>
                    {user.isAdmin && (
                      <span className="px-1.5 py-0.2 bg-slate-900 text-teal-300 text-[9px] font-black rounded uppercase tracking-wider">
                        Director
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#7C7C7C] font-medium truncate max-w-[140px]">
                    {user.targetRole || user.email}
                  </div>
                </div>

                {/* Desktop Logout Button */}
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="hidden md:flex p-2 rounded-xl border border-black/10 text-[#7C7C7C] hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-50 active:scale-95 transition-all min-h-[40px] min-w-[40px] items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Mobile Hamburger Button (< md) */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open Mobile Menu"
                  className="md:hidden p-2 rounded-xl border border-black/10 text-[#0B0B0B] hover:bg-slate-100 active:scale-95 transition-all min-h-[42px] min-w-[42px] flex items-center justify-center bg-white shadow-2xs"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#007070] hover:bg-[#005858] active:scale-95 text-white font-extrabold text-xs transition-all shadow-[0_6px_20px_rgba(0,112,112,0.25)] flex items-center space-x-1.5 min-h-[42px]"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer / Hamburger Sheet (< md) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-300">
            <div className="p-5 space-y-5">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/8">
                <div className="flex items-center space-x-2.5">
                  <img
                    src="/logo-icon.png"
                    alt="Logo"
                    className="w-8 h-8 rounded-lg object-cover border border-[#007070]/20"
                  />
                  <div>
                    <h3 className="font-black text-[#0B0B0B] text-sm">s7job-seeker</h3>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold">Navigation Menu</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card (if logged in) */}
              {user && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{user.fullName}</span>
                        {user.isAdmin && (
                          <span className="px-1.5 py-0.2 bg-slate-900 text-teal-300 text-[8px] font-black rounded uppercase">
                            Director
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                        {user.targetRole || user.email}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#007070] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{user.isAdmin ? 'Unlimited Credits' : `${user.aiCredits ?? 0} Credits`}</span>
                    </span>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenBuyCredits();
                      }}
                      className="px-2.5 py-1 text-[11px] font-black text-teal-700 bg-teal-100/70 hover:bg-teal-200/70 rounded-lg transition-colors flex items-center gap-1 min-h-[36px]"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Top Up</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="space-y-1">
                <button
                  onClick={() => handleNavClick('matches')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] ${
                    activeTab === 'matches'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Smart Matches</span>
                </button>

                <button
                  onClick={() => handleNavClick('paste')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] ${
                    activeTab === 'paste'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  <span>Paste & Analyze</span>
                </button>

                <button
                  onClick={() => handleNavClick('profile')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] ${
                    activeTab === 'profile'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Resume & Profile</span>
                </button>

                <button
                  onClick={() => handleNavClick('saved')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] ${
                    activeTab === 'saved'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-4 h-4 shrink-0" />
                  <span>Saved Jobs</span>
                </button>

                <button
                  onClick={() => handleNavClick('companies')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] ${
                    activeTab === 'companies'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>BD Tech Companies</span>
                </button>

                {user?.isAdmin && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] ${
                      activeTab === 'admin'
                        ? 'bg-slate-900 text-teal-300 shadow-sm border border-teal-500/30'
                        : 'text-teal-800 bg-teal-50/70 hover:bg-teal-100/70'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Director Console</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-5 border-t border-slate-200/80 space-y-3 bg-slate-50/50">
              {user ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-white text-rose-600 font-bold text-xs flex items-center justify-center space-x-2 hover:bg-rose-50 active:scale-95 transition-all min-h-[44px] shadow-2xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#007070] text-white font-bold text-xs flex items-center justify-center space-x-2 hover:bg-[#005858] active:scale-95 transition-all min-h-[44px] shadow-sm"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>
              )}

              <p className="text-[10px] text-center text-slate-400 font-medium">
                s7job-seeker · teamS7 Intelligence
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

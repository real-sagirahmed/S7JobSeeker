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
  CreditCard,
  Server,
  History,
  ChevronDown
} from 'lucide-react';
import type { User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  user: User | null;
  activeTab: 'matches' | 'profile' | 'paste' | 'saved' | 'companies' | 'admin' | 'cbs-sprint';
  setActiveTab: (tab: 'matches' | 'profile' | 'paste' | 'saved' | 'companies' | 'admin' | 'cbs-sprint') => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenBuyCredits: () => void;
  onOpenHistory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAuth,
  onOpenBuyCredits,
  onOpenHistory
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close mobile drawer and user menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleNavClick = (tab: 'matches' | 'profile' | 'paste' | 'saved' | 'companies' | 'admin' | 'cbs-sprint') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Sleek Top Brand Gradient Accent Line */}
      <div className="h-[2.5px] bg-gradient-to-r from-[#007070] via-teal-400 to-[#007070] w-full shrink-0" />

      <header className="border-b border-black/8 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-2xs transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0 select-none group"
            onClick={() => handleNavClick('matches')}
          >
            <div className="relative">
              <img
                src="/logo-icon.png"
                alt="s7job-seeker"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-[0_4px_14px_rgba(0,112,112,0.25)] border border-[#007070]/20 shrink-0 group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-[#0B0B0B] group-hover:text-[#007070] transition-colors truncate">
                  s7job-seeker
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-[#E6F4F4] text-[#007070] border border-[#007070]/25 hidden sm:inline-block shrink-0">
                  RAG AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5 hidden sm:block truncate">
                {t.nav.brandSubtitle}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (>= lg: 1024px) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5" aria-label="Main Navigation">
            {user && (
              <>
                <button
                  onClick={() => handleNavClick('matches')}
                  aria-current={activeTab === 'matches' ? 'page' : undefined}
                  className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                    activeTab === 'matches'
                      ? 'bg-[#007070] text-white shadow-[0_3px_12px_rgba(0,112,112,0.22)]'
                      : 'text-slate-700 hover:text-[#007070] hover:bg-[#E6F4F4]/70'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.nav.matches}</span>
                </button>

                <button
                  onClick={() => handleNavClick('paste')}
                  aria-current={activeTab === 'paste' ? 'page' : undefined}
                  className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                    activeTab === 'paste'
                      ? 'bg-[#007070] text-white shadow-[0_3px_12px_rgba(0,112,112,0.22)]'
                      : 'text-slate-700 hover:text-[#007070] hover:bg-[#E6F4F4]/70'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>{t.nav.paste}</span>
                </button>

                <button
                  onClick={() => handleNavClick('profile')}
                  aria-current={activeTab === 'profile' ? 'page' : undefined}
                  className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-[#007070] text-white shadow-[0_3px_12px_rgba(0,112,112,0.22)]'
                      : 'text-slate-700 hover:text-[#007070] hover:bg-[#E6F4F4]/70'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.nav.profile}</span>
                </button>

                <button
                  onClick={() => handleNavClick('saved')}
                  aria-current={activeTab === 'saved' ? 'page' : undefined}
                  className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                    activeTab === 'saved'
                      ? 'bg-[#007070] text-white shadow-[0_3px_12px_rgba(0,112,112,0.22)]'
                      : 'text-slate-700 hover:text-[#007070] hover:bg-[#E6F4F4]/70'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{t.nav.saved}</span>
                </button>

                <button
                  onClick={() => handleNavClick('companies')}
                  aria-current={activeTab === 'companies' ? 'page' : undefined}
                  className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                    activeTab === 'companies'
                      ? 'bg-[#007070] text-white shadow-[0_3px_12px_rgba(0,112,112,0.22)]'
                      : 'text-slate-700 hover:text-[#007070] hover:bg-[#E6F4F4]/70'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t.nav.companies}</span>
                </button>
              </>
            )}

            {/* CBS Career Sprint Tab */}
            <button
              onClick={() => handleNavClick('cbs-sprint')}
              aria-current={activeTab === 'cbs-sprint' ? 'page' : undefined}
              className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                activeTab === 'cbs-sprint'
                  ? 'bg-[#007070] text-white shadow-[0_3px_12px_rgba(0,112,112,0.22)]'
                  : 'text-[#007070] bg-[#E6F4F4]/80 hover:bg-[#E6F4F4] border border-[#007070]/20'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{t.nav.cbsSprint}</span>
              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-amber-400 text-slate-950 ml-0.5">
                14D
              </span>
            </button>

            {/* Director Admin Console */}
            {user?.isAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                aria-current={activeTab === 'admin' ? 'page' : undefined}
                className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-teal-300 shadow-[0_4px_14px_rgba(15,23,42,0.3)] border border-teal-500/30'
                    : 'text-slate-800 hover:text-teal-700 hover:bg-slate-100 font-extrabold'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{t.nav.directorConsole}</span>
              </button>
            )}
          </nav>

          {/* Right Action Tools: Language, Credits, User Menu, Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            
            {/* Language Switcher Pill (Bilingual EN / BN) - Visible across all viewports */}
            <div
              className="flex items-center rounded-xl border border-black/10 bg-slate-100/90 p-0.5 text-xs font-bold text-slate-600 shrink-0 shadow-2xs"
              role="group"
              aria-label="Language selection"
            >
              <button
                type="button"
                onClick={() => setLanguage('en')}
                title="Switch to English"
                className={`px-2 py-1 rounded-lg transition-all min-h-[30px] cursor-pointer text-xs ${
                  language === 'en'
                    ? 'bg-white text-[#007070] font-black shadow-2xs'
                    : 'text-slate-600 hover:text-[#0B0B0B]'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                title="বাংলায় পরিবর্তন করুন"
                className={`px-2 py-1 rounded-lg transition-all min-h-[30px] cursor-pointer text-xs ${
                  language === 'bn'
                    ? 'bg-white text-[#007070] font-black shadow-2xs'
                    : 'text-slate-600 hover:text-[#0B0B0B]'
                }`}
              >
                BN
              </button>
            </div>

            {user ? (
              <>
                {/* AI Credits Badge / Paywall Trigger */}
                <button
                  onClick={onOpenBuyCredits}
                  title={t.nav.topUpCredits}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black bg-[#E6F4F4] text-[#007070] border border-[#007070]/25 hover:bg-[#d8eded] active:scale-95 transition-all flex items-center space-x-1 sm:space-x-1.5 min-h-[38px] shadow-2xs cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current shrink-0 text-[#007070]" />
                  <span>
                    {user.isAdmin ? (language === 'bn' ? 'আনলিমিটেড' : 'Unlimited') : user.aiCredits ?? 0}
                  </span>
                  <span className="hidden sm:inline font-semibold">
                    {user.isAdmin ? '' : t.common.credits}
                  </span>
                </button>

                {/* Direct Mobile Banking Transaction History Trigger (P2-4) */}
                {onOpenHistory && (
                  <button
                    onClick={onOpenHistory}
                    title={t.nav.history}
                    className="hidden xl:flex p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#007070] border border-black/10 hover:border-[#007070]/30 hover:bg-[#E6F4F4]/50 active:scale-95 transition-all items-center gap-1.5 min-h-[38px] cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 shrink-0 text-[#007070]" />
                    <span>{t.nav.history}</span>
                  </button>
                )}

                {/* Desktop User Profile Chip & Dropdown (>= lg) */}
                <div className="relative user-menu-container hidden lg:block">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-black/8 hover:border-[#007070]/30 hover:bg-slate-50 transition-all cursor-pointer min-h-[38px]"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#007070] to-teal-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
                      {getUserInitials(user.fullName)}
                    </div>
                    <div className="text-left text-xs font-bold text-slate-900 truncate max-w-[100px] xl:max-w-[130px]">
                      {user.fullName}
                    </div>
                    {user.isAdmin && (
                      <span className="px-1.5 py-0.2 bg-slate-900 text-teal-300 text-[8px] font-black rounded uppercase tracking-wider shrink-0">
                        {t.nav.director}
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Desktop Profile Dropdown Panel */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-black/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                      <div className="px-3 py-2 border-b border-black/6">
                        <div className="text-xs font-bold text-slate-900 truncate">{user.fullName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                        {user.targetRole && (
                          <div className="text-[10px] text-[#007070] font-semibold mt-0.5 truncate">{user.targetRole}</div>
                        )}
                      </div>

                      <button
                        onClick={() => handleNavClick('profile')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#007070] hover:bg-[#E6F4F4]/70 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#007070]" />
                        <span>{t.nav.profile}</span>
                      </button>

                      {onOpenHistory && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenHistory();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#007070] hover:bg-[#E6F4F4]/70 flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5 text-[#007070]" />
                          <span>{t.nav.history}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenBuyCredits();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#007070] hover:bg-[#E6F4F4]/70 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-[#007070]" />
                        <span>{t.nav.topUp}</span>
                      </button>

                      <div className="pt-1 border-t border-black/6">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>{t.nav.logout}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Logout Icon Button (>= lg) */}
                <button
                  onClick={onLogout}
                  title={t.nav.logout}
                  className="hidden lg:flex p-2 rounded-xl border border-black/8 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 active:scale-95 transition-all min-h-[38px] min-w-[38px] items-center justify-center cursor-pointer shadow-2xs"
                  aria-label={t.nav.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>

                {/* Mobile Drawer Trigger Button (< lg) */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label={t.nav.menu}
                  aria-expanded={isMobileMenuOpen}
                  className="lg:hidden p-2 rounded-xl border border-black/10 text-slate-800 hover:bg-slate-100 active:scale-95 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center bg-white shadow-2xs cursor-pointer"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 sm:px-4 py-2 rounded-xl bg-[#007070] hover:bg-[#005858] active:scale-95 text-white font-extrabold text-xs transition-all shadow-[0_4px_16px_rgba(0,112,112,0.25)] flex items-center space-x-1.5 min-h-[38px] cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>{t.nav.loginRegister}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer / Hamburger Sheet (< lg) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200" role="dialog" aria-modal="true">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-200">
            <div className="p-4 sm:p-5 space-y-4">
              
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/8">
                <div className="flex items-center space-x-2.5">
                  <img
                    src="/logo-icon.png"
                    alt="s7job-seeker"
                    className="w-8 h-8 rounded-xl object-cover border border-[#007070]/20 shadow-xs"
                  />
                  <div>
                    <h3 className="font-black text-[#0B0B0B] text-sm leading-tight">s7job-seeker</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">{t.nav.brandSubtitle}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Mobile Drawer Language Switcher */}
                  <div className="flex items-center rounded-lg border border-black/10 bg-slate-100 p-0.5 text-xs font-bold text-slate-600 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        language === 'en'
                          ? 'bg-white text-[#007070] font-black shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('bn')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        language === 'bn'
                          ? 'bg-white text-[#007070] font-black shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      BN
                    </button>
                  </div>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label={t.nav.closeMenu}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* User Profile Card (if logged in) */}
              {user && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#007070] to-teal-500 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                      {getUserInitials(user.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <span className="truncate">{user.fullName}</span>
                        {user.isAdmin && (
                          <span className="px-1.5 py-0.2 bg-slate-900 text-teal-300 text-[8px] font-black rounded uppercase shrink-0">
                            {t.nav.director}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {user.targetRole || user.email}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#007070] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-current text-[#007070]" />
                      <span>{user.isAdmin ? t.common.unlimited : `${user.aiCredits ?? 0} ${t.common.credits}`}</span>
                    </span>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenBuyCredits();
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-[#007070] bg-[#E6F4F4] hover:bg-[#d8eded] border border-[#007070]/20 rounded-lg transition-colors flex items-center gap-1 min-h-[34px] cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{t.nav.topUp}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="space-y-1" aria-label="Mobile Navigation">
                <button
                  onClick={() => handleNavClick('matches')}
                  aria-current={activeTab === 'matches' ? 'page' : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] cursor-pointer ${
                    activeTab === 'matches'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{t.nav.matches}</span>
                </button>

                <button
                  onClick={() => handleNavClick('paste')}
                  aria-current={activeTab === 'paste' ? 'page' : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] cursor-pointer ${
                    activeTab === 'paste'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  <span>{t.nav.paste}</span>
                </button>

                <button
                  onClick={() => handleNavClick('profile')}
                  aria-current={activeTab === 'profile' ? 'page' : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{t.nav.profile}</span>
                </button>

                <button
                  onClick={() => handleNavClick('saved')}
                  aria-current={activeTab === 'saved' ? 'page' : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] cursor-pointer ${
                    activeTab === 'saved'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-4 h-4 shrink-0" />
                  <span>{t.nav.saved}</span>
                </button>

                <button
                  onClick={() => handleNavClick('companies')}
                  aria-current={activeTab === 'companies' ? 'page' : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] cursor-pointer ${
                    activeTab === 'companies'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>{t.nav.companies}</span>
                </button>

                <button
                  onClick={() => handleNavClick('cbs-sprint')}
                  aria-current={activeTab === 'cbs-sprint' ? 'page' : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] cursor-pointer ${
                    activeTab === 'cbs-sprint'
                      ? 'bg-[#007070] text-white shadow-xs'
                      : 'text-teal-900 bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/60'
                  }`}
                >
                  <Server className="w-4 h-4 shrink-0 text-teal-600" />
                  <div className="flex items-center space-x-2">
                    <span>{t.nav.cbsSprint}</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-amber-400 text-slate-950">
                      14D
                    </span>
                  </div>
                </button>

                {user?.isAdmin && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    aria-current={activeTab === 'admin' ? 'page' : undefined}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-3 transition-all min-h-[46px] active:scale-[0.98] cursor-pointer ${
                      activeTab === 'admin'
                        ? 'bg-slate-900 text-teal-300 shadow-sm border border-teal-500/30'
                        : 'text-teal-800 bg-teal-50/70 hover:bg-teal-100/70'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{t.nav.directorConsole}</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 space-y-2.5 bg-slate-50/70 pb-8">
              {user ? (
                <>
                  {onOpenHistory && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenHistory();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 hover:bg-slate-50 active:scale-95 transition-all min-h-[44px] shadow-2xs cursor-pointer"
                    >
                      <History className="w-4 h-4 text-[#007070]" />
                      <span>{t.nav.history}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-white text-rose-600 font-bold text-xs flex items-center justify-center space-x-2 hover:bg-rose-50 active:scale-95 transition-all min-h-[44px] shadow-2xs cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.nav.logout}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#007070] text-white font-bold text-xs flex items-center justify-center space-x-2 hover:bg-[#005858] active:scale-95 transition-all min-h-[44px] shadow-sm cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{t.nav.loginRegister}</span>
                </button>
              )}

              <p className="text-[10px] text-center text-slate-400 font-medium">
                s7job-seeker · {t.nav.brandSubtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

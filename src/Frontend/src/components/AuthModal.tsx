import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { AuthResponse } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: AuthResponse) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.auth.register(email, password, fullName, targetRole);
        onSuccess(res);
      } else {
        const res = await api.auth.login(email, password);
        onSuccess(res);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-black/10 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-black/8">
          <div className="flex items-center space-x-3">
            <img
              src="/logo-icon.png"
              alt="S7 Logo"
              className="w-10 h-10 rounded-xl object-cover border border-[#007070]/20 shadow-xs"
            />
            <div>
              <h3 className="font-black text-[#0B0B0B] text-base leading-snug">
                {isRegister ? 'Create S7 SaaS Account' : 'Welcome to s7job-seeker'}
              </h3>
              <p className="text-[11px] text-[#7C7C7C]">
                {isRegister ? 'Sign up to match your resume with real jobs' : 'Sign in to access your matched jobs'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded-xl text-[#7C7C7C] hover:text-[#0B0B0B] hover:bg-black/5 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#333333] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7C7C7C] absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sagir Ahmed"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 min-h-[44px] rounded-xl bg-[#F8FAFC] border border-black/10 text-base sm:text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#333333] mb-1">Target Role (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Senior .NET / Cloud Architect"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl bg-[#F8FAFC] border border-black/10 text-base sm:text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7C7C7C] absolute left-3 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 min-h-[44px] rounded-xl bg-[#F8FAFC] border border-black/10 text-base sm:text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7C7C7C] absolute left-3 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 min-h-[44px] rounded-xl bg-[#F8FAFC] border border-black/10 text-base sm:text-xs text-[#0B0B0B] placeholder-[#7C7C7C] focus:outline-none focus:border-[#007070]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[44px] py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(0,112,112,0.25)]"
          >
            <span>{isLoading ? 'Processing...' : isRegister ? 'Complete Registration' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[#7C7C7C] pb-1">
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-[#007070] hover:underline font-bold min-h-[44px] inline-flex items-center"
          >
            {isRegister ? 'Sign In' : 'Sign Up for Free'}
          </button>
        </div>
      </div>
    </div>
  );
};

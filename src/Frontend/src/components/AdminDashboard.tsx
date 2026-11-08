import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Briefcase,
  DollarSign,
  RefreshCw,
  Gift,
  Search,
  Settings,
  CreditCard,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import type {
  AdminMetrics,
  CreditTransaction,
  AdminUserItem,
  SaaSPlatformSettings
} from '../types';

interface AdminDashboardProps {
  onNotify: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'settings' | 'sync'>('pending');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [pendingPayments, setPendingPayments] = useState<CreditTransaction[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [settings, setSettings] = useState<SaaSPlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Gift credits modal state
  const [giftUser, setGiftUser] = useState<AdminUserItem | null>(null);
  const [giftAmount, setGiftAmount] = useState<number>(10);
  const [giftNote, setGiftNote] = useState<string>('Director Complimentary Bonus');
  const [isGifting, setIsGifting] = useState(false);

  // Settings form state
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [bkashNumber, setBkashNumber] = useState('');
  const [nagadNumber, setNagadNumber] = useState('');
  const [rocketNumber, setRocketNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [welcomeCredits, setWelcomeCredits] = useState(20);
  const [trialDays, setTrialDays] = useState(30);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [m, p, u, s] = await Promise.all([
        api.admin.getMetrics().catch(() => null),
        api.admin.getPendingPayments().catch(() => []),
        api.admin.getUsers().catch(() => []),
        api.admin.getSettings().catch(() => null)
      ]);

      if (m) setMetrics(m);
      setPendingPayments(p);
      setUsers(u);
      if (s) {
        setSettings(s);
        setBkashNumber(s.bkashNumber);
        setNagadNumber(s.nagadNumber);
        setRocketNumber(s.rocketNumber);
        setInstructions(s.paymentInstructions);
        setWelcomeCredits(s.welcomeCredits);
        setTrialDays(s.trialDays);
      }
    } catch (err) {
      console.error(err);
      onNotify('Failed to load Director metrics.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionInProgressId(id);
    try {
      const res = await api.admin.approvePayment(id, 'Verified by Director Sagir Ahmed');
      onNotify(res.message, 'success');
      setPendingPayments((prev) => prev.filter((p) => p.id !== id));
      // Refresh metrics and users
      const m = await api.admin.getMetrics();
      setMetrics(m);
      const u = await api.admin.getUsers(userSearch);
      setUsers(u);
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Approval failed', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleReject = async (id: string) => {
    const note = window.prompt('Enter rejection reason (e.g. Invalid TrxID or SMS not found):', 'TrxID not found in statement');
    if (note === null) return;

    setActionInProgressId(id);
    try {
      const res = await api.admin.rejectPayment(id, note || 'Rejected by Director');
      onNotify(res.message, 'info');
      setPendingPayments((prev) => prev.filter((p) => p.id !== id));
      const m = await api.admin.getMetrics();
      setMetrics(m);
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Rejection failed', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const u = await api.admin.getUsers(userSearch);
      setUsers(u);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGiftCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftUser) return;

    setIsGifting(true);
    try {
      const res = await api.admin.giftCredits(giftUser.id, giftAmount, giftNote);
      onNotify(res.message, 'success');
      setUsers((prev) =>
        prev.map((u) => (u.id === giftUser.id ? { ...u, aiCredits: res.newBalance } : u))
      );
      setGiftUser(null);
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Failed to gift credits', 'error');
    } finally {
      setIsGifting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const payload: SaaSPlatformSettings = {
        id: 1,
        bkashNumber: bkashNumber.trim(),
        nagadNumber: nagadNumber.trim(),
        rocketNumber: rocketNumber.trim(),
        paymentInstructions: instructions.trim(),
        welcomeCredits,
        trialDays
      };
      const res = await api.admin.updateSettings(payload);
      onNotify(res.message, 'success');
      setSettings(payload);
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Failed to update settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSyncJobs = async () => {
    setIsSyncing(true);
    try {
      const res = await api.jobs.syncJobs();
      onNotify(`Job Engine Sync Finished: Fetched ${res.totalFetched}, New: ${res.totalNew}`, 'success');
      const m = await api.admin.getMetrics();
      if (m) setMetrics(m);
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-5 sm:p-8 shadow-xl border border-teal-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#007070]/30 border border-[#007070]/50 text-teal-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Director Administration Console · Sagir Ahmed</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
              SaaS Operations & Payment Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Real-time Mobile Banking TrxID approvals, candidate credit allocations, platform pricing numbers, and live job aggregator management.
            </p>
          </div>

          <button
            onClick={loadAllAdminData}
            disabled={isLoading}
            className="self-stretch sm:self-auto min-h-[44px] justify-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Dashboard</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              ৳ {metrics?.totalRevenueBdt ?? 0}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
              {metrics?.approvedPaymentsCount ?? 0} Approved Transactions
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex items-center gap-4 ${
          (metrics?.pendingPaymentsCount ?? 0) > 0 ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200/80'
        }`}>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 relative shrink-0">
            <CreditCard className="w-6 h-6" />
            {(metrics?.pendingPaymentsCount ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending TrxIDs</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics?.pendingPaymentsCount ?? 0}
            </div>
            <div className="text-[10px] text-amber-600 font-bold mt-0.5">
              Requires Director verification
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Candidates</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics?.activeCandidates ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">
              {metrics?.totalUsers ?? 0} Total Accounts
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-50 text-[#007070] shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog Jobs</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics?.totalJobs ?? 0}
            </div>
            <div className="text-[10px] text-[#007070] font-bold mt-0.5">
              Across 7 Aggregator Sources
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-[#007070] text-[#007070]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Pending Payments ({pendingPayments.length})</span>
          {pendingPayments.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-black">
              {pendingPayments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-[#007070] text-[#007070]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidates Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-[#007070] text-[#007070]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>bKash / Nagad Receiver Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sync'
              ? 'border-[#007070] text-[#007070]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Live Job Engine Sync</span>
        </button>
      </div>

      {/* Tab 1: Pending Payments */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingPayments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Pending Queue is Empty</h3>
              <p className="text-xs text-slate-500 mt-1">
                All submitted bKash and Nagad payments have been reviewed and approved.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((trx) => (
                <div
                  key={trx.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-pink-100 text-pink-800">
                        {trx.method}
                      </span>
                      <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                        {trx.transactionId}
                      </span>
                      <button
                        onClick={() => handleCopyText(trx.transactionId, trx.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy TrxID"
                      >
                        {copiedId === trx.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {new Date(trx.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      <strong>Candidate:</strong> {trx.userFullName} ({trx.userEmail})
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 sm:gap-4">
                      <span>Sender Phone: <strong className="font-mono text-slate-900">{trx.senderNumber}</strong></span>
                      <span>Amount: <strong className="text-emerald-700">৳ {trx.amountPaidBdt}</strong></span>
                      <span>Bundle: <strong className="text-[#007070]">+{trx.creditsAmount} AI Credits</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button
                      onClick={() => handleReject(trx.id)}
                      disabled={actionInProgressId === trx.id}
                      className="flex-1 md:flex-initial min-h-[44px] justify-center px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 active:scale-[0.98] text-rose-600 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(trx.id)}
                      disabled={actionInProgressId === trx.id}
                      className="flex-1 md:flex-initial min-h-[44px] justify-center px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{actionInProgressId === trx.id ? 'Approving...' : 'Approve & Credit'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Candidates Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* User Search Form */}
          <form onSubmit={handleSearchUsers} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate by name, email, or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070] bg-white shadow-2xs"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center"
            >
              Search
            </button>
          </form>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Role / Target</th>
                    <th className="py-3 px-4">Trial Status</th>
                    <th className="py-3 px-4">AI Credits</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {u.isAdmin && (
                            <span className="px-1.5 py-0.2 bg-teal-100 text-[#007070] text-[9px] font-black rounded uppercase">
                              Director
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{u.targetRole || 'Not specified'}</td>
                      <td className="py-3 px-4">
                        {u.isAdmin ? (
                          <span className="text-teal-700 font-bold">Lifetime Master</span>
                        ) : u.isTrialActive ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Active Trial
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                            Trial Expired
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-black text-[#007070] bg-[#E6F4F4] px-2.5 py-1 rounded-lg">
                          ⚡ {u.aiCredits}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setGiftUser(u)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#007070]/30 text-[#007070] hover:bg-[#E6F4F4] active:scale-95 font-bold text-xs transition-all inline-flex items-center gap-1"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Gift Credits</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SaaS Payment Numbers & Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Mobile Banking Receivers & Monetization Rules
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Configure the official bKash, Nagad, and Rocket numbers shown to candidates when purchasing credits.
            {settings?.updatedAt && (
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Last updated: {new Date(settings.updatedAt).toLocaleString()}
              </span>
            )}
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                bKash Receiver Number & Instructions
              </label>
              <input
                type="text"
                required
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                placeholder="017XXXXXXXX (Personal / Send Money)"
                className="w-full px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nagad Receiver Number & Instructions
              </label>
              <input
                type="text"
                required
                value={nagadNumber}
                onChange={(e) => setNagadNumber(e.target.value)}
                placeholder="017XXXXXXXX (Personal / Send Money)"
                className="w-full px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rocket Receiver Number & Instructions
              </label>
              <input
                type="text"
                required
                value={rocketNumber}
                onChange={(e) => setRocketNumber(e.target.value)}
                placeholder="017XXXXXXXX (Personal / Send Money)"
                className="w-full px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Welcome Free Credits
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={welcomeCredits}
                  onChange={(e) => setWelcomeCredits(parseInt(e.target.value) || 20)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Free Trial Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value) || 30)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Candidate Payment Instruction Note
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070]"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] active:scale-[0.98] text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isSavingSettings ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Live Job Sync */}
      {activeTab === 'sync' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Job Pipeline Aggregator Engine</h3>
            <p className="text-xs text-slate-500 mt-1">
              Currently ingesting and deduplicating jobs from 7 active platforms.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: 'BDJobs', tag: 'Direct SPA Crawler' },
              { name: 'LinkedIn', tag: 'Public Guest Scraper' },
              { name: 'Jobicy', tag: 'Remote API' },
              { name: 'Himalayas', tag: 'Global Tech API' },
              { name: 'We Work Remotely', tag: 'RSS Feed' },
              { name: 'Remotive', tag: 'Developer API' },
              { name: 'Arbeitnow', tag: 'European & Remote API' }
            ].map((src, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 text-xs">{src.name}</div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{src.tag}</div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleSyncJobs}
              disabled={isSyncing}
              className="w-full sm:w-auto min-h-[44px] justify-center px-6 py-3 rounded-xl bg-[#007070] hover:bg-[#005858] active:scale-[0.98] text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Ingesting Jobs from 7 Sources...' : 'Trigger Live Sync Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Gift Credits Modal */}
      {giftUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-black/10 relative max-h-[92vh] overflow-y-auto">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 sm:hidden" />

            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#007070]" />
              <span>Gift AI Credits to Candidate</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Recipient: <strong>{giftUser.fullName}</strong> ({giftUser.email})<br />
              Current Balance: <span className="text-[#007070] font-bold">{giftUser.aiCredits} Credits</span>
            </p>

            <form onSubmit={handleGiftCreditsSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Credits to Add
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGiftAmount(num)}
                      className={`min-h-[44px] py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        giftAmount === num
                          ? 'bg-[#007070] text-white border-[#007070]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Credit Amount
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Director Audit Note
                </label>
                <input
                  type="text"
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="e.g. Complimentary test credits or prize"
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070]"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGiftUser(null)}
                  className="order-2 sm:order-1 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGifting}
                  className="order-1 sm:order-2 min-h-[44px] px-6 py-2 rounded-xl bg-[#007070] hover:bg-[#005858] active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
                >
                  {isGifting ? 'Adding...' : 'Confirm Gift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

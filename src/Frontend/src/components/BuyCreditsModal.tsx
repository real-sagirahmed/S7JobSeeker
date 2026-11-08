import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  History,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import type { CreditBundle, SaaSPlatformSettings, SubscriptionStatus } from '../types';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userCredits?: number;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userCredits = 0
}) => {
  const [bundles, setBundles] = useState<CreditBundle[]>([]);
  const [settings, setSettings] = useState<SaaSPlatformSettings | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [selectedBundleId, setSelectedBundleId] = useState<number>(2); // Default to Pro Pack (100 Tk)
  const [paymentMethod, setPaymentMethod] = useState<number>(1); // 1 = bKash, 2 = Nagad, 3 = Rocket
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [bundlesData, settingsData, statusData] = await Promise.all([
        api.subscription.getBundles().catch(() => [
          { id: 1, name: 'Starter Pack', credits: 5, priceBdt: 50, badgeText: 'Starter', isPopular: false },
          { id: 2, name: 'Pro Pack', credits: 15, priceBdt: 100, badgeText: 'Best Value', isPopular: true },
          { id: 3, name: 'Power Pack', credits: 35, priceBdt: 200, badgeText: 'Max Savings', isPopular: false }
        ]),
        api.subscription.getPlatformSettings().catch(() => ({
          id: 1,
          bkashNumber: '017XXXXXXXX (Personal / Send Money)',
          nagadNumber: '017XXXXXXXX (Personal / Send Money)',
          rocketNumber: '017XXXXXXXX (Personal / Send Money)',
          paymentInstructions: 'বিকাশ বা নগদ সেন্ড মানি করে TrxID ও প্রেরক নম্বর নিচে সাবমিট করুন। অ্যাডমিন ভেরিফাই করে ক্রেডিট অনুমোদন করবেন।',
          welcomeCredits: 20,
          trialDays: 30
        })),
        api.subscription.getStatus().catch(() => null)
      ]);

      setBundles(bundlesData);
      setSettings(settingsData);
      if (statusData) setStatus(statusData);
    } catch (err) {
      console.error('Failed to load payment options', err);
    }
  };

  if (!isOpen) return null;

  const selectedBundle = bundles.find((b) => b.id === selectedBundleId) || bundles[1];

  const getReceiverNumber = () => {
    if (!settings) return '017XXXXXXXX';
    switch (paymentMethod) {
      case 1:
        return settings.bkashNumber;
      case 2:
        return settings.nagadNumber;
      case 3:
        return settings.rocketNumber;
      default:
        return settings.bkashNumber;
    }
  };

  const handleCopy = (text: string, type: string) => {
    // Extract only digits for dialing/send money
    const cleanNumber = text.split(' ')[0];
    navigator.clipboard.writeText(cleanNumber);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!senderNumber.trim() || senderNumber.trim().length < 10) {
      setErrorMessage('Please enter a valid sender mobile number (at least 10 digits).');
      return;
    }

    if (!transactionId.trim() || transactionId.trim().length < 4) {
      setErrorMessage('Please enter a valid TrxID from your SMS/app receipt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.subscription.submitPayment(
        selectedBundleId,
        paymentMethod,
        senderNumber.trim(),
        transactionId.trim()
      );
      setSuccessMessage(res.message);
      setSenderNumber('');
      setTransactionId('');
      // Reload status to show in recent transactions
      const updatedStatus = await api.subscription.getStatus();
      setStatus(updatedStatus);
      onSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed. Please check TrxID and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-black/10 relative max-h-[92vh] overflow-y-auto">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-[#E6F4F4] text-[#007070] rounded-2xl shadow-inner">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Credits Top-Up</h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                bKash / Nagad Instant
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Current Balance: <strong className="text-[#007070]">{status?.aiCredits ?? userCredits} Credits</strong>
              {status?.isTrialActive && ` · Trial: ${status.trialDaysRemaining} days remaining`}
            </p>
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMessage}</p>
              <p className="text-[11px] text-emerald-700 mt-1">
                You will see your credit balance increment as soon as the Director verifies the SMS.
              </p>
            </div>
          </div>
        )}

        {/* View Switcher: Buy Packs vs History */}
        <div className="flex border-b border-slate-200 mb-6 text-xs font-bold">
          <button
            onClick={() => setShowHistory(false)}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              !showHistory
                ? 'border-[#007070] text-[#007070]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Choose Credit Pack</span>
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              showHistory
                ? 'border-[#007070] text-[#007070]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Payment History ({status?.recentTransactions.length ?? 0})</span>
          </button>
        </div>

        {!showHistory ? (
          <>
            {/* Step 1: Pack Selection Cards */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                1. Select AI Credit Bundle
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {bundles.map((bundle) => {
                  const isSelected = bundle.id === selectedBundleId;
                  return (
                    <div
                      key={bundle.id}
                      onClick={() => setSelectedBundleId(bundle.id)}
                      className={`relative cursor-pointer rounded-2xl p-4 transition-all border-2 text-center flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#007070] bg-[#E6F4F4]/50 shadow-[0_4px_16px_rgba(0,112,112,0.15)] ring-1 ring-[#007070]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {bundle.isPopular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#007070] to-teal-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{bundle.badgeText}</span>
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-700 mt-1">{bundle.name}</div>
                        <div className="text-2xl font-black text-slate-900 mt-2">
                          {bundle.credits} <span className="text-xs font-semibold text-slate-500">Credits</span>
                        </div>
                        <div className="text-base font-extrabold text-[#007070] mt-1">
                          ৳ {bundle.priceBdt}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-3 pt-2 border-t border-slate-200/60">
                        {Math.round(bundle.priceBdt / bundle.credits)} ৳ / generation
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Payment Method & Instructions */}
            <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                2. Send Money via Mobile Banking
              </label>

              {/* Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(1)}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                    paymentMethod === 1
                      ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-black">bKash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod(2)}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                    paymentMethod === 2
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-black">Nagad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod(3)}
                  className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                    paymentMethod === 3
                      ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-black">Rocket</span>
                </button>
              </div>

              {/* Copy Number Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    {paymentMethod === 1 ? 'bKash' : paymentMethod === 2 ? 'Nagad' : 'Rocket'} Personal Number
                  </div>
                  <div className="text-sm font-black text-slate-900 tracking-wide mt-0.5 truncate font-mono">
                    {getReceiverNumber()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(getReceiverNumber(), 'phone')}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-[#E6F4F4] text-slate-700 hover:text-[#007070] transition-colors flex items-center gap-1.5 border border-slate-200 shrink-0 active:scale-95"
                >
                  {copiedType === 'phone' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                👉 Send exact <strong>৳ {selectedBundle?.priceBdt}</strong> as <em>Send Money</em> to the number above.
                After successful transfer, enter your sender number and TrxID below.
              </p>
            </div>

            {/* Step 3: Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Verify Payment
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Your Mobile Number (প্রেরক নম্বর)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070] focus:border-transparent bg-white shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BL95X8K1M2"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007070] focus:border-transparent bg-white shadow-2xs uppercase font-mono tracking-wider"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 order-2 sm:order-1">
                  <ShieldCheck className="w-4 h-4 text-[#007070] shrink-0" />
                  <span>Manual Verification by Sagir Ahmed</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="order-1 sm:order-2 w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#007070] hover:bg-[#005858] active:scale-[0.98] text-white text-xs font-extrabold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Submit Payment (৳ {selectedBundle?.priceBdt})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Payment History View */
          <div className="space-y-3">
            {status?.recentTransactions && status.recentTransactions.length > 0 ? (
              status.recentTransactions.map((trx) => (
                <div
                  key={trx.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 tracking-wider">
                        {trx.transactionId}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                        {trx.method}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          trx.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trx.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {trx.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Sender: <span className="font-mono">{trx.senderNumber}</span> ·{' '}
                      {new Date(trx.createdAt).toLocaleDateString()}
                    </div>
                    {trx.adminNote && (
                      <div className="text-[11px] text-slate-600 mt-0.5 italic">
                        Note: {trx.adminNote}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-[#007070]">+{trx.creditsAmount} Credits</div>
                    <div className="text-[11px] text-slate-500 font-semibold">৳ {trx.amountPaidBdt}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No past transactions recorded yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

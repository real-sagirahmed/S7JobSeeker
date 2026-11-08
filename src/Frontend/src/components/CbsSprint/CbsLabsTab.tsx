import React, { useState } from 'react';
import {
  Check,
  Copy,
  Search,
  ArrowRight
} from 'lucide-react';

interface CbsLabsTabProps {
  onOpenDay: (dayNumber: number) => void;
}

interface LabItem {
  id: string;
  dayNumber: number;
  category: 'sql' | 'accounting' | 'linux' | 'docker' | 'cbs';
  title: string;
  scenario: string;
  code: string;
  language: string;
  explanation: string;
  verificationTip: string;
}

export const CbsLabsTab: React.FC<CbsLabsTabProps> = ({ onOpenDay }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const labs: LabItem[] = [
    {
      id: 'lab-1',
      dayNumber: 1,
      category: 'sql',
      title: 'Failed Banking Transaction Status Verification',
      scenario: 'গুলশান ব্রাঞ্চ থেকে কাস্টমার অভিযোগ করেছে যে সকাল ১০:০০ টায় ট্রান্সফার ফেইল্ড হয়েছে কিন্তু ব্যালেন্স ডেবিট হওয়ার দাবি করছে।',
      code: `SELECT TransactionId, AccountId, Amount, TransactionType, Status, ReferenceNumber, CreatedAt\nFROM Transactions WITH (NOLOCK)\nWHERE AccountId = 1002\n  AND CreatedAt BETWEEN '2026-11-08 09:30:00' AND '2026-11-08 10:30:00';`,
      language: 'sql',
      explanation: 'প্রোডাকশন ডেটাবেসে লক না ফেলে নির্দিষ্ট সময়ের আশপাশের সব ট্রানজ্যাকশন রিড করা।',
      verificationTip: 'Status = Failed নিশ্চিত হলে ব্যালেন্স লিয়েন/হোল্ড অবস্থায় আছে কি না তা লেজারে যাচাই করুন।'
    },
    {
      id: 'lab-2',
      dayNumber: 2,
      category: 'sql',
      title: 'Branch-wise Account Count & Balance Aggregates',
      scenario: 'প্রতিটি ব্র্যাঞ্চের মোট সক্রিয় অ্যাকাউন্ট সংখ্যা এবং মোট জমার পরিমাণ বের করতে হবে।',
      code: `SELECT c.City, COUNT(a.AccountId) AS TotalAccounts, SUM(a.Balance) AS TotalDeposits\nFROM Customers c\nINNER JOIN Accounts a ON c.CustomerId = a.CustomerId\nWHERE a.Status = 'Active'\nGROUP BY c.City\nHAVING SUM(a.Balance) > 50000;`,
      language: 'sql',
      explanation: 'INNER JOIN ও GROUP BY ক্লজের সাথে HAVING ফিল্টারিং প্রয়োগ।',
      verificationTip: 'কখনই WHERE ক্লজে এগ্রিগেট ফাংশন ব্যবহার করবেন না; ফিল্টারিংয়ের জন্য HAVING ব্যবহার করুন।'
    },
    {
      id: 'lab-3',
      dayNumber: 3,
      category: 'sql',
      title: 'Identify Duplicate Transaction References (Forensic Audit)',
      scenario: 'একই রেফারেন্স নাম্বারে একাধিক ট্রানজ্যাকশন রেকর্ড ঢুকে ডাবল পোস্টিং হয়েছে কি না তা শনাক্ত করা।',
      code: `SELECT ReferenceNumber, COUNT(*) AS DuplicateCount, MIN(CreatedAt) AS FirstSeen, MAX(CreatedAt) AS LastSeen\nFROM Transactions\nWHERE ReferenceNumber IS NOT NULL\nGROUP BY ReferenceNumber\nHAVING COUNT(*) > 1;`,
      language: 'sql',
      explanation: 'GROUP BY HAVING COUNT(*) > 1 প্যাটার্ন দিয়ে ডুপ্লিকেট রেফারেন্স দ্রুত ধরা যায়।',
      verificationTip: 'ডুপ্লিকেট ধরা পড়লে অবিলম্বে সংশ্লিষ্ট ব্যাচ হোল্ড করুন এবং L2 কোর টিমকে এস্কেলেট করুন।'
    },
    {
      id: 'lab-4',
      dayNumber: 4,
      category: 'accounting',
      title: 'Double-Entry General Ledger (GL) Balancing Invariant',
      scenario: 'ব্যাংক লেজারে প্রতিটি পোস্টিংয়ে Debit এবং Credit সমপরিমাণ হয়েছে কি না তা নিশ্চিত করা।',
      code: `SELECT batch_id, \n       SUM(debit_amount) AS TotalDebit,\n       SUM(credit_amount) AS TotalCredit,\n       (SUM(debit_amount) - SUM(credit_amount)) AS Discrepancy\nFROM gl_transaction_postings\nWHERE posting_date = CAST(GETDATE() AS DATE)\nGROUP BY batch_id\nHAVING SUM(debit_amount) <> SUM(credit_amount);`,
      language: 'sql',
      explanation: 'ব্যাংকিং গোল্ডেন রুল: Assets/Expenses বাড়ে ডেবিটে, Liabilities/Revenue বাড়ে ক্রেডিটে। লেজার সর্বদা শূন্য ব্যালেন্সে শেষ হতে হবে।',
      verificationTip: 'যেকোনো অমিল EOD ব্যাচ সেটেলমেন্ট সম্পূর্ণ আটকে দেবে।'
    },
    {
      id: 'lab-5',
      dayNumber: 6,
      category: 'linux',
      title: 'Linux Application Log Filter & Error Triage',
      scenario: 'CBS ব্যাকএন্ড সার্ভিস ডাউন হওয়ার পর অ্যাপ্লিকেশনের ক্র্যাশ লগ দ্রুত বের করা।',
      code: `tail -n 200 -f /home/cbs-admin/cbs-lab/logs/application.log | grep --line-buffered -E "FATAL|ERROR|EXCEPTION"`,
      language: 'bash',
      explanation: 'tail -f দিয়ে রিয়েল-টাইম লগ মনিটর এবং grep -E দিয়ে ফিল্টারিং।',
      verificationTip: 'লগে পাসওয়ার্ড বা সেনসিটিভ ডেটা থাকলে তা মাস্ক না করে টিকেট বা চ্যাটে পেস্ট করবেন না।'
    },
    {
      id: 'lab-6',
      dayNumber: 7,
      category: 'linux',
      title: 'Service Health & Port Listening Diagnostic',
      scenario: 'CBS পেমেন্ট গেটওয়ে পোর্ট 5000-এ রিকোয়েস্ট রিসিভ করছে না বলে অভিযোগ এসেছে।',
      code: `systemctl status cbs-backend.service --no-pager\nss -tulpn | grep 5000`,
      language: 'bash',
      explanation: 'systemctl দিয়ে সার্ভিস স্ট্যাটাস এবং ss/netstat দিয়ে পোর্ট লিসেনিং স্টেট যাচাই।',
      verificationTip: 'পোর্ট ওপেন না থাকলে সার্ভিস বন্ধ বা কনফিগ ফাইলে বাইন্ডিং আইপি মিসম্যাচ রয়েছে।'
    },
    {
      id: 'lab-7',
      dayNumber: 8,
      category: 'docker',
      title: 'Docker Container Crash Analysis & Inspect',
      scenario: 'কনটেইনার হুট করে বন্ধ হয়ে গেছে (Exited)। কারণ অনুসন্ধানে লগ ও এক্সিট কোড দেখা।',
      code: `docker ps -a --filter "status=exited"\ndocker inspect --format='{{.State.ExitCode}} - {{.State.Error}}' cbs-api\ndocker logs --tail 100 cbs-api`,
      language: 'bash',
      explanation: 'Exit code 137 সাধারণত OOM (Out Of Memory) নির্দেশ করে, আর exit code 1 কনফিগারেশন এরর।',
      verificationTip: 'Exit code দেখে সমস্যার উৎস (Memory vs Config) দ্রুত নির্ণয় করা যায়।'
    },
    {
      id: 'lab-8',
      dayNumber: 10,
      category: 'cbs',
      title: 'Nocturnal EOD Batch Failure & Deadlock Resolution',
      scenario: 'রাত ২:০০ টায় এন্ড-অব-ডে ব্যাচে ইন্টারেস্ট ক্যালকুলেশন আটকে গেছে (Batch Hung)।',
      code: `SELECT r.session_id, r.status, r.blocking_session_id, r.wait_type, r.wait_time, t.text\nFROM sys.dm_exec_requests r\nCROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t\nWHERE r.blocking_session_id <> 0;`,
      language: 'sql',
      explanation: 'DMV (Dynamic Management Views) দিয়ে কোন প্রসেসটি কোন প্রসেসকে লক করে রেখেছে তা বের করা।',
      verificationTip: 'ব্লকিং সেশন আইডি পেয়ে অনুমোদন ও রানবুক ছাড়া সরাসরি KILL কমান্ড চালাবেন না।'
    },
    {
      id: 'lab-9',
      dayNumber: 12,
      category: 'cbs',
      title: 'Production Rollback Verification Checklist Query',
      scenario: 'নতুন ভার্সন রিলিজের পর এরর রেট বেড়ে যাওয়ায় রোলব্যাক করা হয়েছে। রোলব্যাক সফল হয়েছে কি না যাচাই।',
      code: `SELECT TOP 10 VersionNumber, AppliedAt, Status\nFROM DeploymentHistory\nORDER BY AppliedAt DESC;`,
      language: 'sql',
      explanation: 'রোলব্যাকের পর অনুমোদিত পূর্ববর্তী ভার্সনে ফিরে আসা এবং হেলথ চেক পাস নিশ্চিত করা।',
      verificationTip: 'রোলব্যাকের পর শুধু অ্যাপ চালু হলেই হবে না, চলমান ট্রানজ্যাকশন ও লেজার ব্যালেন্স স্বাভাবিক হতে হবে।'
    }
  ];

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLabs = labs.filter((lab) => {
    const matchesCategory = selectedCategory === 'all' || lab.category === selectedCategory;
    const matchesSearch =
      lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Diagnostic Labs & Incident Scenarios (হ্যান্ডস-অন ল্যাব ক্যাটালগ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            প্রোডাকশন-গ্রেড SQL স্ক্রিপ্ট, লিনাক্স ট্রাবলশুটিং কমান্ড ও ইনসিডেন্ট সিনারিও ১-ক্লিকে কপি ও প্র্যাকটিস করুন।
          </p>
        </div>

        {/* Search & Category Filter Strip */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কীওয়ার্ড দিয়ে সার্চ করুন (যেমন: deadlock, duplicate, tail, rollback)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto py-1">
            {[
              { id: 'all', label: 'All Labs' },
              { id: 'sql', label: 'SQL Forensics' },
              { id: 'accounting', label: 'Accounting GL' },
              { id: 'linux', label: 'Linux Logs' },
              { id: 'docker', label: 'Docker Ops' },
              { id: 'cbs', label: 'CBS Incident RCA' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lab Cards List */}
      <div className="space-y-4">
        {filteredLabs.length > 0 ? (
          filteredLabs.map((lab) => {
            const isCopied = copiedId === lab.id;

            return (
              <div
                key={lab.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                      Day {lab.dayNumber}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                      {lab.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => onOpenDay(lab.dayNumber)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
                  >
                    <span>সম্পূর্ণ পাঠে যান</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Scenario & Code */}
                <div className="p-4 sm:p-6 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-900">Scenario Context:</strong> {lab.scenario}
                  </p>

                  {/* Dark Terminal Code Snippet */}
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                      <span className="font-mono text-teal-400 font-bold uppercase tracking-wider text-[10px]">
                        {lab.language}
                      </span>
                      <button
                        onClick={() => handleCopy(lab.id, lab.code)}
                        className="flex items-center space-x-1.5 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400 font-bold">কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px]">১-ক্লিক কপি</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-300/95 overflow-x-auto leading-relaxed">
                      <code>{lab.code}</code>
                    </pre>
                  </div>

                  {/* Explanation & Senior Tip */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block">কমান্ডের উদ্দেশ্য:</span>
                      <span>{lab.explanation}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/70 text-teal-900 space-y-1">
                      <span className="font-black text-teal-950 block">সিনিয়র ইঞ্জিনিয়ার ভেরিফিকেশন রুল:</span>
                      <span>{lab.verificationTip}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500 text-xs">
            সার্চের সাথে মিলে এমন কোনো ল্যাব পাওয়া যায়নি। অন্য কীওয়ার্ড দিয়ে চেষ্টা করুন।
          </div>
        )}
      </div>
    </div>
  );
};

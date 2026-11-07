# s7job-seeker — Project Manual & Operational Runbook (`manual.md`)

## ০. কাজের অগ্রগতি ও ওয়ার্ক-ফ্লো লগ (Workflow & Activity Log - Descending)
> প্রতিটি ধাপ বা কাজ সম্পন্ন হওয়ার সাথে সাথে এই সেকশনে তারিখ ও সময় অনুযায়ী (সর্বশেষ কাজ সবার উপরে - Descending Order) কাজের বিবরণ ও স্ট্যাটাস আপডেট রাখা হবে।

| তারিখ ও সময় (desc) | অ্যাকশন / মাইলস্টোন | বিস্তারিত বিবরণ | স্ট্যাটাস |
| :--- | :--- | :--- | :--- |
| `2026-11-07 15:23` | **Local Full-Stack Execution & Multi-Port Dev Setup** | লোকাল ডেভেলপমেন্ট সফলভাবে চালু: `MSSQLLocalDB` স্টার্ট ও অটো-মাইগ্রেশন ভেরিফায়েড, ASP.NET Core API `http://localhost:5000`-এ লাইভ (Swagger ও হেলথ চেক সক্রিয়), এবং React 19 ফ্রন্টএন্ড Vite HMR সার্ভার `http://localhost:5173`-এ লাইভ। | Completed |
| `2026-11-07 15:18` | **CI/CD IIS app_offline Lock Release & Live Verification** | GitHub Actions Run #13 সফল: IIS `app_offline.htm` মেকানিজমে DLL লক রিলিজ করে সরাসরি `\wwwroot`-এ নতুন কোড ও ফ্রন্টএন্ড বান্ডেল (`index-DzKjaAZh.js`) ডেপ্লয় সম্পন্ন। লাইভ রেজুমে আপলোড ও ৩১২টি জব সিঙ্ক ভেরিফায়েড। | Completed |
| `2026-11-07 13:35` | **Production Deployment & MSSQL Database Online** | MonsterASP.net-এ `s7jobseeker.runasp.net` ডোমেনে লাইভ ওয়েব-অ্যাপ সক্রিয়। SQL Server 2025 ডাটাবেজ (`db78456`) কনফিগারেশন, `HealthController` ডায়াগনস্টিকস এবং লাইভ ভেরিফিকেশন সম্পন্ন। | Completed |
| `2026-11-07 11:51` | **GitHub Remote Integration & Production Codebase Pushed** | রিমোট রিপোজিটরি `https://github.com/real-sagirahmed/S7JobSeeker.git`-এ সিকিউরিটি অডিট ও টেস্ট সম্পন্ন করে `main` ব্রাঞ্চে সোর্সকোড সফলভাবে পুশ সম্পন্ন। | Completed |
| `2026-11-07 11:42` | **S7 Brand System Light Theme Implementation** | `s7-brand-color-details.html` গাইডলাইন অনুযায়ী সম্পূর্ণ ফ্রন্টএন্ড লাইট থিমে রূপান্তর সম্পন্ন। Primary Teal (`#007070`), Background (`#FFFFFF`, `#F8FAFC`), Headings (`#0B0B0B`), Body (`#333333`), Muted (`#7C7C7C`), Border (`rgba(0,0,0,0.08)`), Soft Accent (`#E6F4F4`) প্রয়োগ এবং Vite প্রোডাকশন রিবিল্ড সফল। | Completed |
| `2026-11-07 11:31` | **Live Batch Job Ingestion & Circuit-Breaker Verification** | লাইভ ওপেন এপিআই (Remotive + Arbeitnow) থেকে ৩১২টি রিয়েল জব মাত্র ৭.২ সেকেন্ডে স্বয়ংক্রিয়ভাবে ইনজেস্ট ও ডাটাবেজে সেভ সম্পন্ন। ফেইল-ফাস্ট ভেক্টর সার্কিট-ব্রেকার কার্যকর। | Completed |
| `2026-11-07 11:26` | **teamS7 Intelligence Rebranding** | ব্র্যান্ড আইডেন্টিটি টেক্সট `OutFit Haven` থেকে পরিবর্তিত হয়ে `teamS7 Intelligence`-এ সম্পূর্ণ ফ্রন্টএন্ডে সিঙ্ক করা হয়েছে। | Completed |
| `2026-11-07 11:22` | **S7 Brand Color System & Live Ingestion Integration** | সম্পূর্ণ ফ্রন্টএন্ডে S7 Signature Teal (`#007070`), Dark Theme (`#050505`, `#141414`) ও ২৬% গ্লো সিস্টেম ইমপ্লিমেন্ট সম্পন্ন। লাইভ "Sync Tech Jobs" বাটন ও রিলিজ বিল্ড কার্যকর। | Completed |
| `2026-11-07 11:07` | **Live Server Execution & UserSecrets Initialization** | `UserSecretsId` সফলভাবে `S7JobSeeker.Api.csproj`-এ কনফিগার করা হয়েছে এবং `http://localhost:5000`-এ লাইভ সার্ভার রান করা হয়েছে (SQL Server অটো-মাইগ্রেশন সফল)। | Completed |
| `2026-11-07 10:22` | **Public Repo Hardening & Secrets Isolation** | পাবলিক রিপোজিটরির জন্য কঠোর `.gitignore`, `appsettings.example.json` টেমপ্লেট, `UserSecrets` সাপোর্ট, MonsterASP অটো-মাইগ্রেশন এবং সিকিউরিটি রিগ্রেশন টেস্ট স্যুট (`S7JobSeeker.Tests`) সফলভাবে পাস। | Completed |
| `2026-11-07 10:07` | **React Frontend & CI/CD Deployment Workflows** | React 19, TypeScript, Tailwind v4 UI ড্যাশবোর্ড তৈরি, `wwwroot`-এ প্রোডাকশন বিল্ড এবং MonsterASP FTPS + Cron GitHub Actions পাইপলাইন কনফিগারেশন সম্পন্ন। | Completed |
| `2026-11-07 09:58` | **Database Schema & EF Core Migration** | SQL Server-এর জন্য `InitialCreate` মাইগ্রেশন প্রস্তুত (`ApplicationUser`, `UserProfile`, `JobPosting`, `JobMatchScore`, `TailoredApplication`)। | Completed |
| `2026-11-07 09:55` | **Web API Controllers & Endpoints** | JWT Identity Auth, রেজুমি আপলোড ও পার্সিং, অটো-সিঙ্ক ক্রন এন্ডপয়েন্ট, এবং সিম্যান্টিক জব ম্যাচিং কন্ট্রোলার ইমপ্লিমেন্টেশন সম্পন্ন। | Completed |
| `2026-11-07 09:53` | **AI Engine & Vector Integration** | Semantic Kernel + Gemini Flash/Embedding ইন্টিগ্রেশন, `PdfPig` রেজুমি পার্সার, Qdrant ভেক্টর সার্ভিস এবং Remotive/Arbeitnow জব ফেচার সম্পন্ন। | Completed |
| `2026-11-07 09:48` | **.NET 9 Solution Scaffolding** | `S7JobSeeker.sln` এবং ৪টি ক্লিন আর্কিটেকচার প্রজেক্ট (`Core`, `Infrastructure`, `AI`, `Api`) ডিপেনডেন্সিসহ সফলভাবে বিল্ড ও কনফিগারেশন। | Completed |
| `2026-11-07 09:41` | **Workflow Tracking Integration** | `manual.md`-এ কাজের অগ্রগতি ও টাইমলাইন ট্র্যাকিং সিস্টেম যুক্ত করা হয়েছে। | Completed |
| `2026-11-07 09:37` | **Agent Governance Setup** | `.agent` ডিরেক্টরিতে আর্কিটেকচারাল লক সংবলিত `rules.md` এবং অপারেশনাল `manual.md` তৈরি। | Completed |
| `2026-11-07 09:31` | **Runtime Verification** | মেশিনের `.NET 9 SDK (9.0.320)` এবং `Node.js (v20.20.0)` রানটাইম পরীক্ষা ও নিশ্চিতকরণ। | Completed |
| `2026-11-07 09:30` | **Architectural Blueprint Finalization** | `/grill-me` ইন্টারভিউয়ের মাধ্যমে .NET 9 Web API, React, Qdrant, MonsterASP.net ও GitHub Actions আর্কিটেকচার চূড়ান্তকরণ। | Completed |
| `2026-11-07 09:23` | **Project Initialization** | `s7job-seeker` রিপোজিটরি স্কোপিং ও প্রয়োজনীয় রিকোয়ারমেন্টস বিশ্লেষণ শুরু। | Completed |

---

## ১. প্রজেক্ট পরিচিতি (Project Overview)
`s7job-seeker` একটি AI-পাওয়ার্ড SaaS ওয়েব অ্যাপ্লিকেশন। এর প্রধান লক্ষ্য হলো প্রার্থীর রেজুমি অ্যানালাইসিস করে রিয়েল-ওয়ার্ল্ড জব সার্কুলারের সাথে সিম্যান্টিক ম্যাচিং, স্কিল গ্যাপ আইডেন্টিফিকেশন এবং কাস্টমাইজড জব অ্যাপ্লিকেশনের পরামর্শ প্রদান করা।

---

## ২. টেকনোলজি স্পেসিফিকেশন ও প্রয়োজনীয় টুলস
- **Runtime**: .NET 9 SDK (`9.0.x`), Node.js (`v20.x` বা তদূর্ধ্ব)
- **Backend**: ASP.NET Core Web API (.NET 9)
- **Database**: MS SQL Server (MonsterASP.net ফ্রি টিয়ার)
- **Vector DB**: Qdrant Cloud (ফ্রি ১জিবি ক্লাস্টার)
- **AI Framework**: Microsoft Semantic Kernel (.NET)
- **LLM & Embeddings**: Google Gemini API (`gemini-2.0-flash` ও `text-embedding-004`)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **CI/CD**: GitHub Actions

---

## ৩. সলিউশন আর্কিটেকচার ও ডিরেক্টরি লেআউট

```
d:\s7job-seeker\
├── .agent/
│   ├── rules.md                  # ইঞ্জিনিয়ারিং রুলস ও আর্কিটেকচারাল লক
│   └── manual.md                 # প্রজেক্ট ম্যানুয়াল ও অপারেশনাল গাইড
├── .github/
│   └── workflows/
│       ├── deploy.yml            # CI/CD: MonsterASP.net FTPS ডেপ্লয়মেন্ট
│       └── cron-job-sync.yml     # অটোমেটেড জব ফেচিং শিডিউল
├── src/
│   ├── Backend/
│   │   ├── S7JobSeeker.Api/             # এপিআই কন্ট্রোলার, মিডলওয়্যার, কনফিগারেশন
│   │   ├── S7JobSeeker.Core/            # ডোমেন এন্টিটি, ডিটিও, ইন্টারফেস
│   │   ├── S7JobSeeker.Infrastructure/  # EF Core, MSSQL, Qdrant Client, API Integrations
│   │   └── S7JobSeeker.AI/              # Semantic Kernel, প্রম্পট টেমপ্লেট, রেজুমি পার্সার
│   └── Frontend/                        # React SPA (Vite)
│       ├── src/
│       │   ├── components/              # রিইউজেবল UI কম্পোনেন্ট
│       │   ├── pages/                   # ড্যাশবোর্ড, রেজুমি অ্যানালাইজার, জব ম্যাচিং
│       │   └── services/                # এপিআই ক্লায়েন্ট
│       └── vite.config.ts               # বিল্ড আউটপুট: S7JobSeeker.Api/wwwroot
├── S7JobSeeker.sln
└── README.md
```

---

## ৪. এনভায়রনমেন্ট ভেরিয়েবল ও কনফিগারেশন (Configuration Keys)

`src/Backend/S7JobSeeker.Api/appsettings.json` ফাইলে নিম্নলিখিত কী-গুলো কনফিগার করতে হবে:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=...;User Id=...;Password=...;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "Secret": "YourSuperSecretKeyAtLeast32CharsLong123!",
    "Issuer": "s7job-seeker",
    "Audience": "s7job-seeker-users",
    "ExpiryInDays": 7
  },
  "GeminiSettings": {
    "ApiKey": "YOUR_GEMINI_API_KEY",
    "ModelId": "gemini-2.0-flash",
    "EmbeddingModelId": "text-embedding-004"
  },
  "QdrantSettings": {
    "Endpoint": "https://xyz-your-cluster.qdrant.tech:6333",
    "ApiKey": "YOUR_QDRANT_API_KEY",
    "CollectionName": "tech-jobs"
  },
  "CronSettings": {
    "SecretKey": "YOUR_RANDOM_CRON_TRIGGER_SECRET_KEY"
  }
}
```

---

## ৫. লোকাল ডেভেলপমেন্ট গাইড (Local Development)

### ক. ব্যাকএন্ড রান করা
```powershell
cd d:\s7job-seeker\src\Backend\S7JobSeeker.Api
dotnet restore
dotnet build
dotnet run
```
এপিআই সোয়াগার ইউআই: `http://localhost:5000/swagger`

### খ. ফ্রন্টএন্ড রান করা (লোকাল ডেভ সার্ভার)
```powershell
cd d:\s7job-seeker\src\Frontend
npm install
npm run dev
```

### গ. প্রোডাকশন বিল্ড ও অ্যাসেম্বলি
ফ্রন্টএন্ড বিল্ড করে ব্যাকএন্ডের `wwwroot`-এ সিঙ্ক করা:
```powershell
cd d:\s7job-seeker\src\Frontend
npm run build
```

---

## ৬. ডেপ্লয়মেন্ট রানবুক (MonsterASP.net via GitHub Actions)

### GitHub Repository Secrets
GitHub রিপোজিটরির **Settings > Secrets and variables > Actions**-এ নিচের সিক্রেটগুলো যোগ করতে হবে:
1. `MONSTERASP_FTP_SERVER` (যেমন: `ftp.monsterasp.net`)
2. `MONSTERASP_FTP_USERNAME`
3. `MONSTERASP_FTP_PASSWORD`
4. `APP_CRON_KEY` (ক্রন জব অথেনটিকেশনের জন্য)
5. `APP_API_URL` (আপনার MonsterASP অ্যাপের পাবলিক URL)

### ডেপ্লয়মেন্ট স্টেপস:
1. `main` ব্রাঞ্চে কোড পুশ করলে `.github/workflows/deploy.yml` অটোমেটিক রান করবে।
2. এটি ফ্রন্টএন্ড বিল্ড করে `wwwroot`-এ নিবে এবং .NET 9 অ্যাপ পাবলিশ করে FTPS-এর মাধ্যমে MonsterASP-এ ডিপ্লয় করবে।
3. `.github/workflows/cron-job-sync.yml` নির্ধারিত সময়ে `POST https://yourdomain.com/api/jobs/sync` এন্ডপয়েন্টে রিকোয়েস্ট পাঠাবে নতুন জব ইনজেস্ট করার জন্য।

---

## ৭. মেইনটেন্যান্স ও ট্রাবলশুটিং
- **MonsterASP Cold Start**: ফ্রি টিয়ারে কিছু সময় নিষ্ক্রিয় থাকলে প্রথম রিকোয়েস্টে ৫-১০ সেকেন্ড সময় লাগতে পারে। এটি স্বাভাবিক।
- **Vector DB Out of Sync**: কোনো কারণে ডেটাবেজে জব থাকলে কিন্তু Qdrant-এ না থাকলে, অ্যাডমিন হিসেবে `/api/jobs/reindex` কল করে ভেক্টর রিক্রিয়েট করা যাবে।
- **PDF Parsing Failure**: যদি কোনো পিডিএফ পাসওয়ার্ড প্রটেক্টেড বা স্ক্যান করা ইমেজ হয়, সিস্টেম সরাসরি ইউজারের কাছে টেক্সট কপি-পেস্ট করার অনুরোধ জানাবে।

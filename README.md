# s7job-seeker 🚀
> AI-Powered Semantic & RAG Job Matching SaaS Platform

`s7job-seeker` হলো একটি আধুনিক ফুলস্ট্যাক SaaS অ্যাপ্লিকেশন, যা প্রার্থীর রেজুমি পার্স করে তার স্কিল ও অভিজ্ঞতার সাথে রিয়েল-টাইম জবের সিম্যান্টিক ম্যাচিং (Semantic Matching), স্কিল গ্যাপ অ্যানালাইসিস (Skill Gap Analysis) এবং জবের জন্য কাস্টমাইজড কভার লেটার প্রস্তুত করে।

---

## 🛠️ টেকনোলজি স্ট্যাক
- **Backend API**: ASP.NET Core Web API (.NET 9)
- **Database**: MS SQL Server (MonsterASP.net ফ্রি টিয়ার সাপোর্ট)
- **Vector DB**: Qdrant Cloud (Free Tier 1GB Cluster)
- **AI Engine**: Microsoft Semantic Kernel (.NET) + Google Gemini API (`gemini-2.0-flash` ও `text-embedding-004`)
- **Document Parser**: `PdfPig` (ক্রস-প্ল্যাটফর্ম লাইটওয়েট পিডিএফ টেক্সট এক্সট্রাকশন)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Deployment & Hosting**: MonsterASP.net (Single deployment via `wwwroot`), GitHub Actions (FTPS + Scheduled Cron)

---

## ⚡ কুইক স্টার্ট (লোকাল ডেভেলপমেন্ট)

### ১. ব্যাকএন্ড রান করা
```powershell
# API প্রজেক্ট ফোল্ডারে যান
cd src\Backend\S7JobSeeker.Api

# অ্যাপ রান করুন
dotnet run
```
API Swagger UI: `http://localhost:5000/swagger`

### ২. ফ্রন্টএন্ড রান করা (লোকাল ডেভ সার্ভার)
```powershell
cd src\Frontend
npm install
npm run dev
```

### ৩. প্রোডাকশন বিল্ড (Frontend -> Backend `wwwroot`)
```powershell
cd src\Frontend
npm run build
```

---

## ⚙️ এনভায়রনমেন্ট কনফিগারেশন (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=...;User Id=...;Password=...;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "Secret": "SuperSecretKeyForS7JobSeekerAuthenticationMustBeAtLeast32CharactersLong2026!",
    "Issuer": "s7job-seeker-api",
    "Audience": "s7job-seeker-client",
    "ExpiryDays": 7
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
    "SecretKey": "YOUR_CRON_TRIGGER_SECRET_KEY"
  }
}
```

---

## 🚀 GitHub Actions Secrets (MonsterASP.net Deployment)
GitHub রিপোজিটরির **Settings > Secrets and variables > Actions** এ নিচের ভ্যালুগুলো দিন:
- `MONSTERASP_FTP_SERVER` (MonsterASP ড্যাশবোর্ডের FTP Server Host)
- `MONSTERASP_FTP_USERNAME` (MonsterASP FTP Username)
- `MONSTERASP_FTP_PASSWORD` (MonsterASP FTP Password)
- `APP_API_URL` (যেমন: `https://yourdomain.monsterasp.net`)
- `APP_CRON_KEY` (ক্রন সিক্রেট কি)

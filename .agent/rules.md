# s7job-seeker — Agent & Development Rules (`rules.md`)

## ১. কোর আর্কিটেকচারাল প্রিন্সিপালস (Core Principles)
1. **Simplicity over Over-Engineering**: অপ্রয়োজনীয় অ্যাবস্ট্রাকশন লেয়ার তৈরি করা যাবে না। আর্কিটেকচার হবে বাস্তব রিকোয়ারমেন্ট অনুযায়ী পরিষ্কার এবং মেমোরি-অপ্টিমাইজড।
2. **Hosting Constraints First**: ব্যাকএন্ড হোস্ট হবে MonsterASP.net ফ্রি টিয়ারে (সীমিত RAM, CPU এবং শেয়ার্ড প্রসেস)। কোনো ভারী ব্যাকগ্রাউন্ড ডেমন বা মেমোরি-হাংরি ইন-মেমোরি প্রসেসিং ব্যাকএন্ডে রান করা যাবে না।
3. **Deterministic First**: যে কাজ রেগুলার এক্সপ্রেশন, সি# কোড বা এসকিউএল ফিল্টার দিয়ে করা সম্ভব, সেখানে এলএলএম (LLM) কল করা যাবে না। LLM শুধুমাত্র আনস্ট্রাকচার্ড টেক্সট পার্সিং, রিজননিং এবং রেজুমি অ্যানালাইসিসে ব্যবহৃত হবে।

---

## ২. আর্কিটেকচারাল ডিসিশন লক (Architectural Intent & Decision Locks)
নিম্নলিখিত সিদ্ধান্তগুলো সুনির্দিষ্ট টেকনিক্যাল কারণে লক করা হয়েছে। ব্যবহারকারীর পূর্ববর্তী কোনো প্রশ্নের ভিত্তিতেও এগুলো রিভার্ট বা পরিবর্তন করা যাবে না:

- **LOCK 1: External Vector Store (Qdrant Cloud Free Tier)**
  - *কারণ*: MonsterASP ফ্রি শেয়ার্ড হোস্টিংয়ে RAM ক্যাপ খুবই সীমিত। ইন-মেমোরি ভেক্টর কোসাইন সিমিলারিটি চালালে সার্ভার আউট-অব-মেমোরি ক্র্যাশ করতে পারে। তাই ভেক্টর সার্চ সবসময় ডেডিকেটেড এক্সটার্নাল স্টোরে (Qdrant Cloud) থাকবে।
- **LOCK 2: Dual Ingestion Pipeline (Automated Cron + User Paste)**
  - *কারণ*: LinkedIn বা BDJobs-এ সরাসরি ব্যাকগ্রাউন্ড স্ক্র্যাপার চালালে ক্লাউডফ্লেয়ার বা আইপি ব্লক হয়। তাই অটো-স্ক্র্যাপার শুধুমাত্র ওপেন ফ্রি জব এপিআই (Remotive, Arbeitnow, Jobicy) থেকে ডেটা আনবে, আর জটিল পোর্টালের জন্য ইউজারের "Paste & Analyze" সুবিধা বাধ্যতামূলক।
- **LOCK 3: Single Unified Deployment via `wwwroot`**
  - *কারণ*: React SPA বিল্ড হয়ে সরাসরি ASP.NET Core-এর `wwwroot`-এ যাবে। কোনো আলাদা ফ্রন্টএন্ড হোস্টিং বা ক্রস-অরিজিন (CORS) জটিলতা তৈরি করা যাবে না।
- **LOCK 4: Secure Cron Trigger via API Secret Header**
  - *কারণ*: ব্যাকগ্রাউন্ড জব সিঙ্ক ট্রিগার হবে GitHub Actions থেকে `X-Cron-Key` হেডারের মাধ্যমে। পাবলিকলি কোনো আন-অথেনটিকেটেড সিঙ্ক এন্ডপয়েন্ট এক্সপোজ করা যাবে না।

---

## ৩. কোড কোয়ালিটি ও ইঞ্জিনিয়ারিং স্ট্যান্ডার্ড

### .NET 9 & C#
- **Asynchronous Execution**: প্রতিটি I/O অপারেশনে (DB, HTTP, Vector Call) অবশ্যই `async`/`await` এবং `CancellationToken` পাস করতে হবে।
- **No Blocking Calls**: `.Result` বা `.Wait()` সম্পূর্ণ নিষিদ্ধ (Async-over-sync পরিহার্য)।
- **EF Core Optimization**:
  - রিড-অনলি কুয়েরিতে অবশ্যই `.AsNoTracking()` ব্যবহার করতে হবে।
  - N+1 কুয়েরি প্রতিরোধে প্রজেকশন (`.Select(...)`) বা স্পেসিফিক `.Include()` ব্যবহার করতে হবে।
- **Null Safety**: C# Nullable Reference Types সক্রিয় রাখতে হবে এবং ডিফেন্সিভ চেক নিশ্চিত করতে হবে।
- **Dependency Lifetimes**:
  - `DbContext`: Scoped
  - `HttpClient` / API Clients: Typed Clients via `AddHttpClient` (Transient/Singleton-safe)
  - Semantic Kernel Services: Scoped/Transient

### React & Frontend
- **Tailwind CSS & Clean UI**: কোনো ভারী থার্ড-পার্টি প্লাগিন যুক্ত করা যাবে না যা বান্ডেল সাইজ অপ্রয়োজনীয়ভাবে বাড়ায়।
- **Type Safety**: TypeScript-এ কোনো `any` টাইপ ব্যবহার করা যাবে না; প্রতিটি ডেটা রেসপন্সের সুনির্দিষ্ট ইন্টারফেস থাকতে হবে।
- **Error Boundaries**: ফ্রন্টএন্ডে নেটওয়ার্ক ফেইলিয়র বা সার্ভার ইরর হ্যান্ডেল করার জন্য স্পষ্ট স্টেট ও টোস্ট/অ্যালার্ট থাকতে হবে।

---

## ৪. সিকিউরিটি ও সিক্রেট ম্যানেজমেন্ট
1. কোনো API Key (Gemini, Qdrant, JWT Secret) হার্ডকোড করা সম্পূর্ণ নিষিদ্ধ।
2. লোকাল ডেভেলপমেন্টে `appsettings.Development.json` অথবা `dotnet user-secrets` ব্যবহার করতে হবে।
3. প্রোডাকশনে Environment Variables অথবা MonsterASP.net প্যানেল কনফিগারেশন থেকে সিক্রেট রিড করতে হবে।
4. ইউজার ইনপুট বা রেজুমি টেক্সটকে সরাসরি প্রম্পটে ইনজেক্ট করার আগে প্রম্পট ইনজেকশন প্রোটেকশন নিশ্চিত করতে হবে।

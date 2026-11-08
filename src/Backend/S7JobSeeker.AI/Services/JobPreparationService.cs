using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.AI.Services;

public class JobPreparationService : IJobPreparationService
{
    private readonly IChatCompletionService _chatCompletionService;
    private readonly ILogger<JobPreparationService> _logger;
    private readonly string _apiKey;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public JobPreparationService(
        IChatCompletionService chatCompletionService,
        IConfiguration configuration,
        ILogger<JobPreparationService> logger)
    {
        _chatCompletionService = chatCompletionService;
        _logger = logger;
        _apiKey = configuration["GeminiSettings:ApiKey"] ?? string.Empty;
    }

    public async Task<JobPrepGuideDto> GeneratePreparationGuideAsync(
        string targetRole,
        string companyName,
        string jobDescription,
        ResumeParsedProfileDto? candidateProfile,
        List<string>? missingSkills,
        CancellationToken cancellationToken = default)
    {
        var truncatedDesc = jobDescription.Length > 3000 ? jobDescription[..3000] : jobDescription;
        var candidateSkills = candidateProfile?.Skills?.Any() == true
            ? string.Join(", ", candidateProfile.Skills.Select(s => s.Name))
            : "General Computer Science fundamentals";

        var gaps = missingSkills?.Any() == true
            ? string.Join(", ", missingSkills)
            : "Domain-specific tooling, production diagnostics & assessment tests";

        var prompt = $$"""
        You are a Principal Enterprise Systems Architect and Senior Technical Interview Director.
        Generate a comprehensive, production-grade 4-Stage Interview & Assessment Preparation Master Guide for a candidate targeting the following job.

        TARGET ROLE: {{targetRole}}
        COMPANY: {{companyName}}
        CANDIDATE PROFILE:
        - Target Role: {{candidateProfile?.TargetRole ?? targetRole}}
        - Experience Level: {{candidateProfile?.TotalYearsOfExperience ?? 0}} years (Fresh Graduate / Junior)
        - Known Skills: {{candidateSkills}}
        - Identified Skill Gaps to Bridge: {{gaps}}

        JOB REQUIREMENTS & CIRCULAR DETAILS:
        \"\"\"
        {{truncatedDesc}}
        \"\"\"

        Provide an in-depth, hands-on, and role-specific preparation blueprint.
        Ensure you generate:
        1. Domain Fundamentals: Core concepts, architectural patterns, accounting/business domain principles, and candidate gap highlights.
        2. Diagnostic Labs: Real production SQL queries, Linux troubleshooting commands, and Docker operations commands with senior explanations.
        3. Mock Assessment: Real interview questions, scenario-based production troubleshooting drills, and behavioral agility questions with senior model answers.
        4. Readiness Checklist: Pre-test actions, practical drills, and resume keywords to highlight.

        Respond strictly in pure JSON matching this exact structure:
        {
          "domainFundamentals": {
            "overview": "Clear 2-3 sentence domain introduction and context.",
            "coreTopics": [
              {
                "title": "Topic title",
                "description": "Comprehensive explanation of concept.",
                "whyItMattersInRole": "Direct real-world relevance to this job."
              }
            ],
            "candidateGapHighlights": [
              "Specific topic the candidate must prioritize based on their missing skills."
            ]
          },
          "diagnosticLabs": {
            "sqlQueries": [
              {
                "scenario": "Diagnostic scenario description",
                "commandOrCode": "SELECT ... FROM ... WHERE ...;",
                "explanation": "What this query investigates and how to interpret the results.",
                "expectedOutputOrAction": "Expected outcome and follow-up action."
              }
            ],
            "linuxCommands": [
              {
                "scenario": "Log analysis / troubleshooting scenario",
                "commandOrCode": "tail -n 100 -f /var/log/... | grep -E 'ERROR|EXCEPTION'",
                "explanation": "Purpose of the command flags.",
                "expectedOutputOrAction": "Actionable interpretation."
              }
            ],
            "dockerOps": [
              {
                "scenario": "Container state inspection",
                "commandOrCode": "docker logs --tail 50 -f container_name",
                "explanation": "Container diagnostic procedure.",
                "expectedOutputOrAction": "Next troubleshooting step."
              }
            ]
          },
          "mockAssessment": {
            "technicalQuestions": [
              {
                "question": "Realistic interview test question",
                "seniorAnswerGuide": "Clear, technically rigorous model answer.",
                "commonPitfallsToAvoid": "Common mistake junior candidates make."
              }
            ],
            "scenarioTroubleshooting": [
              {
                "question": "Production incident scenario (e.g. batch process hung, database deadlock)",
                "seniorAnswerGuide": "Step-by-step diagnostic workflow.",
                "commonPitfallsToAvoid": "Premature actions or misdiagnoses."
              }
            ],
            "behavioralAgility": [
              {
                "question": "Communication, pressure handling or learning agility scenario",
                "seniorAnswerGuide": "Professional STAR response approach.",
                "commonPitfallsToAvoid": "Red flags to avoid."
              }
            ]
          },
          "readinessChecklist": {
            "preTestActions": [
              "Actionable item 1",
              "Actionable item 2"
            ],
            "practicalDrills": [
              "Hands-on drill 1",
              "Hands-on drill 2"
            ],
            "resumeKeywordsToHighlight": [
              "Keyword 1",
              "Keyword 2"
            ]
          }
        }

        Do NOT wrap in markdown code blocks. Return ONLY pure raw JSON.
        """;

        var chatHistory = new ChatHistory();
        chatHistory.AddSystemMessage("You are an enterprise technical coach and systems architect. Return only strict, valid JSON.");
        chatHistory.AddUserMessage(prompt);

        try
        {
            var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, cancellationToken: cancellationToken);
            var rawJson = response.Content?.Trim() ?? string.Empty;

            if (rawJson.StartsWith("```json", StringComparison.OrdinalIgnoreCase)) rawJson = rawJson[7..];
            if (rawJson.StartsWith("```", StringComparison.OrdinalIgnoreCase)) rawJson = rawJson[3..];
            if (rawJson.EndsWith("```", StringComparison.OrdinalIgnoreCase)) rawJson = rawJson[..^3];
            rawJson = rawJson.Trim();

            var parsed = JsonSerializer.Deserialize<JobPrepGuideDto>(rawJson, JsonOptions);
            if (parsed != null && parsed.DomainFundamentals?.CoreTopics?.Any() == true)
            {
                parsed.JobId = string.Empty;
                parsed.TargetRole = targetRole;
                parsed.CompanyName = companyName;
                parsed.CreatedAt = DateTime.UtcNow;
                parsed.ExportMarkdown = BuildExportMarkdown(targetRole, companyName, parsed);
                return parsed;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini synthesis failed or timed out. Falling back to deterministic high-fidelity role blueprint for {Role} at {Company}.", targetRole, companyName);
        }

        // Deterministic High-Fidelity Fallback Blueprint
        return GenerateDeterministicFallback(targetRole, companyName, jobDescription, missingSkills);
    }

    private static JobPrepGuideDto GenerateDeterministicFallback(
        string targetRole,
        string companyName,
        string jobDescription,
        List<string>? missingSkills)
    {
        var isBankingOrSupport = jobDescription.Contains("Banking", StringComparison.OrdinalIgnoreCase)
            || jobDescription.Contains("CBS", StringComparison.OrdinalIgnoreCase)
            || targetRole.Contains("Service", StringComparison.OrdinalIgnoreCase)
            || targetRole.Contains("Support", StringComparison.OrdinalIgnoreCase);

        var dto = new JobPrepGuideDto
        {
            TargetRole = targetRole,
            CompanyName = companyName,
            CreatedAt = DateTime.UtcNow
        };

        if (isBankingOrSupport)
        {
            dto.DomainFundamentals = new DomainFundamentalsSection
            {
                Overview = $"Core Banking Systems (CBS) operate at the intersection of high-concurrency relational databases, accounting balance invariants, and 24/7 service availability. As a {targetRole} at {companyName}, you bridge application code, database queries, and production incidents.",
                CoreTopics =
                [
                    new()
                    {
                        Title = "Double-Entry Accounting & Debit/Credit Invariants",
                        Description = "Every financial transaction comprises equal Debit and Credit postings. In CBS, assets/expenses increase with Debit; liabilities/equity/revenue increase with Credit. General Ledger (GL) balance must sum to zero at all times.",
                        WhyItMattersInRole = "CBS assessment tests almost universally test basic accounting reconciliation queries and transaction balance validation."
                    },
                    new()
                    {
                        Title = "EOD (End of Day) & BOD Batch Processing Lifecycle",
                        Description = "EOD batch jobs perform interest calculation, standing orders, trial balance generation, and ledger rollover. Failures usually stem from database lock contention, timeout, or negative balance anomalies.",
                        WhyItMattersInRole = "Production support engineers monitor, troubleshoot, and perform rollback or re-run verification for nocturnal EOD batches."
                    },
                    new()
                    {
                        Title = "L1/L2 Incident Management & SLA Escalation",
                        Description = "L1 handles initial alert triage, runbook checks, and log collection. L2 handles SQL patch scripts, container restarts, and bug isolation before escalating to L3 core engineering.",
                        WhyItMattersInRole = "Ensures high-priority banking downtime is minimized and root-cause analysis (RCA) documentation is maintained."
                    }
                ],
                CandidateGapHighlights = missingSkills?.Any() == true
                    ? missingSkills.Select(s => $"Bridge proficiency in {s} using practical diagnostic drills below.").ToList()
                    : ["Practice transactional SQL lock analysis", "Understand Double-Entry General Ledger accounting", "Linux log tailing and process monitoring"]
            };

            dto.DiagnosticLabs = new DiagnosticLabsSection
            {
                SqlQueries =
                [
                    new()
                    {
                        Scenario = "Identify Unbalanced Transactions in General Ledger",
                        CommandOrCode = "SELECT batch_id, SUM(debit_amount) AS TotalDr, SUM(credit_amount) AS TotalCr, (SUM(debit_amount) - SUM(credit_amount)) AS Discrepancy\nFROM gl_transaction_postings\nWHERE posting_date = CURRENT_DATE\nGROUP BY batch_id\nHAVING SUM(debit_amount) <> SUM(credit_amount);",
                        Explanation = "Enforces the fundamental banking accounting invariant (Debit = Credit). Any returned row indicates a ledger imbalance that blocks EOD settlement.",
                        ExpectedOutputOrAction = "Returns 0 rows under normal state. If rows return, immediately isolate the offending transaction ID and notify L2/Finance."
                    },
                    new()
                    {
                        Scenario = "Detect Active Database Deadlocks & Blocked Sessions",
                        CommandOrCode = "SELECT blocked_locks.pid AS blocked_pid, blocking_locks.pid AS blocking_pid, blocked_activity.query AS blocked_statement\nFROM pg_catalog.pg_locks blocked_locks\nJOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype\n  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database\n  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation\n  AND blocking_locks.pid != blocked_locks.pid\nJOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid;",
                        Explanation = "Reveals transactions holding row/table locks preventing downstream banking transactions or batch updates from progressing.",
                        ExpectedOutputOrAction = "Identify the blocking PID and investigate its execution duration before safely terminating if rogue."
                    }
                ],
                LinuxCommands =
                [
                    new()
                    {
                        Scenario = "Real-Time Exception & Fatal Error Log Triage",
                        CommandOrCode = "tail -n 200 -f /var/log/cbs/application.log | grep --line-buffered -E 'FATAL|ERROR|Exception|Deadlock'",
                        Explanation = "Continuously follows live logs while filtering noise to spotlight critical system exceptions and transaction rollbacks in real time.",
                        ExpectedOutputOrAction = "Captures exact stack traces and timestamps for incident tickets."
                    },
                    new()
                    {
                        Scenario = "Process Memory & High CPU Spike Investigation",
                        CommandOrCode = "ps aux --sort=-%mem | head -n 10 && free -h && netstat -tulnp | grep ':8080\\|:5432'",
                        Explanation = "Audits top 10 memory-consuming processes, checks available OS buffers/swap, and confirms whether CBS core listener ports are open and listening.",
                        ExpectedOutputOrAction = "Confirms if JVM/Worker service memory exhaustion is triggering application unresponsiveness."
                    }
                ],
                DockerOps =
                [
                    new()
                    {
                        Scenario = "Container CrashLoop & Exit Code Diagnosis",
                        CommandOrCode = "docker ps -a --filter \"status=exited\" --format \"table {{.Names}}\\t{{.Status}}\\t{{.ExitCode}}\" && docker logs --tail 100 cbs_service_container",
                        Explanation = "Displays recently exited or crashed service containers alongside the final 100 log lines detailing the termination cause (OOMKilled, failed DB connection, etc.).",
                        ExpectedOutputOrAction = "Pinpoints why container failed health checks before triggering Docker compose restart."
                    },
                    new()
                    {
                        Scenario = "Execute Interactive Shell inside Microservice Container",
                        CommandOrCode = "docker exec -it cbs_api_service /bin/sh -c \"curl -I http://localhost:8080/health && ping -c 3 postgres_db\"",
                        Explanation = "Verifies container-internal DNS resolution and network connectivity to database host without exposing container ports externally.",
                        ExpectedOutputOrAction = "Validates isolated internal networking and API availability."
                    }
                ]
            };

            dto.MockAssessment = new MockAssessmentSection
            {
                TechnicalQuestions =
                [
                    new()
                    {
                        Question = "In an accounting transaction, if an account balance is credited by 10,000 BDT, how must the offsetting entry be recorded?",
                        SeniorAnswerGuide = "Every financial posting requires an equal and opposite entry. If a customer deposit account (Liability to bank) is credited by 10,000 BDT, the corresponding entry must be a Debit of 10,000 BDT to Cash or Clearing Transit Asset account. Sum(Debit) - Sum(Credit) must equal zero.",
                        CommonPitfallsToAvoid = "Confusing personal banking debit/credit with bank ledger perspective. A customer deposit is a liability from the bank's viewpoint."
                    },
                    new()
                    {
                        Question = "How do you investigate and rollback a failed SQL data migration or patch script in production?",
                        SeniorAnswerGuide = "First, verify if the patch was wrapped inside a transactional block (`BEGIN TRANSACTION ... COMMIT`). Review database execution logs for foreign key or lock timeout failures. If uncommitted, it rolled back automatically. If partially committed in non-transactional DDL, execute the pre-tested counterpart rollback script and verify ledger balance checks.",
                        CommonPitfallsToAvoid = "Running ad-hoc UPDATE or DELETE statements directly in production without a pre-backup snapshot and transaction guard."
                    }
                ],
                ScenarioTroubleshooting =
                [
                    new()
                    {
                        Question = "Scenario: During EOD processing, batch job #804 stops at 94% with 'Database Lock Wait Timeout'. Branch tellers are waiting. What is your diagnostic procedure?",
                        SeniorAnswerGuide = "1. Check running transactions via `pg_stat_activity` / `sp_who2` to identify which PID holds exclusive locks on the affected tables.\n2. Verify if a long-running report query or uncommitted session is blocking the update.\n3. Capture the blocking query and process ID for RCA.\n4. Gracefully terminate or kill the blocking session.\n5. Verify batch #804 resumes or trigger re-run per the CBS Operations Runbook.",
                        CommonPitfallsToAvoid = "Immediately restarting the entire database server, which risks database crash recovery time and corrupts in-flight transaction states."
                    }
                ],
                BehavioralAgility =
                [
                    new()
                    {
                        Question = "How do you handle an urgent situation where a senior manager demands an immediate fix for a high-severity production issue, but standard protocol requires a checklist and manager sign-off?",
                        SeniorAnswerGuide = "Acknowledge the urgency calmly. State that following the emergency runbook checklist protects customer accounts from unintended corruption. Communicate that diagnostic steps are underway and provide an estimated ETA for the verified patch while keeping stakeholders updated every 15 minutes.",
                        CommonPitfallsToAvoid = "Panicking and bypassing safety checklists or arguing defensively under high-stress conditions."
                    }
                ]
            };

            dto.ReadinessChecklist = new ReadinessChecklistSection
            {
                PreTestActions =
                [
                    "Revise Double-Entry bookkeeping fundamentals: Assets, Liabilities, Equity, Revenue, Expense.",
                    "Practice writing SQL GROUP BY, HAVING, and JOIN queries under 5-minute time constraints.",
                    "Review Linux log manipulation commands (`grep`, `awk`, `sed`, `tail`, `journalctl`).",
                    "Understand Docker container lifecycle (`ps`, `logs`, `exec`, restart policies)."
                ],
                PracticalDrills =
                [
                    "Spin up a local PostgreSQL/SQL Server Docker container and practice creating transactions with balance checks.",
                    "Simulate an error log file and practice filtering multiline Java/C# stack traces using Bash pipes.",
                    "Draft a sample Incident Ticket & Root Cause Analysis (RCA) document describing a mock EOD batch delay."
                ],
                ResumeKeywordsToHighlight =
                [
                    "Core Banking Systems (CBS) Support",
                    "L1/L2 Incident Triage & Troubleshooting",
                    "SQL Querying & Data Migration Validation",
                    "Linux Administration & Shell Scripting",
                    "Docker Container Operations & Health Checks",
                    "EOD / BOD Batch Monitoring",
                    "Root Cause Analysis (RCA) & Runbooks"
                ]
            };
        }
        else
        {
            // Generic Software Engineer & DevOps Preparation Blueprint
            dto.DomainFundamentals = new DomainFundamentalsSection
            {
                Overview = $"{targetRole} at {companyName} requires solid data structures, database query optimization, clean code design patterns, and modern deployment diagnostics.",
                CoreTopics =
                [
                    new()
                    {
                        Title = "System Architecture & API Communication",
                        Description = "Deep understanding of RESTful API contracts, HTTP status codes, JSON serialization, and distributed error handling.",
                        WhyItMattersInRole = "Vital for integrating frontend clients, backend microservices, and external third-party gateways."
                    },
                    new()
                    {
                        Title = "Relational Database Indexing & Optimization",
                        Description = "Query execution plan analysis, index selection (B-tree, clustered/non-clustered), transaction isolation levels, and concurrency control.",
                        WhyItMattersInRole = "Eliminates N+1 query patterns and prevents high-traffic query degradation."
                    }
                ],
                CandidateGapHighlights = missingSkills?.Any() == true
                    ? missingSkills.Select(s => $"Strengthen hands-on competency in {s}.").ToList()
                    : ["Practice system design fundamentals", "Review query performance tuning"]
            };

            dto.DiagnosticLabs = new DiagnosticLabsSection
            {
                SqlQueries =
                [
                    new()
                    {
                        Scenario = "Slow Query Performance & Missing Index Detection",
                        CommandOrCode = "EXPLAIN ANALYZE SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.created_at >= NOW() - INTERVAL '7 days';",
                        Explanation = "Evaluates the database query execution plan to identify sequential table scans and join bottlenecks.",
                        ExpectedOutputOrAction = "Add composite indexes on filter and join keys to shift from Seq Scan to Index Scan."
                    }
                ],
                LinuxCommands =
                [
                    new()
                    {
                        Scenario = "Network Port & Socket Listener Audit",
                        CommandOrCode = "ss -tulpn | grep ':80\\|:443\\|:5000'",
                        Explanation = "Confirms which services are bound to web application ports and identifies port conflicts.",
                        ExpectedOutputOrAction = "Verifies web server listener readiness."
                    }
                ],
                DockerOps =
                [
                    new()
                    {
                        Scenario = "Inspect Environment Variables & Network Bridge",
                        CommandOrCode = "docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' app_container",
                        Explanation = "Extracts container runtime IP address and validates dynamic bridge network assignment.",
                        ExpectedOutputOrAction = "Diagnoses intra-container service discovery issues."
                    }
                ]
            };

            dto.MockAssessment = new MockAssessmentSection
            {
                TechnicalQuestions =
                [
                    new()
                    {
                        Question = "How do you prevent SQL Injection and ensure secure data access in your applications?",
                        SeniorAnswerGuide = "Always use parameterized queries, prepared statements, or ORM parameter binding (EF Core / Dapper). Never concatenate raw user input into SQL strings.",
                        CommonPitfallsToAvoid = "Assuming client-side input validation is sufficient without backend parameterization."
                    }
                ],
                ScenarioTroubleshooting =
                [
                    new()
                    {
                        Question = "A microservice deployment throws HTTP 502 Bad Gateway intermittently after a new release. How do you isolate the root cause?",
                        SeniorAnswerGuide = "1. Check reverse proxy logs (Nginx/IIS) for upstream connection refused errors.\n2. Check application service health checks and startup latency.\n3. Inspect CPU/Memory saturation and Docker crash logs.\n4. Verify database connection pool limits.",
                        CommonPitfallsToAvoid = "Restarting random services without checking upstream gateway error logs."
                    }
                ],
                BehavioralAgility =
                [
                    new()
                    {
                        Question = "Describe a situation where you had to quickly learn a new technology or framework under tight deadline pressure.",
                        SeniorAnswerGuide = "Follow the structured approach: identify the core 20% of concepts that drive 80% of execution, build a focused proof of concept, consult official documentation, and seek code reviews early.",
                        CommonPitfallsToAvoid = "Claiming mastery without acknowledging learning challenges."
                    }
                ]
            };

            dto.ReadinessChecklist = new ReadinessChecklistSection
            {
                PreTestActions =
                [
                    "Review standard algorithms and complexity analysis (Time & Space O(n)).",
                    "Review API design best practices and HTTP status code standards.",
                    "Practice live coding and debugging with clean commit history."
                ],
                PracticalDrills =
                [
                    "Build a small CRUD API service with unit tests and Dockerfile containerization.",
                    "Practice diagnosing a deliberate deadlock or unindexed slow query in a test database."
                ],
                ResumeKeywordsToHighlight =
                [
                    "RESTful API Architecture",
                    "Relational Database Query Optimization",
                    "Automated Testing & CI/CD",
                    "Containerization (Docker)",
                    "Production Diagnostic & Incident Troubleshooting"
                ]
            };
        }

        dto.ExportMarkdown = BuildExportMarkdown(targetRole, companyName, dto);
        return dto;
    }

    private static string BuildExportMarkdown(string role, string company, JobPrepGuideDto dto)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"# AI Career Prep & Interview Master Guide: {role}");
        sb.AppendLine($"**Target Company:** {company} | **Generated by teamS7 Intelligence**");
        sb.AppendLine($"**Date:** {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC\n");

        sb.AppendLine("---");
        sb.AppendLine("## 1. Domain & Core Fundamentals");
        sb.AppendLine(dto.DomainFundamentals.Overview);
        sb.AppendLine();
        foreach (var topic in dto.DomainFundamentals.CoreTopics)
        {
            sb.AppendLine($"### 🔹 {topic.Title}");
            sb.AppendLine(topic.Description);
            sb.AppendLine($"*Why It Matters in this Role:* {topic.WhyItMattersInRole}\n");
        }

        if (dto.DomainFundamentals.CandidateGapHighlights?.Any() == true)
        {
            sb.AppendLine("#### ⚠️ Candidate Skill Gap Priorities:");
            foreach (var gap in dto.DomainFundamentals.CandidateGapHighlights)
            {
                sb.AppendLine($"- {gap}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("---");
        sb.AppendLine("## 2. Technical Diagnostic Labs & Command Recipes");
        
        sb.AppendLine("### 📊 SQL Diagnostics & Integrity Queries");
        foreach (var sql in dto.DiagnosticLabs.SqlQueries)
        {
            sb.AppendLine($"**Scenario: {sql.Scenario}**");
            sb.AppendLine("```sql");
            sb.AppendLine(sql.CommandOrCode);
            sb.AppendLine("```");
            sb.AppendLine($"*Explanation:* {sql.Explanation}");
            sb.AppendLine($"*Actionable Output:* {sql.ExpectedOutputOrAction}\n");
        }

        sb.AppendLine("### 🐧 Linux Operational & Log Triage Commands");
        foreach (var lnx in dto.DiagnosticLabs.LinuxCommands)
        {
            sb.AppendLine($"**Scenario: {lnx.Scenario}**");
            sb.AppendLine("```bash");
            sb.AppendLine(lnx.CommandOrCode);
            sb.AppendLine("```");
            sb.AppendLine($"*Explanation:* {lnx.Explanation}");
            sb.AppendLine($"*Actionable Output:* {lnx.ExpectedOutputOrAction}\n");
        }

        sb.AppendLine("### 🐳 Docker & Container Diagnostics");
        foreach (var dck in dto.DiagnosticLabs.DockerOps)
        {
            sb.AppendLine($"**Scenario: {dck.Scenario}**");
            sb.AppendLine("```bash");
            sb.AppendLine(dck.CommandOrCode);
            sb.AppendLine("```");
            sb.AppendLine($"*Explanation:* {dck.Explanation}");
            sb.AppendLine($"*Actionable Output:* {dck.ExpectedOutputOrAction}\n");
        }

        sb.AppendLine("---");
        sb.AppendLine("## 3. Mock Assessment & Production Scenarios");
        
        sb.AppendLine("### 🎙️ Technical Interview Questions");
        foreach (var q in dto.MockAssessment.TechnicalQuestions)
        {
            sb.AppendLine($"**Q: {q.Question}**");
            sb.AppendLine($"*Senior Answer:* {q.SeniorAnswerGuide}");
            sb.AppendLine($"*Avoid:* {q.CommonPitfallsToAvoid}\n");
        }

        sb.AppendLine("### 🚨 Production Incident Scenarios");
        foreach (var s in dto.MockAssessment.ScenarioTroubleshooting)
        {
            sb.AppendLine($"**Incident: {s.Question}**");
            sb.AppendLine($"*Resolution Workflow:* {s.SeniorAnswerGuide}");
            sb.AppendLine($"*Pitfalls:* {s.CommonPitfallsToAvoid}\n");
        }

        sb.AppendLine("---");
        sb.AppendLine("## 4. Final Readiness & Revision Checklist");
        sb.AppendLine("### 📋 Pre-Test Actions");
        foreach (var a in dto.ReadinessChecklist.PreTestActions)
        {
            sb.AppendLine($"- [ ] {a}");
        }
        sb.AppendLine("\n### 🛠️ Practical Drills");
        foreach (var d in dto.ReadinessChecklist.PracticalDrills)
        {
            sb.AppendLine($"- [ ] {d}");
        }
        sb.AppendLine("\n### 🎯 Resume Keywords to Highlight");
        foreach (var k in dto.ReadinessChecklist.ResumeKeywordsToHighlight)
        {
            sb.AppendLine($"- **{k}**");
        }

        return sb.ToString();
    }
}

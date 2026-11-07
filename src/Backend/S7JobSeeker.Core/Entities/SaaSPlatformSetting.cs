namespace S7JobSeeker.Core.Entities;

public class SaaSPlatformSetting
{
    public int Id { get; set; } = 1;
    public string BkashNumber { get; set; } = "017XXXXXXXX (Personal/Send Money)";
    public string NagadNumber { get; set; } = "017XXXXXXXX (Personal/Send Money)";
    public string RocketNumber { get; set; } = "017XXXXXXXX (Personal/Send Money)";
    public string PaymentInstructions { get; set; } = "বিকাশ বা নগদ সেন্ড মানি করে TrxID ও প্রেরক নম্বর নিচে সাবমিট করুন। অ্যাডমিন ভেরিফাই করে ক্রেডিট অনুমোদন করবেন।";
    public int WelcomeCredits { get; set; } = 20;
    public int TrialDays { get; set; } = 30;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

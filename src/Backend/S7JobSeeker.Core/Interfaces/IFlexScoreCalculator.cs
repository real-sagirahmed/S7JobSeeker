using S7JobSeeker.Core.DTOs;

namespace S7JobSeeker.Core.Interfaces;

public interface IFlexScoreCalculator
{
    FlexScoreResult CalculateFlexScore(string? location, string? description, bool isRemote);
}

namespace MazeServer.Data.Entities;

public record LeaderboardEntry(string Name, double FinishTimeMs, DateTime RecordedAtUtc);
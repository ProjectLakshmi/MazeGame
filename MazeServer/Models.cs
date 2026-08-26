namespace MazeServer;

public class RacePlayer
{
    public required string ConnectionId { get; set; }
    public required string Name { get; set; }
    public bool Ready { get; set; }
    public bool Finished { get; set; }
    public double? FinishTimeMs { get; set; }
    public int Row { get; set; }
    public int Col { get; set; }
}

public class RaceRoom
{
    public required string Code { get; set; }
    public required string HostConnectionId { get; set; }
    public int RoomsWide { get; set; } = 6;
    public int RoomsHigh { get; set; } = 6;
    public int Seed { get; set; }
    public bool Started { get; set; }
    public DateTime? RaceStartUtc { get; set; }
    public Dictionary<string, RacePlayer> Players { get; set; } = new();
}

public record PlayerDto(string ConnectionId, string Name, bool Ready, bool Finished, double? FinishTimeMs);

public record RoomStateDto(string Code, string HostConnectionId, bool Started, List<PlayerDto> Players);

public record RaceStartingDto(int Seed, int RoomsWide, int RoomsHigh, DateTime RaceStartUtc);

public record PlayerMovedDto(string ConnectionId, int Row, int Col);

public record RaceOverDto(List<PlayerDto> Rankings);
using MazeServer;
using System.Collections.Concurrent;

namespace MazeServer;

public class RoomManager
{
    private readonly ConcurrentDictionary<string, RaceRoom> _rooms = new();
    private static readonly string CodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 

    public RaceRoom CreateRoom(string hostConnectionId, string hostName)
    {
        string code;
        do
        {
            code = GenerateCode();
        } while (_rooms.ContainsKey(code));

        var room = new RaceRoom
        {
            Code = code,
            HostConnectionId = hostConnectionId,
        };
        room.Players[hostConnectionId] = new RacePlayer
        {
            ConnectionId = hostConnectionId,
            Name = hostName,
            Ready = false,
        };

        _rooms[code] = room;
        return room;
    }

    public RaceRoom? GetRoom(string code) =>
        _rooms.TryGetValue(code.ToUpperInvariant(), out var room) ? room : null;

    public bool TryAddPlayer(string code, string connectionId, string name, out RaceRoom? room)
    {
        room = GetRoom(code);
        if (room is null || room.Started) return false;

        room.Players[connectionId] = new RacePlayer
        {
            ConnectionId = connectionId,
            Name = name,
            Ready = false,
        };
        return true;
    }

    // Returns the room the connection was removed from, and whether it's now empty
    public (RaceRoom? room, bool becameEmpty) RemovePlayer(string connectionId)
    {
        foreach (var room in _rooms.Values)
        {
            if (room.Players.Remove(connectionId))
            {
                if (room.Players.Count == 0)
                {
                    _rooms.TryRemove(room.Code, out _);
                    return (room, true);
                }
                // If the host left, promote the next player as host
                if (room.HostConnectionId == connectionId)
                {
                    room.HostConnectionId = room.Players.Keys.First();
                }
                return (room, false);
            }
        }
        return (null, false);
    }

    private static string GenerateCode()
    {
        var rng = Random.Shared;
        return new string(Enumerable.Range(0, 5).Select(_ => CodeChars[rng.Next(CodeChars.Length)]).ToArray());
    }

    public static RoomStateDto ToDto(RaceRoom room) => new(
        room.Code,
        room.HostConnectionId,
        room.Started,
        room.Players.Values.Select(ToPlayerDto).ToList()
    );

    public static PlayerDto ToPlayerDto(RacePlayer p) => new(p.ConnectionId, p.Name, p.Ready, p.Finished, p.FinishTimeMs);
}
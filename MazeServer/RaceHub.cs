using MazeServer;
using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;

namespace MazeServer;

public class RaceHub : Hub
{
    private readonly RoomManager _rooms;

    public RaceHub(RoomManager rooms)
    {
        _rooms = rooms;
    }

    public async Task<string> CreateRoom(string playerName)
    {
        var room = _rooms.CreateRoom(Context.ConnectionId, SanitizeName(playerName));
        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        await Clients.Group(room.Code).SendAsync("RoomUpdated", RoomManager.ToDto(room));
        return room.Code;
    }

    public async Task JoinRoom(string code, string playerName)
    {
        if (!_rooms.TryAddPlayer(code, Context.ConnectionId, SanitizeName(playerName), out var room) || room is null)
        {
            await Clients.Caller.SendAsync("JoinError", "That room code doesn't exist or the race already started.");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        await Clients.Group(room.Code).SendAsync("RoomUpdated", RoomManager.ToDto(room));
    }

    public async Task ToggleReady(string code)
    {
        var room = _rooms.GetRoom(code);
        if (room is null || !room.Players.TryGetValue(Context.ConnectionId, out var player)) return;

        player.Ready = !player.Ready;
        await Clients.Group(room.Code).SendAsync("RoomUpdated", RoomManager.ToDto(room));
    }

    public async Task StartRace(string code)
    {
        var room = _rooms.GetRoom(code);
        if (room is null) return;
        if (room.HostConnectionId != Context.ConnectionId)
        {
            await Clients.Caller.SendAsync("JoinError", "Only the host can start the race.");
            return;
        }
        if (room.Players.Count < 1 || room.Players.Values.Any(p => !p.Ready))
        {
            await Clients.Caller.SendAsync("JoinError", "Everyone needs to be ready first.");
            return;
        }

        room.Seed = Random.Shared.Next();
        room.Started = true;
        // Give every client the same future timestamp to count down to, so
        // the race starts in sync regardless of small network latency differences
        room.RaceStartUtc = DateTime.UtcNow.AddSeconds(3);

        foreach (var p in room.Players.Values)
        {
            p.Finished = false;
            p.FinishTimeMs = null;
        }

        await Clients.Group(room.Code).SendAsync("RaceStarting",
            new RaceStartingDto(room.Seed, room.RoomsWide, room.RoomsHigh, room.RaceStartUtc.Value));
    }

    // Throttle this on the client side (e.g. every ~100ms) — the hub doesn't
    // rate-limit itself, so a misbehaving client could flood the group otherwise
    public async Task ReportProgress(string code, int row, int col)
    {
        var room = _rooms.GetRoom(code);
        if (room is null || !room.Players.TryGetValue(Context.ConnectionId, out var player)) return;

        player.Row = row;
        player.Col = col;
        await Clients.OthersInGroup(room.Code).SendAsync("PlayerMoved",
            new PlayerMovedDto(Context.ConnectionId, row, col));
    }

    public async Task ReportFinish(string code, double elapsedMs)
    {
        var room = _rooms.GetRoom(code);
        if (room is null || !room.Players.TryGetValue(Context.ConnectionId, out var player)) return;
        if (player.Finished) return; // ignore duplicate finish reports

        player.Finished = true;
        player.FinishTimeMs = elapsedMs;

        await Clients.Group(room.Code).SendAsync("RoomUpdated", RoomManager.ToDto(room));

        if (room.Players.Values.All(p => p.Finished))
        {
            var rankings = room.Players.Values
                .OrderBy(p => p.FinishTimeMs)
                .Select(RoomManager.ToPlayerDto)
                .ToList();
            await Clients.Group(room.Code).SendAsync("RaceOver", new RaceOverDto(rankings));
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var (room, becameEmpty) = _rooms.RemovePlayer(Context.ConnectionId);
        if (room is not null && !becameEmpty)
        {
            await Clients.Group(room.Code).SendAsync("RoomUpdated", RoomManager.ToDto(room));
        }
        await base.OnDisconnectedAsync(exception);
    }

    private static string SanitizeName(string name)
    {
        var trimmed = string.IsNullOrWhiteSpace(name) ? "Player" : name.Trim();
        return trimmed.Length > 16 ? trimmed[..16] : trimmed;
    }
}
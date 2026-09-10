using MazeServer.Data.Services;

namespace MazeServer.Endpoints;

public record LevelProgressRequest(int LevelIndex, int Stars, int Moves, double Seconds);
public record EndlessRequest(int Depth);

public static class PlayerProgressEndpoints
{
    public static void MapPlayerProgressEndpoints(this WebApplication app)
    {
        app.MapGet("/api/progress/{playerId}", (string playerId, PlayerProgressService service) =>
            Results.Ok(service.GetFullProgress(playerId)));

        app.MapPost("/api/progress/{playerId}/level", (string playerId, LevelProgressRequest req, PlayerProgressService service) =>
        {
            service.SubmitLevelResult(playerId, req.LevelIndex, req.Stars, req.Moves, req.Seconds);
            return Results.Ok();
        });

        app.MapPost("/api/progress/{playerId}/endless", (string playerId, EndlessRequest req, PlayerProgressService service) =>
        {
            var best = service.SubmitEndlessDepth(playerId, req.Depth);
            return Results.Ok(new { best });
        });
    }
}
using MazeServer.Data.Services;

namespace MazeServer.Data.Endpoints
{
    public static  class LeaderboardEndpoints
    {
        public static void MapLeaderboardEndpoints(this WebApplication app)
        {
            app.MapGet("/api/leaderboard", (LeaderboardService service) =>
                Results.Ok(service.GetTopEntries(20)));
        }
    }
}

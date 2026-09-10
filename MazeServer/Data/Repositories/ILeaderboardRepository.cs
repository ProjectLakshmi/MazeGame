using MazeServer.Data.Entities;

namespace MazeServer.Data.Repositories
{
    public interface ILeaderboardRepository
    {
        void Add(string name, double finishTimeMs);
        List<LeaderboardEntry> GetTop(int limit);
    }
}

using MazeServer.Data.Entities;
using MazeServer.Data.Repositories;

namespace MazeServer.Data.Services
{
    public class LeaderboardService
    {
        private readonly ILeaderboardRepository _repo;
        public LeaderboardService(ILeaderboardRepository repo)
        {
            _repo = repo;
        }
        public void RecordFinish(string name, double finishTimeMs) => _repo.Add(name, finishTimeMs);
        public List<LeaderboardEntry> GetTopEntries(int limit = 20) => _repo.GetTop(limit);
    }
}

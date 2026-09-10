using MazeServer.Data.Repositories;

namespace MazeServer.Data.Services
{
    public class PlayerProgressService
    {
        private readonly IPlayerProgressRepository _repo;
        public PlayerProgressService(IPlayerProgressRepository repo)
        {
            _repo = repo;
        }
        public void SubmitLevelResult(string playerId, int levelIndex, int stars, int moves, double seconds)
        {
            var existingStars = _repo.GetStars(playerId, levelIndex);
            if (existingStars is null || stars > existingStars)
            {
                _repo.UpsertLevel(playerId, levelIndex, stars, moves, seconds);
            }
            _repo.UpsertLastLevel(playerId, levelIndex);
        }

        public int SubmitEndlessDepth(string playerId, int depth)
        {
            var currentBest = _repo.GetEndLessBest(playerId) ?? 0;
            var newBest = Math.Max(currentBest, depth);
            if (newBest > currentBest)
            {
                _repo.UpsertEndlessbest(playerId, newBest);
            }
            return newBest;
        }

        public object GetFullProgress(string playerId)
        {
            var levels = _repo.GeAllLevels(playerId);
            var meta = _repo.GetMeta(playerId);
            return new { progress = levels, lastLevel = meta.LastLevel, endlessBest = meta.EndlessBest };
        }
    }
}

using MazeServer.Data.Entities;

namespace MazeServer.Data.Repositories
{
    public interface IPlayerProgressRepository
    {
        int? GetStars(string playerId, int levelIndex);
        void UpsertLevel(string playerId, int levelIndex, int stars, int moves, double seconds);
        Dictionary<int, PlayerProgressRecord> GeAllLevels(string playerId);
        void UpsertLastLevel(string playerId, int levelIndex);
        int? GetEndLessBest(string playerId);

        void UpsertEndlessbest(string playerId, int best);
        PlayerMetaRecord GetMeta(string playerId);

    }
}

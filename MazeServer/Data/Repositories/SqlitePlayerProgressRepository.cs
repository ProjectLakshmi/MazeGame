using MazeServer.Data.Entities;
using Microsoft.Data.Sqlite;

namespace MazeServer.Data.Repositories
{
    public class SqlitePlayerProgressRepository : IPlayerProgressRepository
    {
        private readonly string _connectionString;

        public SqlitePlayerProgressRepository(string connectionString)
        {
            _connectionString = connectionString;
        }
        public int? GetStars(string playerId, int levelIndex)
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT Stars FROM PlayerProgress WHERE PlayerId = $pid AND LevelIndex = $lvl;";
            cmd.Parameters.AddWithValue("$pid", playerId);
            cmd.Parameters.AddWithValue("$lvl", levelIndex);
            var result = cmd.ExecuteScalar();
            return result != null ? Convert.ToInt32(result) : null;
        }
        public void UpsertLevel(string playerId, int levelIndex, int stars, int moves, double seconds)
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = """
            INSERT INTO PlayerProgress (PlayerId, LevelIndex, Stars, Moves, Seconds)
            VALUES ($pid, $lvl, $stars, $moves, $seconds)
            ON CONFLICT(PlayerId, LevelIndex) DO UPDATE SET
                Stars = excluded.Stars, Moves = excluded.Moves, Seconds = excluded.Seconds;
            """;
            cmd.Parameters.AddWithValue("$pid", playerId);
            cmd.Parameters.AddWithValue("$lvl", levelIndex);
            cmd.Parameters.AddWithValue("$stars", stars);
            cmd.Parameters.AddWithValue("$moves", moves);
            cmd.Parameters.AddWithValue("$seconds", seconds);
            cmd.ExecuteNonQuery();
        }

        public Dictionary<int, PlayerProgressRecord> GeAllLevels(string playerId)
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT LevelIndex, Stars, Moves, Seconds FROM PlayerProgress WHERE PlayerId = $pid;";
            cmd.Parameters.AddWithValue("$pid", playerId);

            var result = new Dictionary<int, PlayerProgressRecord>();
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                var record = new PlayerProgressRecord(reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetDouble(3));
                result[record.LevelIndex] = record;
            }
            return result;
        }

        public void UpsertLastLevel(string playerId, int levelIndex)
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = """
            INSERT INTO PlayerMeta (PlayerId, LastLevel, EndlessBest)
            VALUES ($pid, $lvl, 0)
            ON CONFLICT(PlayerId) DO UPDATE SET LastLevel = excluded.LastLevel;
            """;
            cmd.Parameters.AddWithValue("$pid", playerId);
            cmd.Parameters.AddWithValue("$lvl", levelIndex);
            cmd.ExecuteNonQuery();
        }

        public int? GetEndLessBest(string playerId)
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT EndlessBest FROM PlayerMeta WHERE PlayerId = $pid;";
            cmd.Parameters.AddWithValue("$pid", playerId);
            var result = cmd.ExecuteScalar();
            return result != null ? Convert.ToInt32(result) : null;
        }

        public void UpsertEndlessbest(string playerId, int best)
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = """
            INSERT INTO PlayerMeta (PlayerId, LastLevel, EndlessBest)
            VALUES ($pid, 0, $best)
            ON CONFLICT(PlayerId) DO UPDATE SET EndlessBest = excluded.EndlessBest;
            """;
            cmd.Parameters.AddWithValue("$pid", playerId);
            cmd.Parameters.AddWithValue("$best", best);
            cmd.ExecuteNonQuery();
        }

        public PlayerMetaRecord GetMeta(string playerId)
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT LastLevel, EndlessBest FROM PlayerMeta WHERE PlayerId = $pid;";
            cmd.Parameters.AddWithValue("$pid", playerId);
            using var reader = cmd.ExecuteReader();
            return reader.Read() ? new PlayerMetaRecord(reader.GetInt32(0), reader.GetInt32(1)) : new PlayerMetaRecord(0, 0);
        }
    }
}

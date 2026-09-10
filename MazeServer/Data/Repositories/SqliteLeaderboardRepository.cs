using MazeServer.Data.Entities;
using Microsoft.Data.Sqlite;

namespace MazeServer.Data.Repositories
{
    public class sqliteLeaderboardRepository : ILeaderboardRepository
    {
        private readonly string _connectionString;
        public sqliteLeaderboardRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public void Add(string name, double finishTimeMs)
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = """
            INSERT INTO LeaderboardEntries (Name, FinishTimeMs, RecordedAtUtc)
            VALUES ($name, $time, $recordedAt);
            """;
            cmd.Parameters.AddWithValue("$name", name);
            cmd.Parameters.AddWithValue("$time", finishTimeMs);
            cmd.Parameters.AddWithValue("$recordedAt", DateTime.UtcNow.ToString("O"));
            cmd.ExecuteNonQuery();
        }

        public List<LeaderboardEntry> GetTop(int limit)
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = """
            SELECT Name, FinishTimeMs, RecordedAtUtc
            FROM LeaderboardEntries ORDER BY FinishTimeMs ASC LIMIT $limit;
            """;
            cmd.Parameters.AddWithValue("$limit", limit);

            var results = new List<LeaderboardEntry>();
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                results.Add(new LeaderboardEntry(reader.GetString(0), reader.GetDouble(1), DateTime.Parse(reader.GetString(2))));
            return results;
        }
    }
}

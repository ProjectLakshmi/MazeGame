using Microsoft.Data.Sqlite;

namespace MazeServer.Data
{
    public class DbInitializer
    {
        private readonly string _connectionString;

        public DbInitializer(string connectionString)
        {
            _connectionString = connectionString;
        }

        public void EnsureCreated()
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS LeaderboardEntries (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                FinishTimeMs REAL NOT NULL,
                RecordedAtUtc TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS PlayerProgress (
                PlayerId TEXT NOT NULL,
                LevelIndex INTEGER NOT NULL,
                Stars INTEGER NOT NULL,
                Moves INTEGER NOT NULL,
                Seconds REAL NOT NULL,
                PRIMARY KEY (PlayerId, LevelIndex)
            );

            CREATE TABLE IF NOT EXISTS PlayerMeta (
                PlayerId TEXT PRIMARY KEY,
                LastLevel INTEGER NOT NULL DEFAULT 0,
                EndlessBest INTEGER NOT NULL DEFAULT 0
            );
            """;
            cmd.ExecuteNonQuery();
        }
    }
}

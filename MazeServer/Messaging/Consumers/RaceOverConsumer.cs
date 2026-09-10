using MazeServer.Data.Services;
using MazeServer.Messaging.Abstractions;
using System.Text.Json;

namespace MazeServer.Messaging.Consumers
{
    public class RaceOverConsumer
    {
        private readonly IMessageConsumer _consumer;
        private readonly LeaderboardService _leaderboardService;

        public RaceOverConsumer(IMessageConsumer consumer, LeaderboardService leaderboardService)
        {
            _consumer = consumer;
            _leaderboardService = leaderboardService;
        }

        public void StartListening()
        {
            _consumer.Subscribe(
                queueName: "leaderboard_queue",
                routingKey: "race.completed",
                onMessageReceived: HandleMessage);
        }

        private void HandleMessage(string json)
        {
            var raceOverDto = JsonSerializer.Deserialize<RaceOverDto>(json);
            if (raceOverDto is null) return;

            Console.WriteLine($"[RaceOverConsumer] Race finished with {raceOverDto.Rankings.Count} players.");

            foreach (var player in raceOverDto.Rankings)
            {
                _leaderboardService.RecordFinish(player.Name, player.FinishTimeMs!.Value);
            }
            Console.WriteLine($"[RaceOverConsumer] Saved {raceOverDto.Rankings.Count} results to leaderboard.");
        }
    }
    }


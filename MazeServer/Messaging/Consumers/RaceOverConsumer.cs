using MazeServer.Messaging.Abstractions;
using System.Text.Json;

namespace MazeServer.Messaging.Consumers
{
    public class RaceOverConsumer
    {
        private readonly IMessageConsumer _consumer;

        public RaceOverConsumer(IMessageConsumer consumer)
        {
            _consumer = consumer;
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
                Console.WriteLine($"  {player.Name}: {player.FinishTimeMs}ms");
            }
        }
    }
}

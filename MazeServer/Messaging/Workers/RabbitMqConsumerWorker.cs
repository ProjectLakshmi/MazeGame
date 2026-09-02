using Microsoft.Extensions.Hosting;
using MazeServer.Messaging.Consumers;

namespace MazeServer.Messaging.Workers
{
    public class RabbitMqConsumerWorker: BackgroundService
    {
        private readonly RaceOverConsumer _raceOverConsumer;

        public RabbitMqConsumerWorker(RaceOverConsumer raceOverConsumer)
        {
            _raceOverConsumer = raceOverConsumer;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _raceOverConsumer.StartListening();
            return Task.CompletedTask;
        }
    }
}

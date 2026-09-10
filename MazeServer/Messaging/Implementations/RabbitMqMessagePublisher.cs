//using MazeServer.Messaging.Abstractions;
//using Microsoft.AspNetCore.Mvc.ModelBinding;
//using RabbitMQ.Client;
//using Microsoft.Extensions.Options;
//using System.Text;
//using System.Text.Json;

//namespace MazeServer.Messaging.Implementations
//{
//    public class RabbitMqMessagePublisher : IMessagePublisher , IDisposable
//    {
//        private readonly IConnection _connection;
//        private readonly IModel _channel;
//        private readonly string _exchange;

//        public RabbitMqMessagePublisher(IOptions<RabbitMqOptions> options)
//        {
//            var config = options.Value;
//            _exchange = config.Exchange;

//            var factory = new ConnectionFactory
//            {
//                HostName = config.HostName,
//                Port = config.Port,
//                UserName = config.UserName,
//                Password = config.Password
//            };

//            _connection = factory.CreateConnection();
//            _channel = _connection.CreateModel();

//            _channel.ExchangeDeclare(_exchange, ExchangeType.Topic, durable: true);

//        }
//        public void Publish<T>(T message, string routingKey)
//        {
//            var json = JsonSerializer.Serialize(message);
//            var body = Encoding.UTF8.GetBytes(json);

//            var properties = _channel.CreateBasicProperties();
//            properties.Persistent = true;

//            _channel.BasicPublish(
//                exchange: _exchange,
//                routingKey: routingKey,
//                basicProperties: properties,
//                body: body
//                );
//        }
//        public void Dispose()
//        {
//            _channel?.Close();
//            _connection?.Close();
//        }
//    }
//}
/* Without using RabbitMq */
using MazeServer.Messaging.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using RabbitMQ.Client;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;

namespace MazeServer.Messaging.Implementations
{
    public class RabbitMqMessagePublisher : IMessagePublisher, IDisposable
    {
        private readonly IConnection? _connection;
        private readonly IModel? _channel;
        private readonly string _exchange;
        private readonly bool _isAvailable;
        private readonly ILogger<RabbitMqMessagePublisher> _logger;

        public RabbitMqMessagePublisher(IOptions<RabbitMqOptions> options, ILogger<RabbitMqMessagePublisher> logger)
        {
            _logger = logger;
            var config = options.Value;
            _exchange = config.Exchange;

            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = config.HostName,
                    Port = config.Port,
                    UserName = config.UserName,
                    Password = config.Password
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                _channel.ExchangeDeclare(_exchange, ExchangeType.Topic, durable: true);

                _isAvailable = true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "RabbitMQ unavailable at startup — publishing disabled, app will continue without it.");
                _connection = null;
                _channel = null;
                _isAvailable = false;
            }
        }

        public void Publish<T>(T message, string routingKey)
        {
            if (!_isAvailable || _channel == null)
            {
                _logger.LogWarning("Publish skipped for routing key '{RoutingKey}' — RabbitMQ is not connected.", routingKey);
                return;
            }

            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;

            _channel.BasicPublish(
                exchange: _exchange,
                routingKey: routingKey,
                basicProperties: properties,
                body: body
                );
        }

        public void Dispose()
        {
            _channel?.Close();
            _connection?.Close();
        }
    }
}
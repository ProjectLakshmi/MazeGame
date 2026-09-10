//using MazeServer.Messaging.Abstractions;
//using Microsoft.AspNetCore.Mvc.ModelBinding;
//using RabbitMQ.Client;
//using Microsoft.Extensions.Options;
//using System.Text;
//using System.Text.Json;
//using Microsoft.AspNetCore.Mvc.ActionConstraints;
//using RabbitMQ.Client.Events;
//using Microsoft.AspNetCore.Connections;

//namespace MazeServer.Messaging.Implementations
//{
//    public class RabbitMqMessageConsumer :IMessageConsumer, IDisposable
//    {
//        private readonly IConnection _connection;
//        private readonly IModel _channel;
//        private readonly string _exchange;

//        public RabbitMqMessageConsumer(IOptions<RabbitMqOptions> options)
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

//        public void Subscribe(string queueName, string routingKey, Action<string> onMessageRecieved)
//        {
//            _channel.QueueDeclare(queueName, durable: true, exclusive: false, autoDelete: false);
//            _channel.QueueBind(queueName, _exchange, routingKey);

//            var consumer = new EventingBasicConsumer(_channel);
//            consumer.Received += (modal, ea) =>
//            {
//                var body = ea.Body.ToArray();
//                var messsage = Encoding.UTF8.GetString(body);

//                onMessageRecieved(messsage);

//                _channel.BasicAck(ea.DeliveryTag, multiple: false);
//            };
//           _channel.BasicConsume(queueName, autoAck: false, consumer);
//        }
//        public void Dispose()
//        {
//            _channel?.Close();
//            _connection?.Close();
//        }
//    }
//}


/* Without Using RabbitMq */
using MazeServer.Messaging.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using RabbitMQ.Client;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.ActionConstraints;
using RabbitMQ.Client.Events;
using Microsoft.AspNetCore.Connections;

namespace MazeServer.Messaging.Implementations
{
    public class RabbitMqMessageConsumer : IMessageConsumer, IDisposable
    {
        private readonly IConnection? _connection;
        private readonly IModel? _channel;
        private readonly string _exchange;
        private readonly bool _isAvailable;
        private readonly ILogger<RabbitMqMessageConsumer> _logger;

        public RabbitMqMessageConsumer(IOptions<RabbitMqOptions> options, ILogger<RabbitMqMessageConsumer> logger)
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
                _logger.LogWarning(ex, "RabbitMQ unavailable at startup — real-time messaging disabled, app will continue without it.");
                _connection = null;
                _channel = null;
                _isAvailable = false;
            }
        }

        public void Subscribe(string queueName, string routingKey, Action<string> onMessageRecieved)
        {
            if (!_isAvailable || _channel == null)
            {
                _logger.LogWarning("Subscribe skipped for queue '{QueueName}' — RabbitMQ is not connected.", queueName);
                return;
            }

            _channel.QueueDeclare(queueName, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueBind(queueName, _exchange, routingKey);

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += (modal, ea) =>
            {
                var body = ea.Body.ToArray();
                var messsage = Encoding.UTF8.GetString(body);

                onMessageRecieved(messsage);

                _channel.BasicAck(ea.DeliveryTag, multiple: false);
            };
            _channel.BasicConsume(queueName, autoAck: false, consumer);
        }

        public void Dispose()
        {
            _channel?.Close();
            _connection?.Close();
        }
    }
}
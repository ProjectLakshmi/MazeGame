namespace MazeServer.Messaging.Abstractions
{
    public interface IMessageConsumer
    {
        void Subscribe(string queueName, string routingKey, Action<string> onMessageReceived);
    }
}

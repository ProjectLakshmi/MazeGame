namespace MazeServer.Messaging.Abstractions
{
    public interface IMessagePublisher
    {
        void Publish<T>(T message, string routingKey);
    }
}

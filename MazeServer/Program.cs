
using MazeServer;
using MazeServer.Messaging;
using MazeServer.Messaging.Abstractions;
using MazeServer.Messaging.Consumers;
using MazeServer.Messaging.Implementations;
using MazeServer.Messaging.Workers;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddSignalR();
builder.Services.AddSingleton<RoomManager>();
builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));

builder.Services.AddSingleton<IMessagePublisher, RabbitMqMessagePublisher>();
builder.Services.AddSingleton<IMessageConsumer, RabbitMqMessageConsumer>();
builder.Services.AddSingleton<RaceOverConsumer>();
builder.Services.AddHostedService<RabbitMqConsumerWorker>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("VueClient", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                "https://maze-game-khaki-five.vercel.app" 
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("VueClient");
app.MapHub<RaceHub>("/racehub");
app.MapGet("/", () => "Maze Race server is running.");

app.Run();
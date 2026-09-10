
using MazeServer;
using MazeServer.Data;
using MazeServer.Data.Endpoints;
using MazeServer.Data.Repositories;
using MazeServer.Data.Services;
using MazeServer.Endpoints;
using MazeServer.Messaging;
using MazeServer.Messaging.Abstractions;
using MazeServer.Messaging.Consumers;
using MazeServer.Messaging.Implementations;
using MazeServer.Messaging.Workers;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
var connectionString = "Data source=gamedata.db";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddSingleton(new DbInitializer(connectionString));
builder.Services.AddSingleton<ILeaderboardRepository>(new sqliteLeaderboardRepository(connectionString));
builder.Services.AddSingleton<IPlayerProgressRepository>(new SqlitePlayerProgressRepository(connectionString));
builder.Services.AddSingleton<LeaderboardService>();
builder.Services.AddSingleton<PlayerProgressService>();

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
app.Services.GetRequiredService<DbInitializer>().EnsureCreated();

app.MapLeaderboardEndpoints();
app.MapPlayerProgressEndpoints();
app.UseCors("VueClient");
app.MapHub<RaceHub>("/racehub");
app.MapGet("/", () => "Maze Race server is running.");

app.Run();
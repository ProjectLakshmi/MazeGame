
using MazeServer;

var builder = WebApplication.CreateBuilder(args);

// Cloud platforms like Railway/Render assign a port via the PORT env var
// and expect the app to listen on it. Locally, PORT won't be set, so we
// fall back to 5000 for `dotnet run` on your own machine.
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddSignalR();
builder.Services.AddSingleton<RoomManager>();

// Allowed origins: your local Vue dev server AND your deployed Vercel
// frontend. Update the Vercel URL below once you know it.
builder.Services.AddCors(options =>
{
    options.AddPolicy("VueClient", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                "https://maze-game-khaki-five.vercel.app/" // TODO: replace with your real Vercel URL
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // required for SignalR's negotiate handshake
    });
});

var app = builder.Build();

app.UseCors("VueClient");
app.MapHub<RaceHub>("/racehub");
app.MapGet("/", () => "Maze Race server is running.");

app.Run();
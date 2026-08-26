using MazeServer;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddSingleton<RoomManager>();

// During development your Vue app runs on a different port (e.g. 5173),
// so the browser needs explicit CORS permission to open the SignalR connection.
// Replace the origin below with your deployed frontend URL in production.
builder.Services.AddCors(options =>
{
    options.AddPolicy("VueClient", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:3000")
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
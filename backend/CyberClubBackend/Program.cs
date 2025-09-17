using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Allow CORS для фронта
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", p =>
        p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("DevCors");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// --- In-memory store ---
var computers = new List<Computer>();
for (int i = 1; i <= 12; i++)
{
    computers.Add(new Computer
    {
        Id = i,
        Number = $"PC-{i}",
        Status = "Free"
    });
}

var reservations = new List<Reservation>();

// --- Helper: обновление статусов ПК ---
void SyncStatuses()
{
    var now = DateTime.UtcNow;

    foreach (var res in reservations.Where(r => r.Status == "Reserved" || r.Status == "Active"))
    {
        if (res.StartTime <= now && res.EndTime > now)
        {
            res.Status = "Active";
            foreach (var pcId in res.ComputerIds)
            {
                var pc = computers.First(c => c.Id == pcId);
                pc.Status = "Busy";
                pc.ClientName = res.ClientName;
                pc.EndTime = res.EndTime;
            }
        }
        else if (res.EndTime <= now)
        {
            res.Status = "Cancelled";
            foreach (var pcId in res.ComputerIds)
            {
                var pc = computers.First(c => c.Id == pcId);
                if (pc.EndTime <= now)
                {
                    pc.Status = "Free";
                    pc.ClientName = null;
                    pc.EndTime = null;
                }
            }
        }
    }
}

// --- GET: ПК ---
app.MapGet("/api/computers", () =>
{
    SyncStatuses();
    var now = DateTime.UtcNow;

    var dto = computers.Select(c =>
    {
        var nextRes = reservations
            .Where(r => r.ComputerIds.Contains(c.Id) && r.StartTime > now && r.Status == "Reserved")
            .OrderBy(r => r.StartTime)
            .FirstOrDefault();

        return new
        {
            id = c.Id,
            number = c.Number,
            status = c.Status,
            clientName = c.ClientName,
            endTime = c.EndTime?.ToString("o"),
            reservation = nextRes == null ? null : new
            {
                reservationId = nextRes.Id,
                clientName = nextRes.ClientName,
                startTime = nextRes.StartTime.ToString("o"),
                endTime = nextRes.EndTime.ToString("o"),
                status = nextRes.Status
            }
        };
    });

    return Results.Ok(dto);
});

// --- POST: бронирование ---
app.MapPost("/api/reservations", (ReservationRequest req) =>
{
    if (req == null || req.ComputerIds == null || req.ComputerIds.Length == 0)
        return Results.BadRequest("computerIds required");

    if (string.IsNullOrWhiteSpace(req.ClientName))
        return Results.BadRequest("clientName required");

    if (req.EndTime <= req.StartTime)
        return Results.BadRequest("endTime must be after startTime");

    // Проверка конфликтов
    foreach (var pcId in req.ComputerIds)
    {
        if (!computers.Any(c => c.Id == pcId))
            return Results.BadRequest($"Computer {pcId} not found");

        var conflict = reservations.Any(r =>
            r.ComputerIds.Contains(pcId) &&
            !(req.EndTime <= r.StartTime || req.StartTime >= r.EndTime) &&
            r.Status != "Cancelled");

        if (conflict)
            return Results.Conflict($"Computer {pcId} is already reserved in this period");
    }

    var newRes = new Reservation
    {
        Id = reservations.Count + 1,
        ComputerIds = req.ComputerIds.ToList(),
        ClientName = req.ClientName,
        StartTime = req.StartTime,
        EndTime = req.EndTime,
        Status = "Reserved",
        CreatedAt = DateTime.UtcNow
    };

    reservations.Add(newRes);
    SyncStatuses();

    return Results.Created($"/api/reservations/{newRes.Id}", newRes);
});

// --- PUT: вручную start/free ---
app.MapPut("/api/computers/{id:int}/start", (int id) =>
{
    var pc = computers.FirstOrDefault(c => c.Id == id);
    if (pc == null) return Results.NotFound();
    pc.Status = "Busy";
    return Results.NoContent();
});

app.MapPut("/api/computers/{id:int}/free", (int id) =>
{
    var pc = computers.FirstOrDefault(c => c.Id == id);
    if (pc == null) return Results.NotFound();
    pc.Status = "Free";
    pc.ClientName = null;
    pc.EndTime = null;
    return Results.NoContent();
});

app.Run("http://localhost:5000");

// --- Models ---
public class Computer
{
    public int Id { get; set; }
    public string Number { get; set; } = default!;
    public string Status { get; set; } = "Free";
    public string? ClientName { get; set; }
    public DateTime? EndTime { get; set; }
}

public class Reservation
{
    public int Id { get; set; }
    public List<int> ComputerIds { get; set; } = new();
    public string ClientName { get; set; } = default!;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = "Reserved"; // Reserved / Active / Cancelled
    public DateTime CreatedAt { get; set; }
}

public class ReservationRequest
{
    public int[] ComputerIds { get; set; } = Array.Empty<int>();
    public string ClientName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

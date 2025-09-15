// Program.cs — minimal API for Sprint1
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
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

// in-memory store
var computers = new List<Computer>();
for (int i = 1; i <= 12; i++)
{
    computers.Add(new Computer { Id = i, Number = $"PC-{i}", Status = "Free" });
}
var reservations = new List<Reservation>();

app.MapGet("/api/computers", () =>
{
    var dto = computers.Select(c => new {
        id = c.Id,
        number = c.Number,
        status = c.Status,
        clientName = c.ClientName,
        endTime = c.EndTime.HasValue ? c.EndTime.Value.ToString("o") : null
    });
    return Results.Ok(dto);
});

app.MapPost("/api/reservations", (ReservationRequest req) =>
{
    if (req == null || req.ComputerIds == null || req.ComputerIds.Length == 0)
        return Results.BadRequest("computerIds required");
    if (string.IsNullOrWhiteSpace(req.ClientName))
        return Results.BadRequest("clientName required");
    if (req.EndTime <= req.StartTime)
        return Results.BadRequest("endTime must be after startTime");

    // conflict check (simple)
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

    // mark busy if reservation covers now
    var now = DateTime.UtcNow;
    foreach (var id in req.ComputerIds)
    {
        var pc = computers.First(c => c.Id == id);
        if (req.StartTime <= now && req.EndTime > now)
        {
            pc.Status = "Busy";
            pc.ClientName = req.ClientName;
            pc.EndTime = req.EndTime;
        }
    }

    return Results.Created($"/api/reservations/{newRes.Id}", newRes);
});

app.MapGet("/api/reservations", () => Results.Ok(reservations));

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
    public string Status { get; set; } = "Reserved";
    public DateTime CreatedAt { get; set; }
}

public class ReservationRequest
{
    public int[] ComputerIds { get; set; } = Array.Empty<int>();
    public string ClientName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

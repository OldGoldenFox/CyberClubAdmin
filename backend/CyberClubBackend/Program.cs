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

// --- In-memory store ---
var computers = new List<Computer>();
for (int i = 1; i <= 12; i++)
{
    computers.Add(new Computer { Id = i, Number = $"PC-{i}", Status = "Free" });
}

var reservations = new List<Reservation>();

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
            }
        }
        else if (res.EndTime <= now)
        {
            res.Status = "Cancelled";
            foreach (var pcId in res.ComputerIds)
            {
                var pc = computers.First(c => c.Id == pcId);
                pc.Status = "Free";
            }
        }
    }
}

// --- Endpoints ---
app.MapGet("/api/computers", () =>
{
    SyncStatuses();
    var now = DateTime.UtcNow;

    var dto = computers.Select(c =>
    {
        var futureRes = reservations
            .Where(r => r.ComputerIds.Contains(c.Id) && r.StartTime > now && r.Status == "Reserved")
            .OrderBy(r => r.StartTime)
            .ToList();

        var activeRes = reservations.FirstOrDefault(r => r.ComputerIds.Contains(c.Id) && r.Status == "Active");

        return new
        {
            id = c.Id,
            number = c.Number,
            status = c.Status,
            clientName = activeRes?.ClientName,
            startTime = activeRes?.StartTime.ToString("o"),
            endTime = activeRes?.EndTime.ToString("o"),
            activeReservationId = activeRes?.Id,
            hasFutureReservations = futureRes.Any(),
            futureReservations = futureRes.Select(r => new
            {
                reservationId = r.Id,
                clientName = r.ClientName,
                startTime = r.StartTime.ToString("o"),
                endTime = r.EndTime.ToString("o"),
                status = r.Status
            })
        };
    });

    return Results.Ok(dto);
});

app.MapGet("/api/sessions/completed", () =>
{
    var completed = reservations
        .Where(r => r.Status == "Cancelled")
        .OrderByDescending(r => r.EndTime)
        .Select(r => new
        {
            date = r.EndTime.ToString("yyyy-MM-dd"),
            clientName = r.ClientName,
            startTime = r.StartTime.ToString("HH:mm"),
            endTime = r.EndTime.ToString("HH:mm")
        });

    return Results.Ok(completed);
});

app.MapGet("/api/reservations", () =>
{
    var all = reservations
        .OrderByDescending(r => r.Id)
        .Select(r => new
        {
            id = r.Id,
            clientName = r.ClientName,
            computerIds = r.ComputerIds,
            startTime = r.StartTime.ToString("o"),
            endTime = r.EndTime.ToString("o"),
            status = r.Status,
            createdAt = r.CreatedAt.ToString("o")
        });

    return Results.Ok(all);
});

app.MapPost("/api/reservations", (ReservationRequest req) =>
{
    if (req == null || req.ComputerIds == null || req.ComputerIds.Length == 0)
        return Results.BadRequest("computerIds required");

    if (string.IsNullOrWhiteSpace(req.ClientName))
        return Results.BadRequest("clientName required");

    if (req.EndTime <= req.StartTime)
        return Results.BadRequest("endTime must be after startTime");

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

app.MapPost("/api/computers/{id:int}/reserve", (int id, ReservationRequest req) =>
{
    if (!computers.Any(c => c.Id == id))
        return Results.NotFound($"Computer {id} not found");

    if (string.IsNullOrWhiteSpace(req.ClientName))
        return Results.BadRequest("clientName required");

    if (req.EndTime <= req.StartTime)
        return Results.BadRequest("endTime must be after startTime");

    var conflict = reservations.Any(r =>
        r.ComputerIds.Contains(id) &&
        !(req.EndTime <= r.StartTime || req.StartTime >= r.EndTime) &&
        r.Status != "Cancelled");

    if (conflict)
        return Results.Conflict($"Computer {id} is already reserved in this period");

    var now = DateTime.UtcNow;

    var newRes = new Reservation
    {
        Id = reservations.Count + 1,
        ComputerIds = new List<int> { id },
        ClientName = req.ClientName,
        StartTime = req.StartTime,
        EndTime = req.EndTime,
        Status = req.StartTime <= now && req.EndTime > now ? "Active" : "Reserved",
        CreatedAt = now
    };

    reservations.Add(newRes);
    SyncStatuses();

    return Results.Created($"/api/reservations/{newRes.Id}", newRes);
});

app.MapPut("/api/computers/{id:int}/start", (int id) =>
{
    var pc = computers.FirstOrDefault(c => c.Id == id);
    if (pc == null) return Results.NotFound();

    var now = DateTime.UtcNow;
    var fiveMinutesLater = now.AddMinutes(5);

    var res = reservations.FirstOrDefault(r =>
        r.ComputerIds.Contains(id) &&
        r.Status == "Reserved" &&
        r.StartTime >= now &&
        r.StartTime <= fiveMinutesLater);

    if (res == null)
        return Results.NotFound("Нет подходящей резервации для активации");

    res.Status = "Active";
    pc.Status = "Busy";

    return Results.Ok(new
    {
        id = pc.Id,
        number = pc.Number,
        status = pc.Status,
        clientName = res.ClientName,
        startTime = res.StartTime.ToString("o"),
        endTime = res.EndTime.ToString("o"),
        activeReservationId = res.Id
    });
});

app.MapPut("/api/computers/{id:int}/free", (int id) =>
{
    var pc = computers.FirstOrDefault(c => c.Id == id);
    if (pc == null) return Results.NotFound();

    var now = DateTime.UtcNow;

    foreach (var res in reservations.Where(r => r.ComputerIds.Contains(id) && r.Status == "Active"))
    {
        res.Status = "Cancelled";
        res.EndTime = now;
    }

    pc.Status = "Free";
    return Results.NoContent();
});

app.MapPatch("/api/reservations/{id:int}", async (int id, ReservationPatchRequest req) =>
{
    var res = reservations.FirstOrDefault(r => r.Id == id);
    if (res == null) return Results.NotFound();

    if (req.EndTime <= req.StartTime)
        return Results.BadRequest("endTime must be after startTime");

    foreach (var pcId in res.ComputerIds)
    {
        var conflict = reservations.Any(r =>
            r.Id != res.Id &&
            r.ComputerIds.Contains(pcId) &&
            !(req.EndTime <= r.StartTime || req.StartTime >= r.EndTime) &&
            r.Status != "Cancelled");

        if (conflict)
            return Results.Conflict($"Conflict with another reservation on PC {pcId}");
    }

    res.StartTime = req.StartTime;
    res.EndTime = req.EndTime;

    return Results.NoContent();
});

app.Run("http://0.0.0.0:5000");

// --- Models ---
public class Computer
{
    public int Id { get; set; }
    public string Number { get; set; } = default!;
    public string Status { get; set; } = "Free"; // Free / Busy
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

public class ReservationPatchRequest
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

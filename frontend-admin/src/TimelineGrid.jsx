import React from "react";

export default function TimelineGrid({ computers, reservations, selectedDate, onBookingClick }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourWidth = 100;

  const selectedDateStart = new Date(selectedDate);
  selectedDateStart.setHours(0, 0, 0, 0);

  const selectedDateEnd = new Date(selectedDate);
  selectedDateEnd.setHours(24, 0, 0, 0); // строго до полуночи

  function isEditable(booking) {
    const now = new Date();
    const start = new Date(booking.startTime);
    return start > now;
  }

  function getBlocks(pcId) {
    const now = new Date();

    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);

    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(24, 0, 0, 0); // строго до полуночи

    return reservations
      .filter((r) => {
        const start = new Date(r.startTime);
        const end = new Date(r.endTime);

        return (
          r.computerIds.includes(pcId) &&
          r.status !== "Cancelled" &&
          start < selectedDateEnd &&
          end > selectedDateStart &&
          start > now // 🔒 исключаем начавшиеся и прошедшие
        );
      })
      .map((r) => {
        const start = new Date(r.startTime);
        const end = new Date(r.endTime);

        const visibleStart = start < selectedDateStart ? selectedDateStart : start;
        const visibleEnd = end > selectedDateEnd ? selectedDateEnd : end;

        const duration = (visibleEnd - visibleStart) / (1000 * 60 * 60);
        const offset = visibleStart.getHours() + visibleStart.getMinutes() / 60;

        return {
          left: `${offset * hourWidth}px`,
          width: `${duration * hourWidth}px`,
          text: `${start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })} – ${end.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          raw: r,
        };
      });
  }


  return (
    <div style={{ overflowX: "auto", padding: 10 }}>
      {/* Заголовок времени */}
      <div style={{ display: "flex", marginBottom: 10 }}>
        <div style={{ width: 100 }}></div>
        {hours.map((h) => (
          <div key={h} style={{ width: hourWidth, textAlign: "center", fontSize: 12 }}>
            {h.toString().padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Строки по ПК */}
      {computers.map((pc) => (
        <div key={pc.id} style={{ display: "flex", marginBottom: 8, position: "relative" }}>
          <div style={{ width: 100, fontSize: 14 }}>{pc.number}</div>
          <div style={{ position: "relative", height: 30, flex: 1 }}>
            {/* Сетка по часам */}
            {hours.map((h) => (
              <div
                key={h}
                style={{
                  position: "absolute",
                  left: `${h * hourWidth}px`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: "rgba(0,0,0,0.1)",
                }}
              />
            ))}

            {/* Блоки брони */}
            {getBlocks(pc.id).map((b, i) => (
              <div
                key={i}
                onClick={() => {
                  if (isEditable(b.raw)) {
                    onBookingClick(b.raw);
                  } else {
                    alert("Эту бронь уже нельзя редактировать — она уже началась.");
                  }
                }}
                style={{
                  position: "absolute",
                  left: b.left,
                  width: b.width,
                  height: "100%",
                  background: "#4caf50",
                  color: "#fff",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  cursor: isEditable(b.raw) ? "pointer" : "not-allowed",
                  opacity: isEditable(b.raw) ? 1 : 0.6,
                  textAlign: "center",
                  padding: "0 4px",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {b.text}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

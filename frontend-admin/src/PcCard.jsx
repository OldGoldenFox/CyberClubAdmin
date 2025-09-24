export default function PcCard({ pc, onManualStart, onShowReservations }) {
  const color =
    pc.status === "Free" ? "lightgreen" : pc.status === "Busy" ? "indianred" : "lightgray";

  // форматируем время
  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const hoursLeft =
    pc.status === "Busy"
      ? Math.round((new Date(pc.endTime) - new Date()) / 36e5)
      : null;

  return (
    <div
      style={{
        width: 140,
        height: 140,
        margin: 8,
        borderRadius: 6,
        background: color,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: 6,
        cursor: "pointer",
      }}
      onClick={() => onManualStart(pc.id)}
    >
      <div style={{ fontWeight: 700, fontSize: 18 }}>{pc.number}</div>

      {pc.status === "Free" ? (
        <div style={{ fontSize: 14 }}></div>
      ) : (
        <div style={{ fontSize: 12, textAlign: "center" }}>
          <div>{pc.clientName}</div>
          <div>
            {formatTime(pc.startTime)} – {formatTime(pc.endTime)}
          </div>
          <div>({hoursLeft} ч)</div>
        </div>
      )}

      {/* Значок брони (если есть futureReservations) */}
      {pc.futureReservations && pc.futureReservations.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            fontSize: 18,
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.stopPropagation(); // чтобы не срабатывал клик по ПК
            onShowReservations(pc);
          }}
        >
          📅
        </div>
      )}
    </div>
  );
}

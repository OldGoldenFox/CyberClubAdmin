// src/PcCard.jsx
export default function PcCard({ pc }) {
  const now = new Date();

  // Цвет по статусу
  const color =
    pc.status === "Free" ? "lightgreen" :
    pc.status === "Busy" ? "indianred" : "lightgray";

  // Проверка ближайшей брони
  const reservation = pc.reservation &&
    new Date(pc.reservation.startTime) > now &&
    pc.reservation.status === "Reserved"
    ? pc.reservation
    : null;

  return (
    <div style={{
      width: 140, height: 140, margin: 8, borderRadius: 6,
      background: color, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", position: "relative",
      padding: 6
    }}>
      <div style={{ fontWeight: 700 }}>{pc.number}</div>
      {pc.clientName && <div style={{ fontSize: 12 }}>{pc.clientName}</div>}
      {pc.endTime && <div style={{ fontSize: 11 }}>{new Date(pc.endTime).toLocaleTimeString()}</div>}

      {reservation && (
        <>
          <div style={{ fontSize: 11, color: "darkblue", marginTop: 2 }}>
            {reservation.clientName} c {new Date(reservation.startTime).toLocaleTimeString()}
          </div>
          <div style={{
            position: "absolute",
            top: 4, right: 4,
            fontSize: 14,
            background: "yellow",
            borderRadius: "50%",
            width: 20, height: 20,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            📅
          </div>
        </>
      )}
    </div>
  );
}

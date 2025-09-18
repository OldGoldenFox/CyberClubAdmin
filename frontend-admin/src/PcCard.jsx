export default function PcCard({ pc, onManualStart }) {
  const now = new Date();
  const color = pc.status === "Free" ? "lightgreen" : pc.status === "Busy" ? "indianred" : "lightgray";

  return (
    <div
      style={{
        width: 140, height: 140, margin: 8, borderRadius: 6,
        background: color, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", position: "relative",
        padding: 6, cursor: "pointer"
      }}
      onClick={() => onManualStart(pc.id)}
    >
      <div style={{ fontWeight: 700 }}>{pc.number}</div>
    </div>
  );
}

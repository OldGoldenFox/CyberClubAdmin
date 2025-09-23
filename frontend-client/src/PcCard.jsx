export default function PcCard({ pc, onClick }) {
  let bg = "lightgreen"; // по умолчанию свободен
  if (pc.status === "Busy") bg = "lightcoral"; // занят

  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid #ccc",
        borderRadius: 6,
        padding: 10,
        background: bg,
        cursor: "pointer",
        width: 120,
        textAlign: "center"
      }}
    >
      <h4>{pc.number}</h4>
    </div>
  );
}



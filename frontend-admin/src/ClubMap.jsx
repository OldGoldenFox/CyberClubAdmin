// src/ClubMap.jsx
import { useEffect, useState } from "react";
import PcCard from "./PcCard";

export default function ClubMap() {
  const [pcs, setPcs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [hours, setHours] = useState(1); // количество часов аренды
  const [clientName, setClientName] = useState(""); // имя клиента

  async function load() {
    try {
      const res = await fetch("http://localhost:5000/api/computers");
      setPcs(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  function handleManualStart(id) {
    setSelectedId(id);
    setHours(1);
    setClientName(""); // сброс имени по умолчанию
  }

  async function confirmManualStart() {
    if (!hours || hours < 1) return alert("Укажи корректное количество часов");
    if (!clientName.trim()) return alert("Укажи имя клиента");

    const start = new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

    const res = await fetch("http://localhost:5000/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        computerIds: [selectedId],
        clientName: clientName || "Без имени",
        startTime: start.toISOString(),
        endTime: end.toISOString()
      })
    });

    if (res.ok) {
      setSelectedId(null);
      setHours(1);
      setClientName("");
      load();
    } else {
      const err = await res.text();
      alert("Ошибка: " + err);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h1>Карта клуба</h1>
      <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 900 }}>
        {pcs.map(pc => (
          <PcCard key={pc.id} pc={pc} onManualStart={handleManualStart} />
        ))}
      </div>

      {selectedId && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#fff",
            padding: 20,
            borderRadius: 6,
            minWidth: 300
          }}>
            <h3>Занять ПК #{selectedId}</h3>
            <label>
              Имя клиента:
              <input
                type="text"
                value={clientName}
                placeholder="Имя (необязательно)"
                onChange={e => setClientName(e.target.value)}
                style={{ marginLeft: 8 }}
              />
            </label>
            <br />
            <label style={{ marginTop: 10, display: "block" }}>
              Время аренды (часы):
              <input
                type="number"
                value={hours}
                min={1}
                max={12}
                onChange={e => setHours(e.target.value)}
                style={{ marginLeft: 8, width: 50 }}
              />
            </label>
            <br />
            <button onClick={confirmManualStart} style={{ marginTop: 10 }}>
              Подтвердить
            </button>
            <button onClick={() => setSelectedId(null)} style={{ marginLeft: 10 }}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

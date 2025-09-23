import { useEffect, useState } from "react";
import PcCard from "./PcCard";

export default function ClubMap() {
  const [pcs, setPcs] = useState([]);
  const [selectedPc, setSelectedPc] = useState(null); // теперь храним объект ПК
  const [hours, setHours] = useState(1);
  const [clientName, setClientName] = useState("");

  async function load() {
    try {
      const res = await fetch("http://localhost:5000/api/computers");
      setPcs(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  function handleManualStart(id) {
    const pc = pcs.find(p => p.id === id);
    setSelectedPc(pc);
    setHours(1);
    setClientName("");
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
        computerIds: [selectedPc.id],
        clientName: clientName || "Без имени",
        startTime: start.toISOString(),
        endTime: end.toISOString()
      })
    });

    if (res.ok) {
      setSelectedPc(null);
      load();
    } else {
      const err = await res.text();
      alert("Ошибка: " + err);
    }
  }

  async function handleManualFree(id) {
    const res = await fetch(`http://localhost:5000/api/computers/${id}/free`, {
      method: "PUT"
    });
    if (res.ok) {
      await load();           // сначала обновляем список ПК
      setSelectedPc(null);    // потом закрываем модалку
    } else {
      alert("Не удалось завершить сеанс");
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
          <PcCard
            key={pc.id}
            pc={pc}
            onManualStart={handleManualStart}
          />
        ))}
      </div>

      {selectedPc && (
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
            <h3>ПК #{selectedPc.number}</h3>
            {selectedPc.status === "Busy" ? (
              <>
                <p>Клиент: {selectedPc.clientName}</p>
                <p>От: {new Date(selectedPc.startTime).toLocaleTimeString([], {hour: "2-digit",  minute: "2-digit",})}</p>
                <p>До: {new Date(selectedPc.endTime).toLocaleTimeString([], {hour: "2-digit",  minute: "2-digit",})} ({Math.round((new Date(selectedPc.endTime) - new Date()) / 36e5)} ч)</p>
                <button onClick={() => handleManualFree(selectedPc.id)} style={{ marginTop: 10 }}>
                  Завершить сеанс
                </button>
              </>
            ) : (
              <>
                <label>
                  Имя клиента:
                  <input
                    type="text"
                    value={clientName}
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
              </>
            )}
            <button onClick={() => setSelectedPc(null)} style={{ marginLeft: 10, marginTop: 10 }}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

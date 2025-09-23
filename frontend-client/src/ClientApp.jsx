import { useEffect, useState } from "react";
import PcCard from "./PcCard";
import TimePickerModal from "./TimePickerModal";

export default function ClientApp() {
  const [pcs, setPcs] = useState([]);
  const [selectedPc, setSelectedPc] = useState(null);
  const [clientName, setClientName] = useState("");
  const [day, setDay] = useState("today"); // today | tomorrow
  const [startTime, setStartTime] = useState(null); // { hour, minute }
  const [hours, setHours] = useState(1);
  const [showTimePicker, setShowTimePicker] = useState(false);

  async function load() {
    try {
      const res = await fetch("http://192.168.100.46:5000/api/computers");
      const data = await res.json();
      setPcs(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function confirmReservation() {
    if (!clientName.trim()) return alert("Укажи имя клиента");
    if (!startTime) return alert("Выбери время начала");

    // Определяем дату (сегодня или завтра)
    const start = new Date();
    if (day === "tomorrow") start.setDate(start.getDate() + 1);
    start.setSeconds(0, 0);
    start.setHours(startTime.hour, startTime.minute);

    // Проверка: нельзя бронировать в прошлом
    const now = new Date();
    if (start < now) return alert("Нельзя бронировать на прошедшее время");

    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

    const res = await fetch("http://192.168.100.46:5000/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        computerIds: [selectedPc.id],
        clientName,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      }),
    });

    if (res.ok) {
      alert("Бронирование успешно!");
      setSelectedPc(null);
      setClientName("");
      setHours(1);
      setStartTime(null);
      setDay("today");
      load();
    } else {
      const err = await res.text();
      alert("Ошибка: " + err);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 10 }}>
      <h1>Бронирование ПК</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {pcs.map((pc) => (
          <PcCard key={pc.id} pc={pc} onClick={() => setSelectedPc(pc)} />
        ))}
      </div>

      {selectedPc && (
        <div style={overlay}>
          <div style={modal}>
            <h3>ПК {selectedPc.number}</h3>

            <label>
              Имя:
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{ marginLeft: 8 }}
              />
            </label>

            <div style={{ marginTop: 10 }}>
              <label>
                День:
                <select
                  value={day}
                  onChange={(e) => {
                    setDay(e.target.value);
                    setStartTime(null);
                  }}
                  style={{ marginLeft: 6 }}
                >
                  <option value="today">
                    {new Date().toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </option>
                  <option value="tomorrow">
                    {new Date(
                      new Date().setDate(new Date().getDate() + 1)
                    ).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </option>
                </select>
              </label>
            </div>

            <div style={{ marginTop: 10 }}>
              <p>Время начала:</p>
              {startTime ? (
                <p>
                  {startTime.hour.toString().padStart(2, "0")}:
                  {startTime.minute.toString().padStart(2, "0")}
                </p>
              ) : (
                <p style={{ color: "gray" }}>Не выбрано</p>
              )}
              <button onClick={() => setShowTimePicker(true)}>
                Выбрать время
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>
                Длительность (часы):
                <input
                  type="number"
                  value={hours}
                  min={1}
                  max={12}
                  onChange={(e) => setHours(parseInt(e.target.value))}
                  style={{ marginLeft: 8, width: 50 }}
                />
              </label>
            </div>

            <button onClick={confirmReservation} style={{ marginTop: 15 }}>
              Забронировать
            </button>

            <button
              onClick={() => setSelectedPc(null)}
              style={{ marginTop: 10, marginLeft: 10 }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно выбора времени */}
      {showTimePicker && selectedPc && (
        <TimePickerModal
          onClose={() => setShowTimePicker(false)}
          reservations={selectedPc.reservations || []}
          day={day}
          onSelect={(time) => {
            setStartTime(time);
            setShowTimePicker(false);
          }}
        />
      )}
    </div>
  );
}

// --- Стили ---
const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modal = {
  background: "#fff",
  padding: 20,
  borderRadius: 6,
  minWidth: 340,
};

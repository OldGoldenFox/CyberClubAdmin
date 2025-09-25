import { useEffect, useState } from "react";
import PcCard from "./PcCard";
import TimePickerModal from "./TimePickerModal";

export default function ClubMap() {
  const [pcs, setPcs] = useState([]);
  const [selectedPc, setSelectedPc] = useState(null);
  const [selectedReservationsPc, setSelectedReservationsPc] = useState(null);
  const [hours, setHours] = useState(1);
  const [clientName, setClientName] = useState("");
  const [day, setDay] = useState("today");
  const [startTime, setStartTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  async function load() {
    try {
      const res = await fetch("http://localhost:5000/api/computers");
      setPcs(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  function handleSelectPc(id) {
    const pc = pcs.find((p) => p.id === id);
    setSelectedPc(pc);
    setHours(1);
    setClientName("");
    setDay("today");
    setStartTime(null);
  }

async function confirmReservation() {
  if (!clientName.trim()) return alert("Укажи имя клиента");
  if (!startTime) return alert("Выбери время начала");

  const now = new Date();
  const selected = new Date();
  if (day === "tomorrow") selected.setDate(selected.getDate() + 1);
  selected.setSeconds(0, 0);
  selected.setHours(startTime.hour, startTime.minute);

  if (selected < now) return alert("Нельзя бронировать на прошедшее время");

  // 🔍 Находим ближайшее кратное 5 минутам от текущего времени
  const roundedNow = new Date(now);
  const m = roundedNow.getMinutes();
  const roundedMinutes = m % 5 === 0 ? m : m + (5 - (m % 5));
  roundedNow.setMinutes(roundedMinutes);
  roundedNow.setSeconds(0, 0);

  const diff = selected.getTime() - roundedNow.getTime();
  const isImmediateStart = diff === 0;

  let start, end;

if (isImmediateStart) {
  start = new Date();
  start.setSeconds(0, 0);

  // ⏱ Окончание: сначала обычное прибавление
  const rawEnd = new Date(start.getTime() + hours * 60 * 60 * 1000);

  // 📐 Округляем вверх до ближайшего БОЛЬШЕГО кратного 5 минутам
  const endMinutes = rawEnd.getMinutes();
  const roundedEndMinutes = endMinutes % 5 === 0
    ? endMinutes
    : endMinutes + (5 - (endMinutes % 5));

  rawEnd.setMinutes(roundedEndMinutes);
  rawEnd.setSeconds(0, 0);

  end = rawEnd;
}

 else {
    start = selected;
    end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  }

  const res = await fetch("http://localhost:5000/api/reservations", {
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
    if (isImmediateStart) {
      const resStart = await fetch(`http://localhost:5000/api/computers/${selectedPc.id}/start`, {
        method: "PUT",
      });

      if (resStart.ok) {
        const updatedPc = await resStart.json();
        setSelectedPc((prev) => ({
          ...prev,
          status: updatedPc.status,
          clientName: updatedPc.clientName,
          startTime: updatedPc.startTime,
          endTime: updatedPc.endTime,
        }));
      }
    }

    alert("Бронь создана");
    setSelectedPc(null); // 👈 закрываем модалку
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
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h1>Карта клуба</h1>
      <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 900 }}>
        {pcs.map((pc) => (
          <PcCard
            pc={pc}
            onManualStart={handleSelectPc}
            onShowReservations={() => setSelectedReservationsPc(pc)}
          />
        ))}
      </div>

      {/* Модалка управления ПК */}
      {selectedPc && (
        <div style={overlay}>
          <div style={modal}>
            <h3>{selectedPc.number}</h3>

{selectedPc.status === "Busy" && (
  <>
    <p>
      Сейчас играет: <strong>{selectedPc.clientName}</strong>{" "}
      (
      {new Date(selectedPc.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
      {" – "}
      {new Date(selectedPc.endTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
      )
    </p>

    {/* Причина завершения */}
    <div style={{ marginTop: 10 }}>
      <label>
        Причина завершения:
        <input
          type="text"
          value={selectedPc.reason || ""}
          onChange={(e) =>
            setSelectedPc((prev) => ({ ...prev, reason: e.target.value }))
          }
          style={{ marginLeft: 8, width: "70%" }}
        />
      </label>
    </div>

    {/* Завершить сеанс */}
    <div style={{ marginTop: 10 }}>
      <button
        onClick={async () => {
          await fetch(`http://localhost:5000/api/computers/${selectedPc.id}/free`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason: selectedPc.reason?.trim() || "Завершено вручную",
            }),
          });
          load();
          setSelectedPc(null);
        }}
        style={{
          background: "#e53935",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: 4,
          fontWeight: "bold",
          marginTop: 6,
        }}
      >
        Завершить сеанс
      </button>
    </div>

    {/* Продлить сеанс */}
    <div style={{ marginTop: 10 }}>
      <span>Продлить сеанс на:</span>
      {[5, 10, 30, 60].map((min) => (
        <button
          key={min}
          onClick={async () => {
            const newEnd = new Date(selectedPc.endTime);
            newEnd.setMinutes(newEnd.getMinutes() + min);

            const res = await fetch(
              `http://localhost:5000/api/reservations/${selectedPc.activeReservationId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  startTime: selectedPc.startTime,
                  endTime: newEnd.toISOString(),
                }),
              }
            );

            if (res.ok) {
              load();
              alert(`Сеанс продлён на ${min} минут`);
              setSelectedPc(null);
            } else {
              alert("Ошибка продления");
            }
          }}
          style={{
            marginLeft: 6,
            padding: "4px 8px",
            borderRadius: 4,
            background: "#4caf50",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {min} мин
        </button>
      ))}
    </div>

    <hr style={{ margin: "15px 0" }} />
  </>
)}



            <label>
              Имя клиента:
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{ marginLeft: 8 }}
              />
            </label>

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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span>Время начала:</span>
              {startTime ? (
                <span>
                  {startTime.hour.toString().padStart(2, "0")}:
                  {startTime.minute.toString().padStart(2, "0")}
                </span>
              ) : (
                <span style={{ color: "gray" }}>Не выбрано</span>
              )}
            </div>
            <button onClick={() => setShowTimePicker(true)} style={{ marginTop: 6 }}>
              Выбрать время
            </button>
          </div>


            <button onClick={confirmReservation} style={{ marginTop: 15 }}>
              Создать бронь
            </button>
            <button
              onClick={() => setSelectedPc(null)}
              style={{ marginTop: 10 }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Модалка будущих резерваций */}
      {selectedReservationsPc && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Будущие резервации для {selectedReservationsPc.number}</h3>
            {selectedReservationsPc.futureReservations &&
            selectedReservationsPc.futureReservations.length > 0 ? (
              <ul>
                {selectedReservationsPc.futureReservations.map((r) => (
                  <li key={r.reservationId}>
                    {r.clientName} | {new Date(r.startTime).toLocaleString([], 
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })} 
                    {" - "}
                      {new Date(r.endTime).toLocaleString([], 
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Нет будущих резерваций</p>
            )}
            <button
              onClick={() => setSelectedReservationsPc(null)}
              style={{ marginTop: 10 }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* модалка выбора времени */}
      {showTimePicker && selectedPc && (
<TimePickerModal
  onClose={() => setShowTimePicker(false)}
  reservations={selectedPc.futureReservations || []} // 👈 только будущие
  activeReservation={
    selectedPc.status === "Busy" && selectedPc.startTime && selectedPc.endTime
      ? {
          startTime: selectedPc.startTime,
          endTime: selectedPc.endTime,
          status: "Active",
          clientName: selectedPc.clientName
        }
      : null
  }
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

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modal = {
  background: "#fff",
  padding: 20,
  borderRadius: 6,
  minWidth: 340,
};

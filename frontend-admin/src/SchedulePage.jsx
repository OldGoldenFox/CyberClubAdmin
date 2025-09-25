import { useEffect, useState } from "react";
import TimelineGrid from "./TimelineGrid";
import EditBookingModal from "./EditBookingModal";

export default function SchedulePage() {
  const [computers, setComputers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (date) =>
    date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));

  useEffect(() => {
    async function load() {
      const pcsRes = await fetch("http://localhost:5000/api/computers");
      const resRes = await fetch("http://localhost:5000/api/reservations");
      setComputers(await pcsRes.json());
      setReservations(await resRes.json());
    }
    load();
  }, []);

async function handleUpdateBooking(updated) {
  try {
    const res = await fetch(`http://localhost:5000/api/reservations/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startTime: updated.startTime,
        endTime: updated.endTime
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Ошибка при обновлении");
    }

    // ✅ Если сервер вернул 204 No Content — просто обновляем вручную
    setReservations((prev) =>
      prev.map((r) =>
        r.id === updated.id
          ? { ...r, startTime: updated.startTime, endTime: updated.endTime }
          : r
      )
    );

    setSelectedBooking(null);
  } catch (err) {
    console.error("Ошибка обновления:", err);
    alert("Не удалось обновить бронь");
  }
}



  function handleCancelBooking(id) {
    console.log("Отменить бронь:", id);
    // TODO: отправить DELETE-запрос на сервер
    setReservations((prev) => prev.filter((r) => r.id !== id));
    setSelectedBooking(null);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Расписание по ПК</h2>

      {/* 📅 Селектор даты */}
      <div style={{ marginBottom: 15 }}>
        <label style={{ marginRight: 8 }}>Дата:</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: "4px 8px", fontSize: 14 }}
        >
          <option value={today.toISOString().slice(0, 10)}>
            Сегодня ({formatDate(today)})
          </option>
          <option value={tomorrow.toISOString().slice(0, 10)}>
            Завтра ({formatDate(tomorrow)})
          </option>
        </select>
      </div>

      {/* 📊 Сетка таймлайна */}
      <TimelineGrid
        computers={computers}
        reservations={reservations}
        selectedDate={selectedDate}
        onBookingClick={setSelectedBooking}
      />

      {/* 💬 Модалка редактирования */}
      {selectedBooking && (
        <EditBookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={handleUpdateBooking}
          onCancel={handleCancelBooking}
        />
      )}
    </div>
  );
}

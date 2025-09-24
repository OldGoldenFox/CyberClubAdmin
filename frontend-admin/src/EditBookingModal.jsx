import React, { useState } from "react";
import TimePickerModal from "./TimePickerModal";

export default function EditBookingModal({ booking, onClose, onUpdate, onCancel }) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newTime, setNewTime] = useState(null);

  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const day = start.toDateString() === new Date().toDateString() ? "today" : "tomorrow";

  function handleSelectTime({ hour, minute }) {
    const base = day === "today" ? new Date() : new Date(Date.now() + 86400000);
    const newStart = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute);
    const duration = (end - start) / (1000 * 60); // в минутах
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);
    setNewTime({ start: newStart, end: newEnd });
  }

  function handleSave() {
    if (!newTime) return;
    onUpdate({ ...booking, startTime: newTime.start.toISOString(), endTime: newTime.end.toISOString() });
    onClose();
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3>Редактировать бронь</h3>
        <p><strong>Клиент:</strong> {booking.clientName}</p>
        <p>
          <strong>Текущее время:</strong>{" "}
          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>

        {newTime && (
          <p>
            <strong>Новое время:</strong>{" "}
            {newTime.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
            {newTime.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setShowTimePicker(true)}>Выбрать новое время</button>
          <button onClick={handleSave} disabled={!newTime}>Сохранить изменения</button>
          <button onClick={() => onCancel(booking.id)}>Отменить бронь</button>
          <button onClick={onClose}>Закрыть</button>
        </div>

        {showTimePicker && (
          <TimePickerModal
            onClose={() => setShowTimePicker(false)}
            onSelect={handleSelectTime}
            reservations={[]} // можно передать актуальные брони
            day={day}
          />
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  minWidth: 300,
  maxWidth: 500,
};

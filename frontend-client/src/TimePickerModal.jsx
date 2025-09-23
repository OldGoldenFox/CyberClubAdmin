// src/TimePickerModal.jsx
import React, { useState } from "react";

export default function TimePickerModal({ onClose, onSelect, reservations, day }) {
  const now = new Date();

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedMinute, setSelectedMinute] = useState(null);

  function isReserved(h, m) {
    const base = day === "today" ? today : tomorrow;
    const slotStart = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0, 0);
    return reservations.some((r) => {
      const rStart = new Date(r.startTime);
      const rEnd = new Date(r.endTime);
      return slotStart >= rStart && slotStart < rEnd;
    });
  }

  function isPast(h, m) {
    if (day !== "today") return false;
    const slot = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0, 0);
    return slot < now;
  }

  function handleConfirm() {
    if (selectedHour === null || selectedMinute === null) return;
    const value = { hour: selectedHour, minute: selectedMinute };
    onSelect(value);
    onClose();
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ marginBottom: 10 }}>Выбери время</h3>
        <p>
          День:{" "}
          {day === "today"
            ? today.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
            : tomorrow.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
        </p>

        <div style={gridContainer}>
          <div>
            <h4>Часы</h4>
            <div style={hourGrid}>
              {Array.from({ length: 24 }).map((_, h) => {
                const disabled = isPast(h, 0) || isReserved(h, 0);
                return (
                  <button
                    key={h}
                    disabled={disabled}
                    style={disabled ? btnDisabled : selectedHour === h ? btnActive : btnFree}
                    onClick={() => setSelectedHour(h)}
                  >
                    {h.toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h4>Минуты</h4>
            <div style={minuteGrid}>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                if (selectedHour === null) return null;
                const disabled = isPast(selectedHour, m) || isReserved(selectedHour, m);
                return (
                  <button
                    key={m}
                    disabled={disabled}
                    style={
                      disabled
                        ? btnDisabled
                        : selectedMinute === m
                        ? btnActive
                        : btnFree
                    }
                    onClick={() => setSelectedMinute(m)}
                  >
                    {m.toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={footer}>
          <button onClick={handleConfirm} disabled={selectedHour === null || selectedMinute === null}>
            OK
          </button>
          <button onClick={onClose} style={{ marginLeft: 10 }}>
            Отмена
          </button>
        </div>
      </div>
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
  padding: 10,
};

const modal = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  width: "100%",
  maxWidth: 400,
  boxSizing: "border-box",
};

const gridContainer = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  marginTop: 10,
};

const hourGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
  gap: 6,
};

const minuteGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
  gap: 6,
};

const footer = {
  marginTop: 20,
  display: "flex",
  justifyContent: "center",
};

const btnFree = {
  padding: "8px 10px",
  background: "#f0f0f0",
  border: "1px solid #ccc",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
};

const btnDisabled = {
  ...btnFree,
  background: "#ddd",
  border: "1px solid #aaa",
  color: "#777",
  cursor: "not-allowed",
};

const btnActive = {
  ...btnFree,
  background: "#4caf50",
  color: "#fff",
};

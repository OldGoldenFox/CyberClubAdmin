import { useEffect, useState } from "react";
import MiniChart from "./MiniChart";

export default function Dashboard() {
  const [pcs, setPcs] = useState([]);

  async function load() {
    try {
      const res = await fetch("http://localhost:5000/api/computers");
      const data = await res.json();
      setPcs(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // автообновление каждые 5 секунд
    return () => clearInterval(interval);
  }, []);

  // Подготовка данных для мини-графика
const chartData = [];
const today = new Date();

for (let h = 0; h < 24; h++) {
  const hDate = new Date(today);
  hDate.setHours(h, 0, 0, 0); // ставим конкретный час

  const busy = pcs.filter(pc => {
    if (!pc.endTime) return false;
    const start = new Date(pc.startTime);
    const end = new Date(pc.endTime);
    return start <= hDate && end >= hDate;
  }).length;

  chartData.push({ hour: `${h}:00`, busy });
}


  const freeCount = pcs.filter(pc => pc.status === "Free").length;
  const busyCount = pcs.filter(pc => pc.status === "Busy").length;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Свободно ПК: {freeCount}</p>
      <p>Занято ПК: {busyCount}</p>

      <h3>Занятость по часам</h3>
<div style={{ width: "30vw", minWidth: "400px", maxWidth: "1200px", height: "40vh", margin: "0 auto" }}>
  <MiniChart data={chartData} />
</div>




      <h3>Текущие бронирования</h3>
      <ul>
        {pcs.filter(pc => pc.status === "Busy").length === 0
          ? <li>Нет активных бронирований</li>
          : pcs.filter(pc => pc.status === "Busy").map(pc => (
              <li key={pc.id}>
                ПК #{pc.id} — {pc.clientName || "Гость"} до {new Date(pc.endTime).toLocaleTimeString([], {hour: "2-digit",  minute: "2-digit",})}
              </li>
            ))
        }
      </ul>
    </div>
  );
}

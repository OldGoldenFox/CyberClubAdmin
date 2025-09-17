// src/ClubMap.jsx
import { useEffect, useState } from "react";
import PcCard from "./PcCard";

export default function ClubMap() {
  const [pcs, setPcs] = useState([]);

  async function load() {
    try {
      const res = await fetch("http://localhost:5000/api/computers");
      setPcs(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000); // автообновление каждые 5 секунд
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h1>Карта клуба</h1>
      <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 900 }}>
        {pcs.map(pc => <PcCard key={pc.id} pc={pc} />)}
      </div>
    </div>
  );
}

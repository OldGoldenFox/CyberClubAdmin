import { useEffect, useState } from "react";

function PcCard({ pc }) {
    const color = pc.status === "Free" ? "lightgreen" : (pc.status === "Busy" ? "indianred" : "lightgray");
    return (
        <div style={{
            width: 120, height: 100, margin: 8, borderRadius: 6,
            background: color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
            <div style={{ fontWeight: 700 }}>{pc.number}</div>
            {pc.clientName && <div style={{ fontSize: 12 }}>{pc.clientName}</div>}
            {pc.endTime && <div style={{ fontSize: 11 }}>{new Date(pc.endTime).toLocaleTimeString()}</div>}
        </div>
    );
}

export default function App() {
    const [pcs, setPcs] = useState([]);

    async function load() {
        try {
            const res = await fetch("http://localhost:5000/api/computers");
            const json = await res.json();
            setPcs(json);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        load();
        const id = setInterval(load, 5000);
        return () => clearInterval(id);
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h1>Карта клуба — клиент</h1>
            <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 900 }}>
                {pcs.map(pc => <PcCard key={pc.id} pc={pc} />)}
            </div>
        </div>
    );
}

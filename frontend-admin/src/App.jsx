import { useEffect, useState } from "react";

function PcCard({ pc, onManualStart }) {
    const now = new Date();
    const color =
        pc.status === "Free" ? "lightgreen" :
        (pc.status === "Busy" ? "indianred" : "lightgray");

    const reservation = pc.reservation &&
        new Date(pc.reservation.startTime) > now &&
        pc.reservation.status === "Reserved"
        ? pc.reservation
        : null;

    return (
        <div style={{
            width: 140, height: 140, margin: 8, borderRadius: 6,
            background: color, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", position: "relative",
            padding: 6
        }}>
            <div style={{ fontWeight: 700 }}>{pc.number}</div>
            {pc.clientName && <div style={{ fontSize: 12 }}>{pc.clientName}</div>}
            {pc.endTime && <div style={{ fontSize: 11 }}>{new Date(pc.endTime).toLocaleTimeString()}</div>}

            {reservation && (
                <>
                    <div style={{ fontSize: 11, color: "darkblue", marginTop: 2 }}>
                        {reservation.clientName} c {new Date(reservation.startTime).toLocaleTimeString()}
                    </div>
                    <div style={{
                        position: "absolute",
                        top: 4, right: 4,
                        fontSize: 14,
                        background: "yellow",
                        borderRadius: "50%",
                        width: 20, height: 20,
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        📅
                    </div>
                </>
            )}

            {pc.status === "Free" && (
                <button
                    style={{ marginTop: 6, fontSize: 12 }}
                    onClick={() => onManualStart(pc.id)}
                >
                    Занять
                </button>
            )}
        </div>
    );
}

export default function App() {
    const [pcs, setPcs] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [endTime, setEndTime] = useState("");

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
        const id = setInterval(load, 5000);
        return () => clearInterval(id);
    }, []);

    async function handleManualStart(id) {
        setSelectedId(id);
    }

    async function confirmManualStart() {
        if (!endTime) return alert("Укажи время окончания");

        const res = await fetch("http://localhost:5000/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                computerIds: [selectedId],
                clientName: "Админ",
                startTime: new Date().toISOString(),
                endTime: new Date(endTime).toISOString()
            })
        });

        if (res.ok) {
            setSelectedId(null);
            setEndTime("");
            load();
        } else {
            const err = await res.text();
            alert("Ошибка: " + err);
        }
    }

    return (
        <div style={{ padding: 20 }}>
            <h1>Карта клуба — админ</h1>
            <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 900 }}>
                {pcs.map(pc => (
                    <PcCard key={pc.id} pc={pc} onManualStart={handleManualStart} />
                ))}
            </div>

            {selectedId && (
                <div style={{
                    marginTop: 20, padding: 10, border: "1px solid gray",
                    borderRadius: 6, maxWidth: 300
                }}>
                    <h3>Занять ПК #{selectedId}</h3>
                    <label>
                        Время окончания:
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            style={{ marginLeft: 8 }}
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
            )}
        </div>
    );
}

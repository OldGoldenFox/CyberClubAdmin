// src/MiniChart.jsx
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function MiniChart({ data }) {
  const chartData = {
    labels: data.map(d => d.hour),
    datasets: [
      {
        label: "Занято ПК",
        data: data.map(d => d.busy),
        borderColor: "blue",
        backgroundColor: "rgba(0,0,255,0.2)",
      },
    ],
  };

return (
  <Line
    data={chartData}
    options={{
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            callback: (value) => (Number.isInteger(value) ? value : null),
          },
          suggestedMax: 5,
        },
      },
    }}
  />
);


}

import { useEffect, useState } from "react";

const KEY = "brace-outage-start";

function getStart() {
  try {
    const saved = Number(localStorage.getItem(KEY));
    if (saved) return saved;
    const now = Date.now();
    localStorage.setItem(KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function stageFor(remainingMs, totalMs) {
  const hoursLeft = remainingMs / 3600000;
  if (remainingMs <= 0) {
    return {
      cls: "l2",
      title: "Your backup battery time is up",
      steps: [
        "If you cannot power a device you depend on, call 911 now.",
        "Get to a place with power: a warming or cooling center, a hospital, or a neighbor or relative.",
        "Tell someone where you are going.",
      ],
    };
  }
  if (hoursLeft <= 2) {
    return {
      cls: "l2",
      title: "Under 2 hours left. Get to power now.",
      steps: [
        "Go to a place with power: a warming or cooling center, a relative's home, or a hospital.",
        "Call your device supplier or doctor's office for guidance.",
        "If you feel unsafe at any point, call 911.",
      ],
    };
  }
  if (remainingMs / totalMs <= 0.5) {
    return {
      cls: "l1",
      title: "Halfway through your battery",
      steps: [
        "Decide now where you will go, and arrange a ride.",
        "Text a friend, family member, or neighbor that your power is out.",
        "Charge your phone from your car if you can.",
      ],
    };
  }
  return {
    cls: "l0",
    title: "Conserve your power",
    steps: [
      "Turn off every device you don't need right now.",
      "Charge your phone and any power banks.",
      "Keep the fridge and freezer closed.",
      "Let someone know your power is out.",
    ],
  };
}

export default function PowerOut({ battery, devices, onBack }) {
  const [start] = useState(getStart);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalMs = Math.max(0, battery) * 3600000;
  const remaining = Math.max(0, start + totalMs - now);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const stage = stageFor(start + totalMs - now, totalMs);

  function endOutage() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    onBack();
  }

  return (
    <>
      <div className="header">
        <h1>Power is out</h1>
        <p>Stay calm. Follow the steps below.</p>
      </div>
      <div className="wrap">
        <a className="btn call" href="tel:911">
          Call 911
        </a>

        <div className={"risk " + stage.cls}>
          <div className="small">Backup time left</div>
          <div className="big">
            {pad(h)}:{pad(m)}:{pad(s)}
          </div>
          <div className="place">
            {devices.length > 0 ? devices.join(", ") : "No devices listed"}
          </div>
        </div>

        <div className="card">
          <h2>{stage.title}</h2>
          <ol className="steps">
            {stage.steps.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </div>

        <button className="btn secondary" onClick={endOutage}>
          Power is back on
        </button>
      </div>
    </>
  );
}
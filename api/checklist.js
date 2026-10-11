function fallbackPlan({ level, devices, battery }) {
  const steps = [];
  if (devices.length > 0) {
    steps.push(
      `Charge every battery and backup power source for your ${devices.join(", ")} now. You have about ${battery} hours of backup.`
    );
  }
  if (devices.includes("Refrigerated insulin")) {
    steps.push("Keep insulin in the fridge and pack a cooler with ice packs in case power fails.");
  }
  if (level === "Act Now") {
    steps.push("Decide now where you will go if the power goes out, such as a warming or cooling center or a relative's home.");
    steps.push("Call your device supplier or doctor's office today to ask about a backup plan.");
  } else {
    steps.push("Check the forecast again tonight and tomorrow morning.");
  }
  steps.push("Fill your car's gas tank and charge your phone and power banks.");
  steps.push("In an emergency, call 911.");
  return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { place, level, devices, battery, alerts } = req.body || {};
  const safe = {
    place: String(place || "").slice(0, 80),
    level: String(level || "").slice(0, 20),
    devices: Array.isArray(devices) ? devices.slice(0, 10).map(String) : [],
    battery: Number(battery) || 0,
    alerts: Array.isArray(alerts)
      ? alerts.slice(0, 5).map((a) => String(a).slice(0, 300))
      : [],
  };

  const key = (process.env.GEMINI_API_KEY || "").trim();
  console.log("Has Gemini key:", !!key);
  if (!key) {
    return res.status(200).json({ plan: fallbackPlan(safe) });
  }

  const prompt = `You are Brace, a Texas power-outage preparedness assistant for people who depend on electricity for their health.

Location: ${safe.place}
Risk level: ${safe.level}
Devices they depend on: ${safe.devices.join(", ") || "none listed"}
Backup battery hours: ${safe.battery}
Active weather alerts: ${safe.alerts.join(" | ") || "none"}

Write a short checklist of 4 to 6 actions in priority order, most urgent first. Be specific to their devices and battery hours. Use plain, calm language with short sentences. Start each line with a number. Do not give medical advice or change any treatment. Do not name specific companies, utilities, or programs. Instead say things like "ask your electric provider whether they keep a medical-needs registry." Always end with the line: "In an emergency, call 911."`;

  const model = (process.env.GEMINI_MODEL || "gemini-flash-latest").trim();

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!r.ok || !text) {
      console.log("Gemini error:", r.status, JSON.stringify(data));
      return res.status(200).json({ plan: fallbackPlan(safe) });
    }
    return res.status(200).json({ plan: text });
  } catch (err) {
    console.log("Gemini fetch failed:", String(err));
    return res.status(200).json({ plan: fallbackPlan(safe) });
  }
}
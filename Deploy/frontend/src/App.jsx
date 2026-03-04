import { useState } from "react";
import "./App.css";

const FEATURES = [
  { key: "HR",     label: "Heart Rate",               unit: "bpm",         min: 0,   max: 300  },
  { key: "O2Sat",  label: "Oxygen Saturation",         unit: "%",           min: 0,   max: 100  },
  { key: "Temp",   label: "Temperature",               unit: "°C",          min: 25,  max: 45   },
  { key: "SBP",    label: "Systolic Blood Pressure",   unit: "mmHg",        min: 0,   max: 300  },
  { key: "MAP",    label: "Mean Arterial Pressure",    unit: "mmHg",        min: 0,   max: 200  },
  { key: "DBP",    label: "Diastolic Blood Pressure",  unit: "mmHg",        min: 0,   max: 200  },
  { key: "Resp",   label: "Respiratory Rate",          unit: "breaths/min", min: 0,   max: 60   },
  { key: "Age",    label: "Age",                       unit: "years",       min: 0,   max: 120  },
  { key: "Gender", label: "Gender",                    unit: "0=F / 1=M",   min: 0,   max: 1    },
  { key: "ICULOS", label: "ICU Length of Stay",        unit: "hours",       min: 0,   max: 1000 },
];

const API_URL = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [activeTab, setActiveTab] = useState("manual");
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value === "" ? undefined : parseFloat(value) }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInputs({});
    setResult(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo-block">
            <span className="logo-icon">🩺</span>
            <div>
              <h1>Sepsis Prediction</h1>
              <p>Early warning system powered by XGBoost</p>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "manual" ? "active" : ""}`}
            onClick={() => setActiveTab("manual")}
          >
            Manual Input
          </button>
          <button
            className={`tab-btn ${activeTab === "device" ? "active" : ""}`}
            onClick={() => setActiveTab("device")}
          >
            Device
          </button>
        </div>

        {activeTab === "manual" && (
          <div className="card">
            <h2>Patient Vitals</h2>
            <p className="subtitle">Fill in the available measurements. Empty fields will be handled automatically.</p>

            <div className="grid">
              {FEATURES.map(({ key, label, unit, min, max }) => (
                <div className="field" key={key}>
                  <label>
                    {label} <span className="unit">{unit}</span>
                  </label>
                  <input
                    type="number"
                    placeholder={`e.g. ${Math.round((min + max) / 2)}`}
                    min={min}
                    max={max}
                    step="any"
                    value={inputs[key] ?? ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="actions">
              <button className="btn-reset" onClick={handleReset}>Reset</button>
              <button className="btn-predict" onClick={handlePredict} disabled={loading}>
                {loading ? "Predicting..." : "Predict"}
              </button>
            </div>

            {error && (
              <div className="result-box error-box">
                <span>⚠️ {error}</span>
              </div>
            )}

            {result && (
              <div className={`result-box ${result.prediction === 1 ? "sepsis-box" : "no-sepsis-box"}`}>
                <div className="result-main">
                  <span className="result-icon">{result.prediction === 1 ? "🔴" : "🟢"}</span>
                  <span className="result-label">{result.label}</span>
                </div>
                <div className="result-details">
                  <div className="detail">
                    <span>Probability</span>
                    <strong>{(result.sepsis_probability * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="detail">
                    <span>Threshold</span>
                    <strong>{(result.threshold_used * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="detail">
                    <span>Model</span>
                    <strong>v{result.model_version}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "device" && (
          <div className="card device-card">
            <h2>Device Integration</h2>
            <p className="subtitle">Connect an external device to send patient data automatically.</p>

            <div className="device-status">
              <span className="status-dot"></span>
              <span>No device connected</span>
            </div>

            <div className="endpoint-box">
              <h3>API Endpoint</h3>
              <p>Your device should send a <code>POST</code> request to:</p>
              <div className="code-block">
                POST {window.location.origin}/predict
              </div>

              <h3>Request Body (JSON)</h3>
              <pre className="code-block">{`{
  "HR": 110,
  "O2Sat": 94,
  "Temp": 38.5,
  "SBP": 130,
  "MAP": 95,
  "DBP": 75,
  "Resp": 22,
  "Age": 65,
  "Gender": 1,
  "ICULOS": 4
}`}</pre>

              <h3>Response</h3>
              <pre className="code-block">{`{
  "model_version": "1.0.0",
  "threshold_used": 0.4,
  "sepsis_probability": 0.6712,
  "prediction": 1,
  "label": "Sepsis"
}`}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

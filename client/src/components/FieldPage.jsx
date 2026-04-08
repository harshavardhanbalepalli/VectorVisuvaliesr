import React, { useState, useEffect } from "react";
import VectorCanvas from "./VectorCanvas";

const API = "https://vectorvisuvaliesr-3.onrender.com";

export default function FieldPage({ type, accent, accentClass, tag, title, desc, formula }) {
  const [functions, setFunctions]   = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [data, setData]             = useState([]);
  const [label, setLabel]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // Range
  const [xMin, setXMin] = useState(-4);
  const [xMax, setXMax] = useState(4);
  const [yMin, setYMin] = useState(-4);
  const [yMax, setYMax] = useState(4);

  // Custom mode
  const [customMode, setCustomMode]   = useState(false);
  const [exprF,  setExprF]            = useState("x*x + y*y");
  const [exprFx, setExprFx]           = useState("-y");
  const [exprFy, setExprFy]           = useState("x");
  const [customError, setCustomError] = useState("");

  // Load function list
  useEffect(() => {
    fetch(`${API}/api/functions`)
      .then(r => r.json())
      .then(all => {
        const fns = all[type] || [];
        setFunctions(fns);
        if (fns.length) setSelectedKey(fns[0].key);
      })
      .catch(() => setError("Cannot connect to backend — make sure server.js is running on port 4000"));
  }, [type]);

  // Auto-fetch predefined on selection
  useEffect(() => {
    if (selectedKey && !customMode) fetchPredefined(selectedKey);
  }, [selectedKey]);

  const range = () => ({ xMin, xMax, yMin, yMax });

  const fetchPredefined = async (key) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ func: key, ...range() }),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      setData(json.data || []); setLabel(json.label || key);
    } catch { setError("Fetch failed — is the backend running?"); }
    finally   { setLoading(false); }
  };

  const fetchCustom = async () => {
    setCustomError("");
    if (type === "gradient" && !exprF.trim())       { setCustomError("Enter f(x,y)"); return; }
    if (type !== "gradient" && (!exprFx.trim() || !exprFy.trim())) { setCustomError("Enter both Fx and Fy"); return; }

    const exprs = type === "gradient" ? { f: exprF } : { fx: exprFx, fy: exprFy };
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom: true, exprs, ...range() }),
      });
      const json = await res.json();
      if (json.error) { setCustomError(json.error); return; }
      setData(json.data || []); setLabel(json.label || "Custom");
    } catch { setCustomError("Fetch failed — is the backend running?"); }
    finally   { setLoading(false); }
  };

  const handleVisualize = () => customMode ? fetchCustom() : fetchPredefined(selectedKey);

  const preview = data.slice(0, 6);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-tag" style={{ color: accent }}>{tag}</div>
      <h1 className="page-title">{title}</h1>
      <p className="page-desc">{desc}</p>
      <div className={`formula-box ${accentClass}`}>
        {formula.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      <div className="viz-layout">
        {/* ── Controls ── */}
        <div className="control-panel">

          {/* Mode */}
          <div>
            <div className="panel-section-title">Mode</div>
            <div className="mode-toggle">
              <button
                className={"mode-btn" + (!customMode ? " active" : "")}
                style={!customMode ? { borderColor: accent, color: accent } : {}}
                onClick={() => setCustomMode(false)}
              >Predefined</button>
              <button
                className={"mode-btn" + (customMode ? " active" : "")}
                style={customMode ? { borderColor: accent, color: accent } : {}}
                onClick={() => setCustomMode(true)}
              >Custom ✏️</button>
            </div>
          </div>

          {/* Predefined list */}
          {!customMode && (
            <div>
              <div className="panel-section-title">Select Function</div>
              <div className="fn-grid">
                {functions.map(fn => (
                  <button
                    key={fn.key}
                    className={"fn-btn" + (selectedKey === fn.key ? " active" : "")}
                    style={selectedKey === fn.key ? { color: accent, borderColor: accent + "55" } : {}}
                    onClick={() => setSelectedKey(fn.key)}
                  >{fn.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Custom inputs */}
          {customMode && (
            <div>
              <div className="panel-section-title">
                {type === "gradient" ? "Scalar Function f(x,y)" : "Vector Components F(x,y)"}
              </div>
              <div className="custom-inputs">
                {type === "gradient" ? (
                  <div className="input-group">
                    <label className="input-label">f(x, y) =</label>
                    <input
                      className="fn-input"
                      type="text"
                      value={exprF}
                      onChange={e => setExprF(e.target.value)}
                      placeholder="x*x + sin(y)"
                      style={{ borderColor: accent + "44" }}
                    />
                    <div className="input-hint">Gradient is computed numerically (finite difference)</div>
                  </div>
                ) : (
                  <>
                    <div className="input-group">
                      <label className="input-label">Fx(x, y) =</label>
                      <input
                        className="fn-input" type="text" value={exprFx}
                        onChange={e => setExprFx(e.target.value)}
                        placeholder="-y * cos(x)"
                        style={{ borderColor: accent + "44" }}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Fy(x, y) =</label>
                      <input
                        className="fn-input" type="text" value={exprFy}
                        onChange={e => setExprFy(e.target.value)}
                        placeholder="x * sin(y)"
                        style={{ borderColor: accent + "44" }}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="input-hint" style={{ marginTop: 8 }}>
                Allowed: sin cos tan exp log sqrt abs PI x y + - * / ^ ( )
              </div>
              {customError && <div className="custom-error">⚠ {customError}</div>}
            </div>
          )}

          {/* Range */}
          <div>
            <div className="panel-section-title">Grid Range</div>
            <div className="range-grid">
              {[
                ["X min", xMin, setXMin],
                ["X max", xMax, setXMax],
                ["Y min", yMin, setYMin],
                ["Y max", yMax, setYMax],
              ].map(([lbl, val, setter]) => (
                <div className="input-group" key={lbl}>
                  <label className="input-label">{lbl}</label>
                  <input
                    className="range-input" type="number" value={val} step="0.5"
                    onChange={e => setter(parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Active label */}
          {label && (
            <div>
              <div className="panel-section-title">Active Function</div>
              <div className="selected-fn"><strong>{label}</strong></div>
            </div>
          )}

          <button className={"viz-btn " + accentClass} onClick={handleVisualize} disabled={loading}>
            {loading ? "Computing…" : "↻ Visualize"}
          </button>

          {error && <div className="fetch-error">⚠ {error}</div>}

          {/* Data preview */}
          {preview.length > 0 && (
            <div className="output-preview">
              <div className="output-preview-title">Data Preview — first 6 points</div>
              <table className="output-table">
                <thead><tr><th>x</th><th>y</th><th>vx</th><th>vy</th></tr></thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td className="num">{row.x}</td>
                      <td className="num">{row.y}</td>
                      <td className="num">{row.vx}</td>
                      <td className="num">{row.vy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Canvas ── */}
        <div className="canvas-wrap">
          <div className="canvas-topbar">
            <span className="canvas-label">
              {data.length > 0 ? `${data.length} vectors rendered` : "Awaiting data…"}
            </span>
            <div className="canvas-legend">
              <div className="legend-item">
                <div className="legend-swatch" style={{ background: "rgba(20,30,80,0.9)" }} />
                low magnitude
              </div>
              <div className="legend-item">
                <div className="legend-swatch" style={{ background: accent }} />
                high magnitude
              </div>
            </div>
          </div>

          {loading ? (
            <div className="canvas-placeholder" style={{ color: accent }}>
              <div className="spinner" /> Computing field…
            </div>
          ) : data.length === 0 ? (
            <div className="canvas-placeholder">Select a function and click Visualize</div>
          ) : (
            <VectorCanvas data={data} accent={accent} width={700} height={540} />
          )}
        </div>
      </div>
    </div>
  );
}

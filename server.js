const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Predefined Functions ─────────────────────────────────────────────────────

const FUNCTIONS = {
  gradient: {
    quadratic:  { label: "f = x² + y²",          fn: (x,y) => ({ vx: 2*x, vy: 2*y }) },
    saddle:     { label: "f = x² - y²",          fn: (x,y) => ({ vx: 2*x, vy: -2*y }) },
    gaussian:   { label: "f = e^(-(x²+y²))",     fn: (x,y) => { const e=Math.exp(-(x*x+y*y)); return { vx:-2*x*e, vy:-2*y*e }; } },
    sine:       { label: "f = sin(x)·cos(y)",    fn: (x,y) => ({ vx: Math.cos(x)*Math.cos(y), vy: -Math.sin(x)*Math.sin(y) }) },
    log:        { label: "f = ln(x²+y²+1)",      fn: (x,y) => { const d=x*x+y*y+1; return { vx:(2*x)/d, vy:(2*y)/d }; } },
    cubic:      { label: "f = x³ - 3xy²",        fn: (x,y) => ({ vx: 3*x*x-3*y*y, vy: -6*x*y }) },
    ripple:     { label: "f = sin(x²+y²)",       fn: (x,y) => { const c=Math.cos(x*x+y*y); return { vx:2*x*c, vy:2*y*c }; } },
    hyperbolic: { label: "f = x·y",              fn: (x,y) => ({ vx: y, vy: x }) },
  },
  curl: {
    rotation:   { label: "F = (-y, x)",                      fn: (x,y) => ({ vx:-y, vy:x }) },
    vortex:     { label: "F = (-y, x)/(r²+ε)",               fn: (x,y) => { const r2=x*x+y*y+0.1; return { vx:-y/r2, vy:x/r2 }; } },
    saddleCurl: { label: "F = (y², x²)",                     fn: (x,y) => ({ vx:y*y, vy:x*x }) },
    sinCurl:    { label: "F = (sin(y), sin(x))",             fn: (x,y) => ({ vx:Math.sin(y), vy:Math.sin(x) }) },
    spiralCurl: { label: "F = (x-y, x+y)",                   fn: (x,y) => ({ vx:x-y, vy:x+y }) },
    doubleCurl: { label: "F = (sin(x)cos(y), -cos(x)sin(y))",fn: (x,y) => ({ vx:Math.sin(x)*Math.cos(y), vy:-Math.cos(x)*Math.sin(y) }) },
    shear:      { label: "F = (y, 0)",                       fn: (x,y) => ({ vx:y, vy:0 }) },
    hurricane:  { label: "F = hurricane",                    fn: (x,y) => { const e=Math.exp(-Math.sqrt(x*x+y*y)*0.3); return { vx:-y*e, vy:x*e }; } },
  },
  divergence: {
    source:     { label: "F = (x, y) — source",             fn: (x,y) => ({ vx:x,  vy:y }) },
    sink:       { label: "F = (-x, -y) — sink",             fn: (x,y) => ({ vx:-x, vy:-y }) },
    mixed:      { label: "F = (x², -y²)",                   fn: (x,y) => ({ vx:x*x, vy:-y*y }) },
    radial:     { label: "F = (x,y)/(r+ε)",                 fn: (x,y) => { const r=Math.sqrt(x*x+y*y)+0.01; return { vx:x/r, vy:y/r }; } },
    sinDiv:     { label: "F = (sin(x), cos(y))",            fn: (x,y) => ({ vx:Math.sin(x), vy:Math.cos(y) }) },
    explosion:  { label: "F = (x·e^-r², y·e^-r²)",         fn: (x,y) => { const e=Math.exp(-(x*x+y*y)*0.3); return { vx:x*e, vy:y*e }; } },
    wave:       { label: "F = (cos(x), sin(y))",            fn: (x,y) => ({ vx:Math.cos(x), vy:Math.sin(y) }) },
    dipole:     { label: "F = (2xy, x²-y²)",                fn: (x,y) => ({ vx:2*x*y, vy:x*x-y*y }) },
  },
};

// ─── Safe custom evaluator ────────────────────────────────────────────────────

function safeEval(expr, x, y) {
  const sanitized = expr.replace(/\^/g, "**").replace(/[^0-9xy\+\-\*\/\(\)\.\s\^eE,a-zA-Z_]/g, "");
  try {
    const fn = new Function("x","y","sin","cos","tan","exp","log","sqrt","abs","PI",
      `"use strict"; return (${sanitized});`);
    const result = fn(x,y,Math.sin,Math.cos,Math.tan,Math.exp,Math.log,Math.sqrt,Math.abs,Math.PI);
    return isFinite(result) ? result : null;
  } catch { return null; }
}

function numericalGradient(expr, x, y) {
  const h = 1e-4;
  const vx = (safeEval(expr,x+h,y) - safeEval(expr,x-h,y)) / (2*h);
  const vy = (safeEval(expr,x,y+h) - safeEval(expr,x,y-h)) / (2*h);
  return { vx, vy };
}

// ─── Grid generator ───────────────────────────────────────────────────────────

function makeGrid(opts) {
  const xMin = parseFloat(opts.xMin) || -4;
  const xMax = parseFloat(opts.xMax) ||  4;
  const yMin = parseFloat(opts.yMin) || -4;
  const yMax = parseFloat(opts.yMax) ||  4;
  const steps = 14;
  const sx = (xMax - xMin) / steps;
  const sy = (yMax - yMin) / steps;
  const grid = [];
  for (let x = xMin; x <= xMax; x += sx)
    for (let y = yMin; y <= yMax; y += sy)
      grid.push([+x.toFixed(3), +y.toFixed(3)]);
  return grid;
}

function generatePredefined(type, funcKey, opts) {
  const entry = FUNCTIONS[type]?.[funcKey];
  if (!entry) return null;
  const points = [];
  for (const [x, y] of makeGrid(opts)) {
    const { vx, vy } = entry.fn(x, y);
    if (!isFinite(vx) || !isFinite(vy)) continue;
    points.push({ x, y, vx: +vx.toFixed(4), vy: +vy.toFixed(4) });
  }
  return { label: entry.label, points };
}

function generateCustom(type, exprs, opts) {
  const points = [];
  for (const [x, y] of makeGrid(opts)) {
    let vx, vy;
    if (type === "gradient") {
      const g = numericalGradient(exprs.f, x, y);
      vx = g.vx; vy = g.vy;
    } else {
      vx = safeEval(exprs.fx, x, y);
      vy = safeEval(exprs.fy, x, y);
    }
    if (vx === null || vy === null || !isFinite(vx) || !isFinite(vy)) continue;
    points.push({ x, y, vx: +vx.toFixed(4), vy: +vy.toFixed(4) });
  }
  return points;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/api/functions", (req, res) => {
  const out = {};
  for (const [type, fns] of Object.entries(FUNCTIONS))
    out[type] = Object.entries(fns).map(([k,v]) => ({ key:k, label:v.label }));
  res.json(out);
});

["gradient", "curl", "divergence"].forEach((type) => {
  app.post(`/api/${type}`, (req, res) => {
    const { func, custom, exprs, xMin, xMax, yMin, yMax } = req.body;
    const opts = { xMin, xMax, yMin, yMax };
    const fnList = Object.entries(FUNCTIONS[type]).map(([k,v]) => ({ key:k, label:v.label }));

    if (custom && exprs) {
      if (type === "gradient" && !exprs.f)
        return res.status(400).json({ error: "Missing f(x,y)" });
      if (type !== "gradient" && (!exprs.fx || !exprs.fy))
        return res.status(400).json({ error: "Missing Fx or Fy" });

      const data = generateCustom(type, exprs, opts);
      if (!data.length)
        return res.status(400).json({ error: "Expression produced no valid points. Check your syntax." });

      const label = type === "gradient" ? `f = ${exprs.f}` : `F = (${exprs.fx},  ${exprs.fy})`;
      return res.json({ type, func:"custom", label, custom:true, functions:fnList, data });
    }

    const key = func || Object.keys(FUNCTIONS[type])[0];
    const result = generatePredefined(type, key, opts);
    if (!result) return res.status(400).json({ error: "Unknown function" });
    res.json({ type, func:key, label:result.label, functions:fnList, data:result.points });
  });
});

app.listen(4000, () => console.log("✦ Vector API → http://localhost:4000"));

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Predefined Functions ─────────────────────────────────────────────────────

const FUNCTIONS = {
  gradient: {
    quadratic:  { label: "f = x² + y²",           fn: (x,y) => ({ vx: 2*x,                        vy: 2*y                        }), diff: { form: "∇f = (∂f/∂x,  ∂f/∂y)", result: "∇f = (2x,  2y)",                                  steps: ["∂f/∂x = 2x", "∂f/∂y = 2y"] } },
    saddle:     { label: "f = x² - y²",           fn: (x,y) => ({ vx: 2*x,                        vy: -2*y                       }), diff: { form: "∇f = (∂f/∂x,  ∂f/∂y)", result: "∇f = (2x,  -2y)",                                 steps: ["∂f/∂x = 2x", "∂f/∂y = -2y"] } },
    gaussian:   { label: "f = e^(-(x²+y²))",      fn: (x,y) => { const e=Math.exp(-(x*x+y*y)); return { vx:-2*x*e, vy:-2*y*e }; }, diff: { form: "∇f = (∂f/∂x,  ∂f/∂y)", result: "∇f = (-2x·e^(-(x²+y²)),  -2y·e^(-(x²+y²)))",   steps: ["∂f/∂x = -2x·e^(-(x²+y²))  [chain rule]", "∂f/∂y = -2y·e^(-(x²+y²))  [chain rule]"] } },
    sine:       { label: "f = sin(x)·cos(y)",     fn: (x,y) => ({ vx: Math.cos(x)*Math.cos(y),   vy: -Math.sin(x)*Math.sin(y)  }), diff: { form: "∇f = (∂f/∂x,  ∂f/∂y)", result: "∇f = (cos(x)·cos(y),  -sin(x)·sin(y))",          steps: ["∂f/∂x = cos(x)·cos(y)", "∂f/∂y = -sin(x)·sin(y)"] } },
    log:        { label: "f = ln(x²+y²+1)",       fn: (x,y) => { const d=x*x+y*y+1; return { vx:(2*x)/d, vy:(2*y)/d }; },         diff: { form: "∇f = (∂f/∂x,  ∂f/∂y)", result: "∇f = (2x/(x²+y²+1),  2y/(x²+y²+1))",            steps: ["∂f/∂x = 2x / (x²+y²+1)", "∂f/∂y = 2y / (x²+y²+1)"] } },
    cubic:      { label: "f = x³ - 3xy²",         fn: (x,y) => ({ vx: 3*x*x-3*y*y,              vy: -6*x*y                     }), diff: { form: "∇f = (∂f/∂x,  ∂f/∂y)", result: "∇f = (3x²-3y²,  -6xy)",                           steps: ["∂f/∂x = 3x² - 3y²", "∂f/∂y = -6xy"] } },
    ripple:     { label: "f = sin(x²+y²)",        fn: (x,y) => { const c=Math.cos(x*x+y*y); return { vx:2*x*c, vy:2*y*c }; },     diff: { form: "∇f = (∂f/∂x,  ∂f/∂y)", result: "∇f = (2x·cos(x²+y²),  2y·cos(x²+y²))",           steps: ["∂f/∂x = 2x·cos(x²+y²)  [chain rule]", "∂f/∂y = 2y·cos(x²+y²)  [chain rule]"] } },
    hyperbolic: { label: "f = x·y",               fn: (x,y) => ({ vx: y,                          vy: x                          }), diff: { form: "∇f = (∂f/∂x,  ∂f/∂y)", result: "∇f = (y,  x)",                                    steps: ["∂f/∂x = y", "∂f/∂y = x"] } },
  },
  curl: {
    rotation:   { label: "F = (-y, x)",                       fn: (x,y) => ({ vx:-y,                       vy:x                        }), diff: { form: "curl(F) = ∂Fy/∂x − ∂Fx/∂y", result: "curl(F) = 1 − (−1) = 2",                              steps: ["∂Fy/∂x = ∂(x)/∂x = 1", "∂Fx/∂y = ∂(−y)/∂y = −1", "curl = 1 − (−1) = 2"] } },
    vortex:     { label: "F = (-y, x)/(r²+ε)",               fn: (x,y) => { const r2=x*x+y*y+0.1; return { vx:-y/r2, vy:x/r2 }; },      diff: { form: "curl(F) = ∂Fy/∂x − ∂Fx/∂y", result: "curl(F) ≈ 2ε/(r²+ε)²",                               steps: ["Fx = -y/(r²+ε),  Fy = x/(r²+ε)", "Apply quotient rule to each", "curl ≈ 2ε/(r²+ε)²  [concentrated near origin]"] } },
    saddleCurl: { label: "F = (y², x²)",                     fn: (x,y) => ({ vx:y*y,                      vy:x*x                      }), diff: { form: "curl(F) = ∂Fy/∂x − ∂Fx/∂y", result: "curl(F) = 2x − 2y",                                  steps: ["∂Fy/∂x = ∂(x²)/∂x = 2x", "∂Fx/∂y = ∂(y²)/∂y = 2y", "curl = 2x − 2y"] } },
    sinCurl:    { label: "F = (sin(y), sin(x))",             fn: (x,y) => ({ vx:Math.sin(y),              vy:Math.sin(x)              }), diff: { form: "curl(F) = ∂Fy/∂x − ∂Fx/∂y", result: "curl(F) = cos(x) − cos(y)",                          steps: ["∂Fy/∂x = cos(x)", "∂Fx/∂y = cos(y)", "curl = cos(x) − cos(y)"] } },
    spiralCurl: { label: "F = (x-y, x+y)",                   fn: (x,y) => ({ vx:x-y,                      vy:x+y                      }), diff: { form: "curl(F) = ∂Fy/∂x − ∂Fx/∂y", result: "curl(F) = 1 − (−1) = 2",                              steps: ["∂Fy/∂x = ∂(x+y)/∂x = 1", "∂Fx/∂y = ∂(x−y)/∂y = −1", "curl = 2"] } },
    doubleCurl: { label: "F = (sin(x)cos(y), -cos(x)sin(y))",fn: (x,y) => ({ vx:Math.sin(x)*Math.cos(y), vy:-Math.cos(x)*Math.sin(y) }), diff: { form: "curl(F) = ∂Fy/∂x − ∂Fx/∂y", result: "curl(F) = 2·sin(x)·sin(y)",                          steps: ["∂Fy/∂x = sin(x)·sin(y)", "∂Fx/∂y = −sin(x)·sin(y)  → negated = sin(x)·sin(y)", "curl = sin(x)sin(y) + sin(x)sin(y) = 2sin(x)sin(y)"] } },
    shear:      { label: "F = (y, 0)",                       fn: (x,y) => ({ vx:y,                         vy:0                        }), diff: { form: "curl(F) = ∂Fy/∂x − ∂Fx/∂y", result: "curl(F) = 0 − 1 = −1",                               steps: ["∂Fy/∂x = ∂(0)/∂x = 0", "∂Fx/∂y = ∂(y)/∂y = 1", "curl = 0 − 1 = −1"] } },
    hurricane:  { label: "F = hurricane field",              fn: (x,y) => { const e=Math.exp(-Math.sqrt(x*x+y*y)*0.3); return { vx:-y*e, vy:x*e }; }, diff: { form: "curl(F) = ∂Fy/∂x − ∂Fx/∂y", result: "curl(F) = e^(−0.3r)·(2 − 0.3r)", steps: ["Fx = −y·e^(−0.3r),  Fy = x·e^(−0.3r)", "Product rule + chain rule on each term", "curl = e^(−0.3r)·(2 − 0.3r)"] } },
  },
  divergence: {
    source:    { label: "F = (x, y) — source",    fn: (x,y) => ({ vx:x,              vy:y             }), diff: { form: "div(F) = ∂Fx/∂x + ∂Fy/∂y", result: "div(F) = 1 + 1 = 2",           steps: ["∂Fx/∂x = ∂(x)/∂x = 1",      "∂Fy/∂y = ∂(y)/∂y = 1",       "div = 1 + 1 = 2"] } },
    sink:      { label: "F = (-x, -y) — sink",    fn: (x,y) => ({ vx:-x,             vy:-y            }), diff: { form: "div(F) = ∂Fx/∂x + ∂Fy/∂y", result: "div(F) = −1 + (−1) = −2",     steps: ["∂Fx/∂x = −1",                "∂Fy/∂y = −1",                 "div = −2"] } },
    mixed:     { label: "F = (x², -y²)",          fn: (x,y) => ({ vx:x*x,            vy:-y*y          }), diff: { form: "div(F) = ∂Fx/∂x + ∂Fy/∂y", result: "div(F) = 2x + (−2y) = 2x−2y", steps: ["∂Fx/∂x = 2x",                "∂Fy/∂y = −2y",                "div = 2x − 2y"] } },
    radial:    { label: "F = (x,y)/(r+ε)",        fn: (x,y) => { const r=Math.sqrt(x*x+y*y)+0.01; return { vx:x/r, vy:y/r }; }, diff: { form: "div(F) = ∂Fx/∂x + ∂Fy/∂y", result: "div(F) = 1/r", steps: ["Fx = x/r,  Fy = y/r,  r=√(x²+y²)", "(r²−x²)/r³ + (r²−y²)/r³", "= (2r²−r²)/r³ = 1/r"] } },
    sinDiv:    { label: "F = (sin(x), cos(y))",   fn: (x,y) => ({ vx:Math.sin(x),    vy:Math.cos(y)   }), diff: { form: "div(F) = ∂Fx/∂x + ∂Fy/∂y", result: "div(F) = cos(x) + (−sin(y))",  steps: ["∂Fx/∂x = cos(x)",             "∂Fy/∂y = −sin(y)",            "div = cos(x) − sin(y)"] } },
    explosion: { label: "F = (x·e^-r², y·e^-r²)", fn: (x,y) => { const e=Math.exp(-(x*x+y*y)*0.3); return { vx:x*e, vy:y*e }; }, diff: { form: "div(F) = ∂Fx/∂x + ∂Fy/∂y", result: "div(F) = e^(−0.3r²)·(2 − 0.6r²)", steps: ["Fx=x·e^(−0.3r²), Fy=y·e^(−0.3r²)", "Product rule: ∂Fx/∂x = e^(−0.3r²) − 0.6x²·e^(−0.3r²)", "div = e^(−0.3r²)·(2 − 0.6r²)"] } },
    wave:      { label: "F = (cos(x), sin(y))",   fn: (x,y) => ({ vx:Math.cos(x),    vy:Math.sin(y)   }), diff: { form: "div(F) = ∂Fx/∂x + ∂Fy/∂y", result: "div(F) = −sin(x) + cos(y)",    steps: ["∂Fx/∂x = −sin(x)",            "∂Fy/∂y = cos(y)",             "div = −sin(x) + cos(y)"] } },
    dipole:    { label: "F = (2xy, x²-y²)",       fn: (x,y) => ({ vx:2*x*y,          vy:x*x-y*y       }), diff: { form: "div(F) = ∂Fx/∂x + ∂Fy/∂y", result: "div(F) = 2y + (−2y) = 0  ✓ divergence-free!", steps: ["∂Fx/∂x = 2y", "∂Fy/∂y = −2y", "div = 0"] } },
  },
};

// ─── Safe evaluator ───────────────────────────────────────────────────────────
// Allows: digits, x, y, operators, parens, dots, math fn names, e/E for sci notation
function safeEval(expr, x, y) {
  // Step 1: replace ^ with **
  let sanitized = expr.replace(/\^/g, "**");
  // Step 2: only allow safe characters  (letters needed for sin/cos/etc, digits, operators)
  sanitized = sanitized.replace(/[^0-9a-zA-Z_\+\-\*\/\(\)\.\s]/g, "");
  try {
    const fn = new Function(
      "x","y","sin","cos","tan","exp","log","sqrt","abs","PI","E",
      `"use strict"; return (${sanitized});`
    );
    const result = fn(
      x, y,
      Math.sin, Math.cos, Math.tan, Math.exp, Math.log, Math.sqrt, Math.abs, Math.PI, Math.E
    );
    return isFinite(result) ? +result : null;
  } catch { return null; }
}

// ─── Numerical calculus helpers ───────────────────────────────────────────────

function numericalGradient(expr, x, y) {
  const h = 1e-5;
  const vx = (safeEval(expr, x+h, y) - safeEval(expr, x-h, y)) / (2*h);
  const vy = (safeEval(expr, x, y+h) - safeEval(expr, x, y-h)) / (2*h);
  return { vx, vy };
}

function numericalPartials(exprFx, exprFy, x, y) {
  const h = 1e-5;
  return {
    dFx_dx: (safeEval(exprFx, x+h, y) - safeEval(exprFx, x-h, y)) / (2*h),
    dFx_dy: (safeEval(exprFx, x, y+h) - safeEval(exprFx, x, y-h)) / (2*h),
    dFy_dx: (safeEval(exprFy, x+h, y) - safeEval(exprFy, x-h, y)) / (2*h),
    dFy_dy: (safeEval(exprFy, x, y+h) - safeEval(exprFy, x, y-h)) / (2*h),
  };
}

function fmt(n) { return n === null ? "undef" : n.toFixed(4); }

// Build diff info for custom functions using numerical values
function buildCustomDiff(type, exprs) {
  const samples = [[1,0],[0,1],[1,1],[-1,1],[2,-1]];

  if (type === "gradient") {
    const rows = samples.map(([x,y]) => {
      const g = numericalGradient(exprs.f, x, y);
      return `at (${x},${y}):  ∂f/∂x ≈ ${fmt(g.vx)},  ∂f/∂y ≈ ${fmt(g.vy)}`;
    });
    return {
      form:   "∇f = (∂f/∂x,  ∂f/∂y)",
      result: `∇[${exprs.f}]  — computed via finite difference`,
      steps: [
        `f(x,y) = ${exprs.f}`,
        "Method: central finite difference  (h = 1×10⁻⁵)",
        "∂f/∂x ≈ [f(x+h,y) − f(x−h,y)] / 2h",
        "∂f/∂y ≈ [f(x,y+h) − f(x,y−h)] / 2h",
        "── Sample values ──",
        ...rows,
      ],
    };
  }

  if (type === "curl") {
    const rows = samples.map(([x,y]) => {
      const p = numericalPartials(exprs.fx, exprs.fy, x, y);
      const curl = p.dFy_dx - p.dFx_dy;
      return `at (${x},${y}):  ∂Fy/∂x ≈ ${fmt(p.dFy_dx)},  ∂Fx/∂y ≈ ${fmt(p.dFx_dy)},  curl ≈ ${fmt(curl)}`;
    });
    return {
      form:   "curl(F) = ∂Fy/∂x − ∂Fx/∂y",
      result: `curl(F) = ∂[${exprs.fy}]/∂x − ∂[${exprs.fx}]/∂y`,
      steps: [
        `Fx(x,y) = ${exprs.fx}`,
        `Fy(x,y) = ${exprs.fy}`,
        "Method: central finite difference  (h = 1×10⁻⁵)",
        "── Sample curl values ──",
        ...rows,
      ],
    };
  }

  if (type === "divergence") {
    const rows = samples.map(([x,y]) => {
      const p = numericalPartials(exprs.fx, exprs.fy, x, y);
      const div = p.dFx_dx + p.dFy_dy;
      return `at (${x},${y}):  ∂Fx/∂x ≈ ${fmt(p.dFx_dx)},  ∂Fy/∂y ≈ ${fmt(p.dFy_dy)},  div ≈ ${fmt(div)}`;
    });
    return {
      form:   "div(F) = ∂Fx/∂x + ∂Fy/∂y",
      result: `div(F) = ∂[${exprs.fx}]/∂x + ∂[${exprs.fy}]/∂y`,
      steps: [
        `Fx(x,y) = ${exprs.fx}`,
        `Fy(x,y) = ${exprs.fy}`,
        "Method: central finite difference  (h = 1×10⁻⁵)",
        "── Sample divergence values ──",
        ...rows,
      ],
    };
  }
}

// ─── Grid generator ───────────────────────────────────────────────────────────

function makeGrid(opts) {
  const xMin = isFinite(+opts.xMin) ? +opts.xMin : -4;
  const xMax = isFinite(+opts.xMax) ? +opts.xMax :  4;
  const yMin = isFinite(+opts.yMin) ? +opts.yMin : -4;
  const yMax = isFinite(+opts.yMax) ? +opts.yMax :  4;
  const steps = 14;
  const sx = (xMax - xMin) / steps;
  const sy = (yMax - yMin) / steps;
  const grid = [];
  for (let x = xMin; x <= xMax + 1e-9; x += sx)
    for (let y = yMin; y <= yMax + 1e-9; y += sy)
      grid.push([+x.toFixed(4), +y.toFixed(4)]);
  return grid;
}

function generatePredefined(type, funcKey, opts) {
  const entry = FUNCTIONS[type]?.[funcKey];
  if (!entry) return null;
  const points = [];
  for (const [x,y] of makeGrid(opts)) {
    const { vx, vy } = entry.fn(x, y);
    if (!isFinite(vx) || !isFinite(vy)) continue;
    points.push({ x, y, vx: +vx.toFixed(4), vy: +vy.toFixed(4) });
  }
  return { label: entry.label, points, diff: entry.diff };
}

function generateCustom(type, exprs, opts) {
  const points = [];
  for (const [x,y] of makeGrid(opts)) {
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

["gradient","curl","divergence"].forEach((type) => {
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
        return res.status(400).json({ error: "Expression produced no valid points. Check syntax — use * for multiply, ** or ^ for power." });

      const diff  = buildCustomDiff(type, exprs);
      const label = type === "gradient" ? `f = ${exprs.f}` : `F = (${exprs.fx},  ${exprs.fy})`;
      return res.json({ type, func:"custom", label, custom:true, functions:fnList, data, diff });
    }

    const key = func || Object.keys(FUNCTIONS[type])[0];
    const result = generatePredefined(type, key, opts);
    if (!result) return res.status(400).json({ error: "Unknown function" });
    res.json({ type, func:key, label:result.label, functions:fnList, data:result.points, diff:result.diff });
  });
});

app.listen(4000, () => console.log("✦ Vector API → http://localhost:4000"));

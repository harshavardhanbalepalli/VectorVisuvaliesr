import React from "react";
import { Link } from "react-router-dom";

const cards = [
  {
    path: "/gradient", cls: "grad", icon: "∇f", name: "Gradient", accent: "#4fffb0",
    desc: "Visualize the gradient field ∇f of a scalar function f(x,y). Arrows point in the direction of steepest ascent.",
  },
  {
    path: "/curl", cls: "curl", icon: "∇×F", name: "Curl", accent: "#ff6b6b",
    desc: "Explore rotational vector fields. Curl measures how much the field rotates or swirls around each point.",
  },
  {
    path: "/divergence", cls: "div", icon: "∇·F", name: "Divergence", accent: "#ffd166",
    desc: "Examine sources and sinks. Positive divergence = outward flow (source). Negative = inward flow (sink).",
  },
];

export default function Home() {
  return (
    <>
      <div className="home-hero">
        <p className="home-kicker">Interactive · Real-time · Educational</p>
        <h1 className="home-title">
          Vector Calculus
          <span className="line-accent">Visualizer</span>
        </h1>
        <p className="home-subtitle">
          An interactive playground for Gradient, Curl, and Divergence fields.
          Pick a predefined function or write your own — then watch the vector field render live.
        </p>
      </div>
      <div className="home-cards">
        {cards.map(c => (
          <Link key={c.path} to={c.path} className={`home-card ${c.cls}`}>
            <span className="card-icon" style={{ color: c.accent }}>{c.icon}</span>
            <div className="card-name">{c.name}</div>
            <div className="card-desc">{c.desc}</div>
            <div className="card-arrow" style={{ color: c.accent }}>Explore →</div>
          </Link>
        ))}
      </div>
    </>
  );
}

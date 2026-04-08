import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <span className="brand-sym">∇</span> VecCalc
      </NavLink>
      <NavLink to="/gradient" className={({ isActive }) => "nav-link" + (isActive ? " active-grad" : "")}>
        Gradient
      </NavLink>
      <NavLink to="/curl" className={({ isActive }) => "nav-link" + (isActive ? " active-curl" : "")}>
        Curl
      </NavLink>
      <NavLink to="/divergence" className={({ isActive }) => "nav-link" + (isActive ? " active-div" : "")}>
        Divergence
      </NavLink>
    </nav>
  );
}

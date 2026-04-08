import React from "react";
import FieldPage from "../components/FieldPage";

export default function Gradient() {
  return (
    <FieldPage
      type="gradient"
      accent="#4fffb0"
      accentClass="grad"
      tag="∇f — Gradient Field"
      title="Gradient"
      desc="The gradient ∇f of a scalar field f(x,y) is a vector field pointing in the direction of greatest increase. Its magnitude equals the rate of steepest ascent. Gradient fields are always irrotational (curl-free)."
      formula={[
        "∇f = (∂f/∂x,  ∂f/∂y)",
        "Arrow direction → steepest ascent",
        "Arrow length   → magnitude of slope",
        "Custom mode: type any f(x,y) expression",
      ]}
    />
  );
}

import React from "react";
import FieldPage from "../components/FieldPage";

export default function Curl() {
  return (
    <FieldPage
      type="curl"
      accent="#ff6b6b"
      accentClass="curl"
      tag="∇×F — Curl Field"
      title="Curl"
      desc="The curl measures the rotation of a vector field F(x,y). In 2D, curl(F) = ∂Fy/∂x − ∂Fx/∂y, a scalar that indicates how much the field swirls counterclockwise around each point."
      formula={[
        "curl(F) = ∂Fy/∂x − ∂Fx/∂y",
        "Counterclockwise swirl → positive curl",
        "Clockwise swirl        → negative curl",
        "Custom mode: enter Fx(x,y) and Fy(x,y)",
      ]}
    />
  );
}

import React from "react";
import FieldPage from "../components/FieldPage";

export default function Divergence() {
  return (
    <FieldPage
      type="divergence"
      accent="#ffd166"
      accentClass="div"
      tag="∇·F — Divergence Field"
      title="Divergence"
      desc="The divergence ∇·F measures how much a vector field spreads out from a point. Positive divergence = source (arrows pointing outward). Negative divergence = sink (arrows pointing inward)."
      formula={[
        "div(F) = ∂Fx/∂x + ∂Fy/∂y",
        "Arrows diverging outward → source (div > 0)",
        "Arrows converging inward → sink   (div < 0)",
        "Custom mode: enter Fx(x,y) and Fy(x,y)",
      ]}
    />
  );
}

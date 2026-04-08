import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Gradient from "./pages/Gradient";
import Curl from "./pages/Curl";
import Divergence from "./pages/Divergence";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gradient" element={<Gradient />} />
          <Route path="/curl" element={<Curl />} />
          <Route path="/divergence" element={<Divergence />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<App />);

// index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import particlesConfig from "./particles.json";

const container = document.getElementById("root");
const root = createRoot(container);

const RootWithParticles = () => {
  const initParticles = async (engine) => {
    await loadFull(engine);
  };

  return (
    <>
      <Particles id="tsparticles" init={initParticles} options={particlesConfig} />
      <App />
    </>
  );
};

root.render(<RootWithParticles />);

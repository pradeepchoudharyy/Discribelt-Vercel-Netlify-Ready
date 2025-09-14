
const API = "/api";

export const health = () =>
  fetch(`${API}/health`).then(r => r.json());

export const narrate = (lines) =>
  fetch(`${API}/narrate`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ lines })
  }).then(r => r.json());

export const toSvg = (text) =>
  fetch(`${API}/svg`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ text })
  }).then(r => r.json());

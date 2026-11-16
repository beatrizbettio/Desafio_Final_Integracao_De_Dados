import { auth } from "./firebase";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Se AUTH_ATIVA=true no backend, o token do Firebase vai no header.
async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`Erro ${res.status} ao falar com o servidor`);
  return res.json();
}

export const postMatch = (perfil) =>
  request("/match", { method: "POST", body: JSON.stringify(perfil) });

export const getCidades = () => request("/cidades");

export const getComparar = (origem, destino) =>
  request(`/comparar?origem=${origem}&destino=${destino}`);

export const brl = (v) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
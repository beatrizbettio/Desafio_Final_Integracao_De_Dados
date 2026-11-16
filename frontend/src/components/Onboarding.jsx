import { useState } from "react";

const CLIMAS = [
  { label: "Frio", temp: 18 },
  { label: "Ameno", temp: 22 },
  { label: "Quente", temp: 27 },
];
const UFS = ["AL","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RS","SC","SE","SP","TO"];

export default function Onboarding({ onSubmit, loading }) {
  const [salario, setSalario] = useState("");
  const [temp, setTemp] = useState(22);
  const [evitaChuva, setEvitaChuva] = useState(false);
  const [infra, setInfra] = useState(3);
  const [uf, setUf] = useState("");

  const valido = Number(salario) > 0;

  const enviar = (e) => {
    e.preventDefault();
    if (!valido) return;
    onSubmit({
      salario: Number(salario),
      temp_ideal: temp,
      evita_chuva: evitaChuva,
      uf: uf || null,
      pesos: { orcamento: 3, clima: 2, infra, idh: 1, chuva: 1 },
    });
  };

  const field = "block text-sm font-semibold mb-2";
  const chip = (ativo) =>
    `rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
      ativo ? "border-[#0e7c7b] bg-[#0e7c7b] text-white" : "border-[#b9c9cc] bg-white hover:border-[#0e7c7b]"
    }`;

  return (
    <form onSubmit={enviar} className="mx-auto max-w-xl space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Para onde você se muda?</h2>

      <div>
        <label htmlFor="salario" className={field}>Quanto você ganha por mês?</label>
        <div className="flex items-center rounded-xl border border-[#b9c9cc] bg-white px-4 focus-within:border-[#0e7c7b]">
          <span className="text-[#44606a]">R$</span>
          <input
            id="salario" type="number" min="1" inputMode="numeric" value={salario}
            onChange={(e) => setSalario(e.target.value)} placeholder="4000"
            className="w-full bg-transparent px-3 py-3 text-lg outline-none"
          />
        </div>
      </div>

      <div>
        <span className={field}>Que clima você prefere?</span>
        <div className="flex flex-wrap gap-2">
          {CLIMAS.map((c) => (
            <button type="button" key={c.label} onClick={() => setTemp(c.temp)} className={chip(temp === c.temp)}>
              {c.label} · {c.temp} °C
            </button>
          ))}
        </div>
        <input
          type="range" min="15" max="30" value={temp} onChange={(e) => setTemp(Number(e.target.value))}
          aria-label="Temperatura ideal" className="mt-4 w-full accent-[#0e7c7b]"
        />
        <p className="text-sm text-[#44606a]">Temperatura ideal: {temp} °C</p>
      </div>

      <div>
        <span className={field}>Quer evitar chuva?</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEvitaChuva(true)} className={chip(evitaChuva)}>Sim</button>
          <button type="button" onClick={() => setEvitaChuva(false)} className={chip(!evitaChuva)}>Não</button>
        </div>
      </div>

      <div>
        <label htmlFor="infra" className={field}>Quanto importam coworkings e cafés?</label>
        <input
          id="infra" type="range" min="0" max="5" step="1" value={infra}
          onChange={(e) => setInfra(Number(e.target.value))} className="w-full accent-[#0e7c7b]"
        />
        <div className="flex justify-between text-sm text-[#44606a]">
          <span>Tanto faz</span><span>Essencial</span>
        </div>
      </div>

      <div>
        <label htmlFor="uf" className={field}>Estado (opcional)</label>
        <select
          id="uf" value={uf} onChange={(e) => setUf(e.target.value)}
          className="w-full rounded-xl border border-[#b9c9cc] bg-white px-4 py-3"
        >
          <option value="">Qualquer estado</option>
          {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <button
        type="submit" disabled={!valido || loading}
        className="w-full rounded-full bg-[#0e7c7b] py-3.5 text-lg font-semibold text-white disabled:opacity-40 hover:bg-[#0b6362]"
      >
        {loading ? "Buscando…" : "Ver minhas cidades"}
      </button>
    </form>
  );
}
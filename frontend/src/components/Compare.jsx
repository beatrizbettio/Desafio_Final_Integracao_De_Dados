import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brl, getCidades, getComparar } from "../lib/api";

export default function Compare() {
  const [catalogo, setCatalogo] = useState([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [diff, setDiff] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getCidades().then(setCatalogo).catch((e) => setErro(e.message));
  }, []);

  const ca = catalogo.find((c) => String(c.id) === a);
  const cb = catalogo.find((c) => String(c.id) === b);

  // O gráfico usa o custo_estimado do catálogo; /comparar traz a diferença calculada pelo backend.
  useEffect(() => {
    setDiff(null);
    if (a && b && a !== b) getComparar(a, b).then(setDiff).catch((e) => setErro(e.message));
  }, [a, b]);

  const dados = [ca, cb].filter(Boolean).map((c) => ({ nome: `${c.nome} (${c.uf})`, custo: c.custo_estimado }));

  const select = (valor, set, rotulo) => (
    <select value={valor} onChange={(e) => set(e.target.value)} aria-label={rotulo}
      className="w-full rounded-xl border border-[#b9c9cc] bg-white px-4 py-3">
      <option value="">{rotulo}</option>
      {catalogo.map((c) => <option key={c.id} value={c.id}>{c.nome} ({c.uf})</option>)}
    </select>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Comparar custo de vida</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {select(a, setA, "Cidade de origem")}
        {select(b, setB, "Cidade de destino")}
      </div>
      {erro && <p className="text-[#b4472b]">{erro}</p>}
      {dados.length === 2 && (
        <>
          <div className="h-72 rounded-2xl border border-[#d5e0e2] bg-white p-4">
            <ResponsiveContainer>
              <BarChart data={dados}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nome" />
                <YAxis tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip formatter={(v) => brl(v)} />
                <Bar dataKey="custo" name="Custo estimado" radius={[8, 8, 0, 0]}>
                  <Cell fill="#0e7c7b" /><Cell fill="#e8a91a" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {diff && <pre className="overflow-x-auto rounded-xl bg-[#e4ecee] p-4 text-sm">{JSON.stringify(diff, null, 2)}</pre>}
          <p className="text-sm text-[#44606a]">O custo é uma estimativa baseada no PIB per capita, não em aluguel real.</p>
        </>
      )}
    </div>
  );
}
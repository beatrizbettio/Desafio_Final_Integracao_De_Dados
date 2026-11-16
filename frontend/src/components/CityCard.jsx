import { brl } from "../lib/api";

const corMatch = (m) => (m > 80 ? "#2f9e5b" : m > 60 ? "#e8a91a" : "#d4694a");
const fmt = (v, suf = "") => (v == null ? "—" : `${v}${suf}`);

export default function CityCard({ cidade, destaque, favorita, onToggleFavorita }) {
  const m = Math.round(cidade.match ?? 0);
  return (
    <article
      className={`rounded-2xl border bg-white p-5 ${destaque ? "border-[#0e7c7b] border-2 shadow-md" : "border-[#d5e0e2]"}`}
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className={`font-bold ${destaque ? "text-2xl" : "text-lg"}`}>
          {cidade.nome} <span className="font-medium text-[#44606a]">({cidade.uf})</span>
        </h3>
        <button
          onClick={() => onToggleFavorita(cidade)}
          aria-label={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={favorita}
          className={`text-2xl leading-none ${favorita ? "text-[#e8a91a]" : "text-[#b9c9cc] hover:text-[#e8a91a]"}`}
        >
          {favorita ? "★" : "☆"}
        </button>
      </header>

      <div className="mt-3">
        <div className="flex justify-between text-sm font-semibold">
          <span>Match</span><span>{m}%</span>
        </div>
        <div className="mt-1 h-2.5 rounded-full bg-[#e4ecee]" role="progressbar" aria-valuenow={m} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full transition-all" style={{ width: `${m}%`, background: corMatch(m) }} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div title="Cafés num raio de 5 km">☕ {fmt(cidade.cafes)} cafés</div>
        <div title="Coworkings num raio de 5 km">🏢 {fmt(cidade.coworkings)} coworkings</div>
        <div>🌡️ {fmt(cidade.temp_media, " °C")}</div>
        <div>📈 IDH {fmt(cidade.idh)}</div>
        <div className="col-span-2">💰 Sobra {brl(cidade.sobra)} por mês</div>
      </dl>
    </article>
  );
}
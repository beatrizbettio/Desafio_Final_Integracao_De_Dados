import CityCard from "./CityCard";

export default function Results({ cidades, loading, erro, ids, onToggleFavorita, onVoltar }) {
  if (loading)
    return (
      <div className="py-24 text-center" role="status">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d5e0e2] border-t-[#0e7c7b]" />
        <p className="mt-4 text-[#44606a]">Consultando clima e infraestrutura das cidades…</p>
      </div>
    );

  if (erro)
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">Não foi possível buscar o ranking.</p>
        <p className="text-[#44606a]">{erro}. Confira se o backend está rodando e tente de novo.</p>
        <button onClick={onVoltar} className="mt-4 underline">Voltar ao formulário</button>
      </div>
    );

  const top = cidades.slice(0, 3);
  const resto = cidades.slice(3);
  const card = (c, destaque) => (
    <CityCard key={c.id} cidade={c} destaque={destaque} favorita={ids.has(String(c.id))} onToggleFavorita={onToggleFavorita} />
  );

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Suas melhores cidades</h2>
        <button onClick={onVoltar} className="text-sm underline">Mudar critérios</button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">{top.map((c) => card(c, true))}</div>
      {resto.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">Outras opções</h3>
          <div className="grid gap-4 sm:grid-cols-2">{resto.map((c) => card(c, false))}</div>
        </>
      )}
    </div>
  );
}
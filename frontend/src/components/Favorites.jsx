export default function Favorites({ favoritas, onRemover }) {
  if (!favoritas.length)
    return <p className="py-16 text-center text-[#44606a]">Você ainda não favoritou nenhuma cidade. Toque na estrela de um resultado para salvar.</p>;

  const ordenadas = [...favoritas].sort((a, b) => (b.data?.seconds ?? 0) - (a.data?.seconds ?? 0));
  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-3xl font-bold tracking-tight">Cidades favoritas</h2>
      <ul className="divide-y divide-[#d5e0e2] rounded-2xl border border-[#d5e0e2] bg-white">
        {ordenadas.map((f) => (
          <li key={f.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-semibold">{f.nome} ({f.uf})</p>
              <p className="text-sm text-[#44606a]">
                {f.match != null && `Match ${Math.round(f.match)}%`}
                {f.data && ` · salva em ${f.data.toDate().toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <button onClick={() => onRemover(f)} className="text-2xl text-[#e8a91a]" aria-label={`Remover ${f.nome}`}>★</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
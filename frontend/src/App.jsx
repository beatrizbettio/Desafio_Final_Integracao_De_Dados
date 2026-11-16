import { useState } from "react";
import { useAuth } from "./lib/useAuth";
import { useFavoritas } from "./lib/useFavoritas";
import { postMatch } from "./lib/api";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import Results from "./components/Results";
import Favorites from "./components/Favorites";
import Compare from "./components/Compare";

const ABAS = [
  ["buscar", "Buscar"],
  ["favoritas", "Favoritas"],
  ["comparar", "Comparar"],
];

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { favoritas, ids, alternar } = useFavoritas(user?.uid);
  const [aba, setAba] = useState("buscar");
  const [cidades, setCidades] = useState(null); // null = ainda não buscou
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  if (authLoading) return null;
  if (!user) return <Login />;

  const buscar = async (perfil) => {
    setCarregando(true); setErro(""); setCidades([]);
    try {
      setCidades(await postMatch(perfil));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  const mostrandoResultados = cidades !== null || carregando;

  return (
    <div className="min-h-screen bg-[#f2f6f6] text-[#14262b]" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
      <header className="border-b border-[#d5e0e2] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-extrabold">NomadLytics</span>
          <nav className="flex gap-1">
            {ABAS.map(([id, nome]) => (
              <button key={id} onClick={() => setAba(id)} aria-current={aba === id}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${aba === id ? "bg-[#0e7c7b] text-white" : "hover:bg-[#e4ecee]"}`}>
                {nome}
              </button>
            ))}
          </nav>
          <button onClick={logout} className="text-sm underline">Sair</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {aba === "buscar" && !mostrandoResultados && <Onboarding onSubmit={buscar} loading={carregando} />}
        {aba === "buscar" && mostrandoResultados && (
          <Results cidades={cidades ?? []} loading={carregando} erro={erro} ids={ids}
            onToggleFavorita={alternar} onVoltar={() => { setCidades(null); setErro(""); }} />
        )}
        {aba === "favoritas" && <Favorites favoritas={favoritas} onRemover={alternar} />}
        {aba === "comparar" && <Compare />}
      </main>
    </div>
  );
}
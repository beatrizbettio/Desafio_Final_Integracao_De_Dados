import { useState } from "react";
import { useAuth, mensagemErro } from "../lib/useAuth";

export default function Login() {
  const { loginGoogle, loginEmail, cadastrar, recuperarSenha } = useAuth();
  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastrar"
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  const criando = modo === "cadastrar";

  const executar = async (fn) => {
    setErro(""); setAviso(""); setEnviando(true);
    try { await fn(); } catch (e) { setErro(mensagemErro(e)); } finally { setEnviando(false); }
  };

  const enviar = (e) => {
    e.preventDefault();
    if (criando && senha !== confirma) return setErro("As senhas não são iguais.");
    executar(() => (criando ? cadastrar(nome.trim(), email.trim(), senha) : loginEmail(email.trim(), senha)));
  };

  const esqueci = () => {
    if (!email.trim()) return setErro("Digite seu e-mail acima para receber o link de redefinição.");
    executar(async () => {
      await recuperarSenha(email.trim());
      setAviso("Enviamos um link de redefinição para o seu e-mail.");
    });
  };

  const trocar = () => { setModo(criando ? "entrar" : "cadastrar"); setErro(""); setAviso(""); };

  const input = "w-full rounded-xl border border-[#b9c9cc] bg-white px-4 py-3 outline-none focus:border-[#0e7c7b]";

  return (
    <main className="min-h-screen grid place-items-center px-6 bg-[#f2f6f6] text-[#14262b]"
      style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-extrabold tracking-tight">NomadLytics</h1>
        <p className="mt-2 mb-8 text-[#44606a]">
          Diga quanto você ganha e o clima que prefere. Mostramos as cidades brasileiras que mais combinam com você.
        </p>

        <h2 className="mb-4 text-xl font-bold">{criando ? "Criar conta" : "Entrar"}</h2>

        <form onSubmit={enviar} className="space-y-3">
          {criando && (
            <input className={input} placeholder="Nome" autoComplete="name" required
              value={nome} onChange={(e) => setNome(e.target.value)} aria-label="Nome" />
          )}
          <input className={input} type="email" placeholder="E-mail" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" />
          <input className={input} type="password" placeholder="Senha" required minLength={6}
            autoComplete={criando ? "new-password" : "current-password"}
            value={senha} onChange={(e) => setSenha(e.target.value)} aria-label="Senha" />
          {criando && (
            <input className={input} type="password" placeholder="Confirmar senha" required minLength={6}
              autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)}
              aria-label="Confirmar senha" />
          )}

          {erro && <p role="alert" className="text-sm text-[#b4472b]">{erro}</p>}
          {aviso && <p role="status" className="text-sm text-[#2f7d4f]">{aviso}</p>}

          <button type="submit" disabled={enviando}
            className="w-full rounded-full bg-[#0e7c7b] py-3 font-semibold text-white hover:bg-[#0b6362] disabled:opacity-50">
            {enviando ? "Aguarde…" : criando ? "Criar conta" : "Entrar"}
          </button>

          {!criando && (
            <button type="button" onClick={esqueci} className="text-sm underline text-[#44606a]">
              Esqueci minha senha
            </button>
          )}
        </form>

        <div className="my-5 flex items-center gap-3 text-sm text-[#44606a]">
          <span className="h-px flex-1 bg-[#d5e0e2]" />ou<span className="h-px flex-1 bg-[#d5e0e2]" />
        </div>

        <button onClick={() => executar(loginGoogle)} disabled={enviando}
          className="w-full rounded-full border border-[#b9c9cc] bg-white py-3 font-semibold hover:border-[#0e7c7b] disabled:opacity-50">
          Continuar com Google
        </button>

        <p className="mt-6 text-sm text-center text-[#44606a]">
          {criando ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
          <button onClick={trocar} className="font-semibold underline text-[#14262b]">
            {criando ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </div>
    </main>
  );
}
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// Traduz os códigos de erro do Firebase para mensagens úteis.
export function mensagemErro(e) {
  const m = {
    "auth/invalid-email": "Esse e-mail não parece válido.",
    "auth/missing-password": "Digite a senha.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/email-already-in-use": "Já existe uma conta com esse e-mail. Tente entrar.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente de novo.",
    "auth/popup-closed-by-user": "A janela do Google foi fechada antes de concluir.",
    "auth/network-request-failed": "Sem conexão. Verifique a internet.",
  };
  return m[e?.code] || "Não foi possível concluir. Tente novamente.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }),
    []
  );

  const value = {
    user,
    loading,
    loginGoogle: () => signInWithPopup(auth, googleProvider),
    loginEmail: (email, senha) => signInWithEmailAndPassword(auth, email, senha),
    cadastrar: async (nome, email, senha) => {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      if (nome) await updateProfile(cred.user, { displayName: nome });
      return cred;
    },
    recuperarSenha: (email) => sendPasswordResetEmail(auth, email),
    logout: () => signOut(auth),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
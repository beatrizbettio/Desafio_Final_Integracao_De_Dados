import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// usuarios/{uid}/favoritas/{idCidade}  ->  { nome, uf, match, data }
export function useFavoritas(uid) {
  const [favoritas, setFavoritas] = useState([]);

  useEffect(() => {
    if (!uid) return setFavoritas([]);
    return onSnapshot(collection(db, "usuarios", uid, "favoritas"), (snap) =>
      setFavoritas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [uid]);

  const ids = new Set(favoritas.map((f) => f.id));

  const alternar = async (cidade) => {
    const ref = doc(db, "usuarios", uid, "favoritas", String(cidade.id));
    if (ids.has(String(cidade.id))) return deleteDoc(ref);
    return setDoc(ref, {
      nome: cidade.nome,
      uf: cidade.uf,
      match: cidade.match ?? null,
      data: serverTimestamp(),
    });
  };

  return { favoritas, ids, alternar };
}
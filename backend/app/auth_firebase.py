# Responsável em conferir se quem chamou a API está logado no Firebase

import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Header, HTTPException
from dotenv import load_dotenv

load_dotenv()

# Caminho da chave: backend/firebase-key.json
CHAVE = Path(__file__).resolve().parent.parent / "firebase-key.json"
_iniciado = False


def _iniciar_firebase():
    """Conecta ao Firebase uma única vez (na primeira necessidade)."""
    global _iniciado
    if not _iniciado:
        firebase_admin.initialize_app(credentials.Certificate(str(CHAVE)))
        _iniciado = True


def usuario_logado(authorization: str = Header(None)):
    """Dependência do FastAPI: roda antes do endpoint.
    Lê o cabeçalho 'Authorization: Bearer <token>' e valida o token."""

    # Modo desenvolvimento: autenticação desligada, deixa passar.
    if os.getenv("AUTH_ATIVA", "false").lower() != "true":
        return {"uid": "dev", "email": "dev@local"}

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente")

    token = authorization.split(" ", 1)[1]   # pega só o texto depois de "Bearer "
    try:
        _iniciar_firebase()
        return auth.verify_id_token(token)   # devolve dados: uid, email, name...
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
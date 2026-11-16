# Responsável por guardar as respostas das APIs externas através do SQLite

# Cache simples (chave -> valor) com prazo de validade, usando SQLite
import sqlite3
import json
import time
from pathlib import Path

# O arquivo cache.db fica na pasta backend/
DB = Path(__file__).resolve().parent.parent / "cache.db"

def _conn():
    """Abre o banco e cria a tabela na primeira vez."""
    c = sqlite3.connect(DB)
    c.execute("""CREATE TABLE IF NOT EXISTS cache(
        chave TEXT PRIMARY KEY,   -- ex: "clima:15"
        valor TEXT,               -- o resultado, guardado como texto JSON
        criado_em REAL            -- momento em que foi salvo (timestamp)
    )""")
    return c

def get(chave, ttl=86400):
    """Busca no cache. ttl = validade em segundos (padrão: 1 dia).
    Retorna o valor guardado ou None se não existe / já venceu."""
    c = _conn()
    linha = c.execute(
        "SELECT valor, criado_em FROM cache WHERE chave = ?", (chave,)
    ).fetchone()
    c.close()
    if linha and time.time() - linha[1] < ttl:
        # Converte o texto JSON de volta em dicionário
        return json.loads(linha[0])  
    return None

def set(chave, valor):
    """Guarda (ou substitui) um valor no cache."""
    c = _conn()
    c.execute(
        "REPLACE INTO cache VALUES (?, ?, ?)",
        (chave, json.dumps(valor), time.time()),
    )
    c.commit()   
    c.close()
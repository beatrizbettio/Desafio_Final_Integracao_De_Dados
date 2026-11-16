# Responsável por buscar as cidades no PostgreSQL (Neon)

# Para ler as variáveis de ambiente
import os  
# Bibliotecas do Postgres
import psycopg2                
import psycopg2.extras
# Para ler o .env
from dotenv import load_dotenv 

# Carrega o .env para dentro das variáveis de ambiente do Python
load_dotenv()

def get_conn():
    """Abre uma conexão nova com o banco usando a DATABASE_URL do .env."""
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def get_cidades():
    """Retorna TODAS as cidades da tabela, em ordem alfabética."""
    conn = get_conn()
    try:
        # RealDictCursor faz cada linha virar um dicionário: {"id": 1, "nome": "Natal", "uf": "RN", ...}
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM cidades ORDER BY nome")
        return cur.fetchall() 
    finally:
        conn.close()            

def get_cidade(id_cidade: int):
    """Retorna UMA cidade pelo id (ou None se não existir)."""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # %s é um parâmetro: o psycopg2 insere o valor de forma segura
        cur.execute("SELECT * FROM cidades WHERE id = %s", (id_cidade,))
        return cur.fetchone()
    finally:
        conn.close()
# API do NomadLytics: catálogo de cidades, match personalizado e comparador

from typing import Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.auth_firebase import usuario_logado
from app.db_postgres import get_cidades, get_cidade
from app.services.clima import clima_cidade
from app.services.infra import infra_cidade
from app.services.score import calcula_score, pre_score, PESOS_PADRAO

app = FastAPI(title="NomadLytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Perfil(BaseModel):
    """Formato do que o React envia no /match.
    O FastAPI valida automaticamente: se faltar salário, devolve erro 422."""
    salario: float = Field(gt=0)             
    temp_ideal: float = 25                   
    evita_chuva: bool = False
    uf: Optional[str] = None                 
    pesos: dict = PESOS_PADRAO               

@app.get("/")
def raiz():
    return {"status": "ok", "app": "NomadLytics"}

@app.get("/cidades")
def listar():
    """Catálogo completo (390 cidades)."""
    return get_cidades()

@app.get("/cidade/{id_cidade}")
def detalhe(id_cidade: int, usuario=Depends(usuario_logado)):
    """Detalhe de uma cidade, já com clima e infraestrutura."""
    cidade = get_cidade(id_cidade)
    if not cidade:
        raise HTTPException(status_code=404, detail="Cidade não encontrada")
    clima = clima_cidade(cidade["id"], cidade["latitude"], cidade["longitude"])
    infra = infra_cidade(cidade["id"], cidade["latitude"], cidade["longitude"])
    return {**cidade, **clima, **infra}

@app.post("/match")
def match(perfil: Perfil, usuario=Depends(usuario_logado)):
    """Recebe o perfil e devolve as 10 cidades mais compatíveis."""
    p = perfil.model_dump()   

    # 1) Pega todas as cidades do banco
    cidades = get_cidades()

    # 2) Filtros simples: estado (se pedido) e cidades que cabem no salário
    if p["uf"]:
        cidades = [c for c in cidades if c["uf"] == p["uf"].upper()]
    cidades = [c for c in cidades if float(c["custo_estimado"]) <= p["salario"]]

    # 3) Pré-seleção: ordena pela nota rápida (só dados do banco) e fica com as 20 melhores cidades
    cidades.sort(key=lambda c: pre_score(c, p), reverse=True)
    candidatas = cidades[:20]

    # 4) Para cada candidata: busca clima e infra (usando o cache) e calcula o score
    resultados = []
    for c in candidatas:
        clima = clima_cidade(c["id"], c["latitude"], c["longitude"])
        infra = infra_cidade(c["id"], c["latitude"], c["longitude"])
        score = calcula_score(c, clima, infra, p)
        # Junta tudo num único dicionário para a interface exibir em card
        resultados.append({**c, **clima, **infra, **score})

    # 5) Ordena pelo match (maior primeiro) e devolve o Top 10
    resultados.sort(key=lambda r: r["match"], reverse=True)
    return resultados[:10]


@app.get("/comparar")
def comparar(origem: int, destino: int, usuario=Depends(usuario_logado)):
    """Compara o custo de duas cidades. Uso: /comparar?origem=10&destino=25"""
    a = get_cidade(origem)
    b = get_cidade(destino)
    if not a or not b:
        raise HTTPException(status_code=404, detail="Cidade não encontrada")

    custo_a = float(a["custo_estimado"])
    custo_b = float(b["custo_estimado"])
    return {
        "origem": a,
        "destino": b,
        "diferenca_custo": round(custo_b - custo_a, 2),
        "diferenca_percentual": round((custo_b - custo_a) / custo_a * 100, 1),
    }
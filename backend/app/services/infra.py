# Responsável por contar coworkings e cafés em um raio de 5km do centro da cidade (API Overpass consulta OpenStreetMap)

import time
import requests
from app import cache_sqlite as cache

# Lista de servidores
SERVIDORES = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
TENTATIVAS = 1   

def _consultar(consulta):
    """Envia a consulta tentando todos os servidores, com pausa crescente.
    Retorna a lista de elementos, ou None se tudo falhou."""
    for tentativa in range(TENTATIVAS):
        for url in SERVIDORES:
            try:
                resposta = requests.post(
                    url,
                    data={"data": consulta},
                    headers={"User-Agent": "NomadLytics-projeto-faculdade"},
                    timeout=15,
                )
                resposta.raise_for_status()
                dados = resposta.json()

                # Às vezes o servidor responde 200 mas avisa de um erro interno
                if "remark" in dados and "error" in dados["remark"].lower():
                    raise RuntimeError(dados["remark"])

                return dados["elements"]
            except Exception as erro:
                print(f"[infra] {url} falhou (rodada {tentativa + 1}): {erro}")
        # Espera antes da próxima rodada: 3s, depois 6s, depois 9s
        time.sleep(3 * (tentativa + 1))
    return None

def infra_cidade(id_cidade, lat, lon, raio=5000):
    """Retorna {"coworkings": N, "cafes": N}. Raio em metros (5000 = 5 km)."""

    chave = f"infra:{id_cidade}"
    guardado = cache.get(chave, ttl=30 * 86400)
    if guardado:
        return guardado

    consulta = f"""
    [out:json][timeout:25];
    (
      nwr["amenity"="coworking_space"](around:{raio},{lat},{lon});
      nwr["office"="coworking"](around:{raio},{lat},{lon});
      nwr["amenity"="cafe"](around:{raio},{lat},{lon});
    );
    out tags;
    """

    elementos = _consultar(consulta)
    if elementos is None:
        # Todas as tentativas falharam: devolve None e não grava no cache
        print(f"[infra] desisti da cidade {id_cidade}")
        return {"coworkings": None, "cafes": None}

    coworkings = 0
    cafes = 0
    for e in elementos:
        tags = e.get("tags", {})
        if tags.get("amenity") == "coworking_space" or tags.get("office") == "coworking":
            coworkings += 1
        elif tags.get("amenity") == "cafe":
            cafes += 1

    resultado = {"coworkings": coworkings, "cafes": cafes}
    cache.set(chave, resultado)
    return resultado
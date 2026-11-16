# Responsável por buscar a temperatura média e chuva anual na API Open-Meteo

import requests
from datetime import date, timedelta
from app import cache_sqlite as cache

URL = "https://archive-api.open-meteo.com/v1/archive"

def clima_cidade(id_cidade, lat, lon):
    """Retorna {"temp_media": °C, "chuva_anual_mm": mm} da cidade.
    Se a API falhar, retorna valores None (o score trata isso)."""

    # 1) Primeiro tenta o cache (validade de 30 dias)
    chave = f"clima:{id_cidade}"
    guardado = cache.get(chave, ttl=30 * 86400)
    if guardado:
        return guardado

    # 2) Não estava no cache: monta o período de 1 ano (como a API de histórico tem uns dias de atraso, então terminamos 5 dias atrás)
    fim = date.today() - timedelta(days=5)
    inicio = fim - timedelta(days=364)

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": inicio.isoformat(),   
        "end_date": fim.isoformat(),
        "daily": "temperature_2m_mean,precipitation_sum",  
        "timezone": "America/Sao_Paulo",
    }

    try:
        resposta = requests.get(URL, params=params, timeout=30)
        resposta.raise_for_status()   
        diario = resposta.json()["daily"]

        # Remove dias sem dado (vêm como None)
        temps = [t for t in diario["temperature_2m_mean"] if t is not None]
        chuvas = [p for p in diario["precipitation_sum"] if p is not None]

        resultado = {
            "temp_media": round(sum(temps) / len(temps), 1),   
            "chuva_anual_mm": round(sum(chuvas)),              
        }
    except Exception as erro:
        # Não derruba o sistema: avisa no terminal e segue sem esse dado
        print(f"[clima] falhou para {id_cidade}: {erro}")
        return {"temp_media": None, "chuva_anual_mm": None}

    # Guarda para as próximas vezes
    cache.set(chave, resultado)   
    return resultado
# Responsável por calcular a compatibilidade (match) entre o perfil do usuário e cada cidade, sendo o resultado final uma média ponderada dos critérios escolhidos

import math

# Importância padrão de cada critério (o usuário pode mudar no formulário)
PESOS_PADRAO = {"orcamento": 3, "clima": 2, "infra": 3, "idh": 1, "chuva": 1}

def normaliza(valor, minimo, maximo):
    """Converte um valor para uma nota entre 0 e 1.
    Ex: normaliza(5, 0, 10) = 0.5. Valores fora da faixa são cortados em 0 ou 1."""
    if maximo == minimo:
        return 0.5
    return max(0.0, min(1.0, (valor - minimo) / (maximo - minimo)))

def nota_orcamento(custo, salario):
    """Quanto mais sobra do salário depois do custo da cidade, melhor.
    sobra = 0.5 significa que metade do salário sobra."""
    sobra = (salario - custo) / salario
    return normaliza(sobra, -0.2, 0.6)   # de -20% (no vermelho) a 60% de sobra

def nota_idh(idhm):
    """IDHM de 0.70 (nota 0) a 0.86 (nota 1)."""
    return normaliza(idhm, 0.700, 0.860)

def pre_score(cidade, perfil):
    """Nota RÁPIDA usando só dados do banco (sem chamar APIs).
    Serve para escolher as ~20 melhores candidatas antes de gastar chamadas de API."""
    pesos = {**PESOS_PADRAO, **perfil.get("pesos", {})}

    n_orc = nota_orcamento(float(cidade["custo_estimado"]), perfil["salario"])
    n_idh = nota_idh(float(cidade["idhm"]))
    # Número de empresas como "termômetro" de infraestrutura (100 empresas = nota 0, 100 mil = nota 1)
    n_emp = normaliza(math.log10(max(cidade["qtd_empresas"], 1)), 2, 5)

    soma = pesos["orcamento"] + pesos["idh"] + pesos["infra"]
    if soma == 0:
        return 0.0
    return (n_orc * pesos["orcamento"] + n_idh * pesos["idh"] + n_emp * pesos["infra"]) / soma


def calcula_score(cidade, clima, infra, perfil):
    """Nota FINAL (0 a 100) usando banco + clima + infraestrutura."""
    pesos = {**PESOS_PADRAO, **perfil.get("pesos", {})}

    # Nota de cada critério (0 a 1)
    n_orc = nota_orcamento(float(cidade["custo_estimado"]), perfil["salario"])
    n_idh = nota_idh(float(cidade["idhm"]))

    # Clima: quanto mais perto da temperatura ideal, melhor (10 °C de diferença = nota 0)
    if clima.get("temp_media") is None:
        n_clima = 0.5   # API falhou: nota neutra, não pune nem premia a cidade
    else:
        dif = abs(clima["temp_media"] - perfil["temp_ideal"])
        n_clima = 1 - normaliza(dif, 0, 10)

    # Infraestrutura: cada coworking vale 3 cafés (60 pontos ou mais = nota máxima)
    if infra.get("coworkings") is None or infra.get("cafes") is None:
        n_infra = 0.5
    else:
        n_infra = normaliza(infra["coworkings"] * 3 + infra["cafes"], 0, 60)

    # Lista de (nota, peso) que entram na média
    criterios = [
        (n_orc, pesos["orcamento"]),
        (n_clima, pesos["clima"]),
        (n_infra, pesos["infra"]),
        (n_idh, pesos["idh"]),
    ]

    # Chuva: só entra na conta se o usuário disse que quer evitar chuva
    n_chuva = None
    if perfil.get("evita_chuva"):
        if clima.get("chuva_anual_mm") is None:
            n_chuva = 0.5
        else:
            n_chuva = 1 - normaliza(clima["chuva_anual_mm"], 500, 2500)
        criterios.append((n_chuva, pesos["chuva"]))

    # Média ponderada
    total_pesos = sum(peso for _, peso in criterios)
    if total_pesos == 0:
        return {"match": 0, "detalhes": {}, "sobra_mensal": 0}
    media = sum(nota * peso for nota, peso in criterios) / total_pesos

    detalhes = {
        "orcamento": round(n_orc * 100),
        "clima": round(n_clima * 100),
        "infra": round(n_infra * 100),
        "idh": round(n_idh * 100),
    }
    if n_chuva is not None:
        detalhes["chuva"] = round(n_chuva * 100)

    return {
        "match": round(media * 100),   # nota final de 0 a 100
        "detalhes": detalhes,          # notas por critério
        "sobra_mensal": round(perfil["salario"] - float(cidade["custo_estimado"]), 2),
    }
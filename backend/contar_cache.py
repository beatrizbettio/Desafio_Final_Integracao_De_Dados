# contar_cache.py
# Mostra quantas cidades têm clima e infraestrutura no cache.

import sqlite3

conexao = sqlite3.connect("cache.db")


def contar(prefixo):
    # Conta as linhas cuja chave começa com o prefixo, ignorando as de teste.
    consulta = "SELECT count(*) FROM cache WHERE chave LIKE ? AND chave NOT LIKE ?"
    return conexao.execute(consulta, (prefixo + "%", "%teste%")).fetchone()[0]


total = conexao.execute("SELECT count(*) FROM cache").fetchone()[0]
clima = contar("clima:")
infra = contar("infra:")

print("Linhas no cache:", total)
print("Cidades com clima:", clima)
print("Cidades com infra:", infra)
print("Cidades sem infra (nota neutra):", clima - infra)

conexao.close()
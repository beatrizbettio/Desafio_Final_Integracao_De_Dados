# Responsável por buscar clima e infraestrutura de todas as cidades e guarda no cache SQLite

import sys
import time
from app.db_postgres import get_cidades
from app.services.clima import clima_cidade
from app.services.infra import infra_cidade

def main(limite):
    cidades = get_cidades()
    cidades.sort(key=lambda c: c["populacao"], reverse=True)   # maiores primeiro
    cidades = cidades[:limite]

    for i, c in enumerate(cidades, start=1):
        print(f"[{i}/{len(cidades)}] {c['nome']}-{c['uf']}")
        clima_cidade(c["id"], c["latitude"], c["longitude"])
        infra_cidade(c["id"], c["latitude"], c["longitude"])
        time.sleep(2)   # pausa de 2 segundos para não sobrecarregar as APIs gratuitas

    print("Cache pronto!")

if __name__ == "__main__":
    # Se você passou um número na linha de comando, usa como limite; senão, 400
    limite = int(sys.argv[1]) if len(sys.argv) > 1 else 400
    main(limite)
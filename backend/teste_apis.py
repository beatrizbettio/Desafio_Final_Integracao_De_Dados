# Teste das duas APIs com João Pessoa
from app.services.clima import clima_cidade
from app.services.infra import infra_cidade

# Coordenadas do centro de João Pessoa (PB)
lat, lon = -7.1195, -34.8450   

print("Clima:", clima_cidade("teste_jp", lat, lon))
print("Infra:", infra_cidade("teste_jp", lat, lon))
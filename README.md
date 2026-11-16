# NomadLytics: o radar de cidades para quem trabalha remoto

Indica a melhor cidade brasileira para morar de acordo com o salário, o clima e a infraestrutura de trabalho do usuário.

**Equipe:** Mary Emanuele Morais (RA 24001844) · Beatriz de Cassia Bettio (25000311)

---

## 1. O problema

Quem trabalha remoto pode morar em qualquer lugar, mas é difícil equilibrar ao mesmo tempo **custo de vida, clima, estrutura para trabalhar (coworkings e cafés) e qualidade de vida**. Nenhuma fonte de dados sozinha responde "para onde eu me mudo?".

## 2. A solução

O usuário informa **quanto ganha**, **qual temperatura prefere** e **se quer evitar chuva**. O sistema cruza dados de fontes diferentes e devolve um ranking de cidades com uma **porcentagem de compatibilidade (match)**, explicando a nota de cada critério.

---

### Fluxo resumido

1. O **KNIME** lê o CSV, filtra e limpa os dados e carrega o catálogo no **PostgreSQL**.
2. O **backend** busca as cidades no PostgreSQL e consulta as **APIs externas** de clima e infraestrutura.
3. As respostas das APIs ficam no **SQLite** (cache), evitando chamadas repetidas.
4. O backend calcula o **Score do Nômade** e entrega o ranking ao **React**.
5. O **Firebase** cuida do login com Google e das cidades favoritas.

---

## 3. Tecnologias

| Camada | Tecnologia |
|---|---|
| ETL | KNIME |
| Banco relacional | PostgreSQL (Neon, na nuvem) |
| Cache | SQLite |
| Autenticação e favoritos | Firebase (Authentication e Firestore) |
| Backend | Python, FastAPI, Uvicorn |
| Frontend | React (Vite), TailwindCSS, Recharts |
| APIs externas | Open-Meteo e Overpass (OpenStreetMap) |

### Os 3 bancos de dados e o papel de cada um

| Banco | Papel | Por quê |
|---|---|---|
| **PostgreSQL** | Catálogo de 390 cidades (saída do KNIME) | Dado estruturado e consolidado |
| **SQLite** | Cache das respostas das APIs, com prazo de validade | Deixa o sistema rápido, evita bloqueio por excesso de chamadas e funciona mesmo se uma API cair |
| **Firebase** | Login com Google e cidades favoritas | Autenticação pronta e dados em tempo real direto do React |

---

## 4. Fontes de dados

- **CSV Brazilian Cities** (Kaggle, compilado do IBGE): 5.578 cidades e 81 colunas. Arquivo: `data/raw/BRAZIL_CITIES_REV2022.CSV`.
- **[Open-Meteo](https://open-meteo.com/):** histórico de 1 ano de temperatura média e chuva por coordenada. Gratuita e sem chave.
- **[Overpass API](https://overpass-api.de/) (OpenStreetMap):** contagem de coworkings e cafés num raio de 5 km do centro da cidade. Gratuita e sem chave.

---

## 5. ETL no KNIME

Workflow em `knime/workflow_cidades/`. Transforma 5.578 cidades em um catálogo de **390**.

| Etapa (nó) | O que faz |
|---|---|
| CSV Reader | Lê o arquivo (5.578 linhas, 81 colunas) |
| Rule-based Row Filter | Mantém cidades com **IDHM > 0,7** e **população > 50 mil** (391 cidades) |
| Column Filter | Mantém só 8 colunas relevantes |
| Duplicate Row Filter | Remove duplicatas de nome + UF (390 cidades) |
| Math Formula | Calcula o `custo_estimado` |
| Column Renamer / Resorter | Ajusta nomes e ordem das colunas à tabela do banco |
| PostgreSQL Connector + DB Writer | Grava no PostgreSQL |

### Custo de vida estimado

O CSV não possui custo de vida real, então usamos o **PIB per capita como proxy**:

```
custo_estimado = 2500 × (min(PIB per capita, 60.000) / 30.000) ^ 0,6
```

- **2.500:** custo mensal de referência para uma cidade média.
- **30.000:** PIB per capita de referência (próximo da mediana das cidades filtradas).
- **Expoente 0,6:** suaviza a curva (o dobro do PIB não significa o dobro do custo).
- **Teto de 60.000:** evita distorção em cidades industriais, como Paulínia.

Resultado: custos entre cerca de R$ 1.000 e R$ 3.800 por mês.

---

## 6. O Score do Nômade

O match (0 a 100) é uma **média ponderada** de critérios, cada um com nota de 0 a 100:

| Critério | O que mede | Fonte |
|---|---|---|
| Orçamento | Quanto sobra do salário após o custo estimado | PostgreSQL |
| Clima | Distância entre a temperatura média e a ideal | Open-Meteo |
| Chuva | Volume anual de chuva (só entra se o usuário quiser evitar) | Open-Meteo |
| Infraestrutura | Coworkings (peso 3) + cafés num raio de 5 km | Overpass |
| Qualidade de vida | IDHM | PostgreSQL |

- O **usuário define o peso** de cada critério (padrão: orçamento 3, clima 2, infra 3, IDH 1, chuva 1).
- Se uma API falhar, o critério recebe **nota neutra (50)** e o sistema continua funcionando.
- Para não consultar as APIs das 390 cidades a cada pedido, o backend faz uma **pré-seleção** das 20 melhores candidatas usando só dados do banco, e só então busca clima e infraestrutura.

---

## 7. API (backend)

Documentação interativa (Swagger): `http://localhost:8000/docs`

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/match` | Recebe o perfil e devolve as 10 cidades mais compatíveis |
| GET | `/cidades` | Catálogo completo |
| GET | `/cidade/{id}` | Detalhe de uma cidade, com clima e infraestrutura |
| GET | `/comparar?origem=ID&destino=ID` | Diferença de custo entre duas cidades |

**Exemplo de envio para `/match`** (somente `salario` é obrigatório):

```json
{
  "salario": 4000,
  "temp_ideal": 27,
  "evita_chuva": true,
  "uf": null,
  "pesos": { "orcamento": 3, "clima": 2, "infra": 3, "idh": 1, "chuva": 1 }
}
```

Campos como `temp_media`, `coworkings` e `cafes` podem vir `null` quando uma API externa falha para a cidade.

---

## 8. Como rodar o projeto

### Pré-requisitos

Git, Python 3.10+ e Node.js (LTS).

### 1) Clonar

```bash
git clone [LINK DO REPOSITÓRIO]
cd nomadlytics
```

### 2) Arquivos que não estão no repositório

Por segurança, estes arquivos são enviados à parte pela equipe e devem ficar em `backend/`:

| Arquivo | Para quê |
|---|---|
| `.env` | Conexão com o banco (copie o `.env.example` e preencha) |
| `cache.db` | Cache de clima e infraestrutura já preenchido (deixa o `/match` rápido) |
| `firebase-key.json` | Só necessário se `AUTH_ATIVA=true` |

Exemplo de `.env`:

```
DATABASE_URL=postgresql://USUARIO:SENHA@HOST.neon.tech/neondb?sslmode=require
AUTH_ATIVA=false
```

### 3) Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Acesse `http://localhost:8000/docs` e teste o `POST /match`.

### 4) Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O front abre em `http://localhost:5173` (porta liberada no CORS do backend). Crie `frontend/.env` com:

```
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

### Scripts auxiliares (backend)

| Script | Uso |
|---|---|
| `preaquecer_cache.py` | Busca clima e infraestrutura das cidades e preenche o cache |
| `contar_cache.py` | Mostra quantas cidades já estão no cache |
| `teste_apis.py` | Testa as duas APIs externas com João Pessoa |

---

## 9. Estrutura do repositório

```
nomadlytics/
├── data/raw/BRAZIL_CITIES_REV2022.CSV
├── knime/workflow_cidades/        # ETL
├── backend/
│   ├── app/
│   │   ├── main.py                # endpoints (FastAPI)
│   │   ├── db_postgres.py         # acesso ao PostgreSQL
│   │   ├── cache_sqlite.py        # cache com SQLite
│   │   ├── auth_firebase.py       # validação do token do Firebase
│   │   └── services/
│   │       ├── clima.py           # Open-Meteo
│   │       ├── infra.py           # Overpass
│   │       └── score.py           # Score do Nômade
│   ├── preaquecer_cache.py
│   ├── contar_cache.py
│   ├── teste_apis.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/                      # React + Vite
└── README.md
```

---


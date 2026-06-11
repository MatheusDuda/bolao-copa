# Betolão ⚽

Bolão da Copa do Mundo 2026 — SPA em React + Vite + Tailwind com backend Express e persistência no Supabase (PostgreSQL).

## Setup

```bash
npm install
```

Preencha o `.env` com as credenciais do Supabase (veja seção abaixo), então:

```bash
npm start
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Login padrão

| Usuário | Senha    | Perfil |
|---------|----------|--------|
| admin   | admin123 | Admin  |

## Scripts

| Comando       | Descrição                      |
|---------------|-------------------------------|
| `npm start`   | Sobe Express + Vite juntos     |
| `npm run dev` | Só o frontend (Vite)           |
| `npm run server` | Só o backend (Express)      |

## Setup Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor do projeto, cole o conteúdo de `supabase/schema.sql` e execute
3. Em **Project Settings → API**, copie:
   - **Project URL** → `SUPABASE_URL` no `.env`
   - **service_role** secret → `SUPABASE_SERVICE_KEY` no `.env`

## Configurar API Key (football-data.org)

1. Crie conta em https://www.football-data.org
2. Copie sua API key gratuita
3. No site, acesse **Admin → Configurações** e cole a chave
4. Clique **Admin → Resultados → Sincronizar Resultados**

## Funcionalidades

- **Palpites**: placar de cada jogo, bloqueado X horas antes (configurável)
- **Pré-torneio**: campeão, artilheiro, melhor ataque/defesa, Neymar, desempenho do Brasil — bloqueado ao início do torneio
- **Sync automático**: busca resultados da Copa 2026 via football-data.org
- **Admin votando por**: admin pode registrar palpites em nome de qualquer participante
- **Classificação**: ranking em tempo real com breakdown de pontuação

## Pontuação

| Acerto | Pontos |
|--------|--------|
| Placar exato | 3 |
| Vencedor certo | 1 |
| Campeão | 10 |
| Artilheiro | 8 |
| Melhor ataque | 5 |
| Melhor defesa | 5 |
| Neymar marcou gol | 3 |
| Desempenho do Brasil | 17 |

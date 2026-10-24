<div align="center">

# ⚔️ Miravita

**Um MMORPG que roda no navegador, com classes inspiradas em matérias escolares, itens baseados na tabela periódica e monstros gerados por IA.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk&logoColor=white)](https://clerk.com)
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?logo=postgresql&logoColor=white)](https://neon.tech)
[![Gemini](https://img.shields.io/badge/IA-Gemini-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev)

[**🎮 Jogar agora**](https://miravita-three.vercel.app/) · [Reportar um bug](../../issues)

<img src="https://i.imgur.com/mILBMh7.png" alt="Tela do Miravita" width="720" />

</div>

---

## ✨ O que é

Miravita é um RPG online em que você cria personagens, explora mapas, luta em calabouços, forja equipamentos e entra em guildas. A ideia é unir a diversão de um jogo de fantasia com elementos pedagógicos: as **11 classes** vêm de disciplinas (Matemática, Física, Química, Português, Literatura, Inglês, Artes, História, Geografia, Filosofia e Biologia) e os **itens são gerados a partir dos elementos da tabela periódica**.

## 🎮 Funcionalidades

- **Personagens:** até 6 por conta, com traços, avatar por classe e curva de XP
- **Combate servidor-autoritativo:** o estado da luta fica no banco, com barra de timing e invocações
- **Calabouços:** portal com 4 ondas e chefe
- **Forja:** combine 5 elementos para gerar arma ou armadura, com atributos calculados pela tabela periódica
- **Guildas e grupos:** patentes, chat privado, grupos de até 4 jogadores e bônus de XP por aliado no mesmo mapa
- **Técnicas e domínios:** hierarquia de técnicas e uma **técnica suprema personalizável** no nível 150 (nome, grito e aspecto)
- **Missões e caçadas**, mapas com nível mínimo e teleporte
- **Chat:** local, privado, global (gritar) e de guilda, com limite de mensagens
- **Atalhos no jogo:** `Q` missões · `O` inventário · `T` técnicas · `G` guilda · `C` chat · `H` habilidades · `M` mapa

## 🤖 IA no jogo (Gemini)

- **Monstros gerados por IA:** um cron diário chama `/api/cron/monsters` e grava novos monstros no banco
- **Balanceamento assistido:** cada luta gera telemetria (`battle_logs`). Toda segunda, um cron agrega os dados e pede sugestões de ajuste ao Gemini, que podem ser revisadas em `/admin/balance`

## 🛠️ Stack

| Camada         | Tecnologias                                         |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 15 (App Router, Server Actions) e React 19  |
| Linguagem      | TypeScript                                          |
| Estilo         | Tailwind CSS 4                                      |
| Autenticação   | Clerk                                               |
| Banco de dados | PostgreSQL no Neon com Drizzle ORM                  |
| IA             | Google Gemini (`@google/genai`)                     |
| Deploy         | Vercel (com Cron Jobs)                              |

## 🧪 Rodando localmente

```bash
git clone https://github.com/tobiasteles/miravita.git
cd miravita
npm install

cp .env.example .env.local   # preencha as variáveis abaixo

npm run db:push              # cria as tabelas
npm run db:seed              # elementos, itens, classes, traços e mapas
npm run dev                  # http://localhost:3000
```

### Variáveis de ambiente

| Variável                                                   | Descrição                                          |
| ---------------------------------------------------------- | -------------------------------------------------- |
| `DATABASE_URL`                                             | Connection string do Neon                          |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`   | Chaves do Clerk                                    |
| `GEMINI_API_KEY` / `GEMINI_MODEL`                          | Chave e modelo do Gemini                           |
| `CRON_SECRET`                                              | Segredo que protege as rotas de cron               |
| `ADMIN_USER_IDS`                                           | IDs do Clerk (`user_...`) com acesso ao `/admin`   |
| `XP_MULTIPLIER`                                            | Use `30` para testar rápido; `1` é o ritmo real    |

> 💡 Para testar a IA manualmente:
> `curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-APP/api/cron/monsters`

## 📁 Estrutura

```
src/
├── actions/     # regras do jogo no servidor (batalha, guilda, forja, missões...)
├── app/         # rotas: jogo, personagens, admin, brand e API (chat, cron)
├── components/  # interface do jogo e da identidade visual
├── db/          # schema Drizzle e seeds
└── lib/         # XP, itens da tabela periódica, IA, imagens
```

## 🧠 Decisões de projeto

- **Servidor como fonte da verdade:** o combate acontece no servidor, então o cliente não consegue forjar resultados
- **Itens com lógica própria:** os atributos vêm de propriedades dos elementos químicos (`lib/game/item-stats.ts`)
- **Imagens com fallback:** o componente `SafeImg` troca por emoji ou fundo padrão quando um arquivo não existe

## 👤 Autor

**Tobias Teles** · [Portfólio](https://tobiasteles.vercel.app) · [LinkedIn](https://www.linkedin.com/in/tobias-teles/)

Se curtiu o projeto, deixe uma ⭐!

# crIA — seu marketeiro favorito

MVP de uma plataforma de marketing para pequenos negócios, construído no Hackathon OpenAI de 19/08/2026. A crIA lê o site e o Instagram de uma empresa, monta um brandbook operacional e gera criativos (imagem, campanha, Story, carrossel, post, legenda e hashtags) com a voz da marca.

## Stack

- Next.js 16 (App Router), React 19 e TypeScript
- Vercel AI SDK 6 + AI Gateway
- OpenAI GPT-5.6 Luna (texto e brandbook) e GPT Image 2 (imagem)
- Apify para coleta de site e Instagram
- Supabase Auth, Postgres e Storage (schema pronto, integração pendente)
- Zod para validação de entrada e saída estruturada
- ESLint 9 (flat config) com regras Next, React, hooks e a11y

## Executar localmente

Requer Node.js 22.13+ e pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Abra `http://localhost:3000`. Sem nenhuma credencial configurada, a interface abre normalmente: a campanha usa conteúdo demonstrativo e as rotas de imagem e brandbook respondem 503.

## Configuração

Preencha `.env.local` a partir de [`.env.example`](.env.example). Nunca versione credenciais.

| Variável | Uso | Sem ela |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway para texto, brandbook e imagem | Campanha em modo demo; imagem e brandbook 503 |
| `CRIA_TEXT_MODEL` | Modelo da campanha (padrão `openai/gpt-5.6-luna`) | Usa o padrão |
| `CRIA_BRAND_MODEL` | Modelo do brandbook (cai para `CRIA_TEXT_MODEL`) | Usa o padrão |
| `CRIA_IMAGE_MODEL` | Modelo de imagem (padrão `openai/gpt-image-2`) | Usa o padrão |
| `APIFY_API_TOKEN` | Coleta de site e Instagram | Ingestão 503 |
| `APIFY_WEBSITE_ACTOR` | Actor do crawler de site | `apify/website-content-crawler` |
| `APIFY_INSTAGRAM_ACTOR` | Actor do perfil do Instagram | `apify/instagram-profile-scraper` |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente Supabase | Clientes lançam erro se chamados |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cliente Supabase | Clientes lançam erro se chamados |
| `CRIA_TEST_TOKEN` | Bearer token das rotas pagas fora da Vercel | Ver seção de segurança |

Na Vercel o `VERCEL_OIDC_TOKEN` substitui a `AI_GATEWAY_API_KEY`.

Para preparar o banco, execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor do projeto Supabase. As políticas RLS isolam os dados pelo `auth.uid()` do proprietário.

## Estrutura do projeto

```
app/
  page.tsx                 Landing pública
  onboarding/page.tsx      Cadastro da marca (site + Instagram)
  studio/page.tsx          Estúdio de criação de imagem
  library/ brand/ planning/  Telas do produto (mockups com dados de exemplo)
  api/brand/ingest         Coleta + análise de brandbook
  api/generate/campaign    Campanha estruturada (texto)
  api/generate/image       Criativo 1:1 ou 9:16
  globals.css              Design system (tokens em :root)
components/
  landing-page.tsx         Landing
  onboarding-flow.tsx      Fluxo de onboarding, chama /api/brand/ingest
  image-studio.tsx         Estúdio de imagem, chama /api/generate/image
  product-pages.tsx        Sidebar, Biblioteca, Minha marca, Planejamento
  cria-studio.tsx          Estúdio de campanha completo (não montado em rota)
lib/
  cria.ts                  Tipos, ativos e campanha demonstrativa
  integrations/apify.ts    Chamada síncrona aos actors do Apify
  integrations/brand-analyzer.ts  Extração estruturada do brandbook
  security/api-access.ts   Bearer token, limite de corpo, content-type
  security/public-url.ts   Bloqueio de SSRF (IPs privados, localhost, sufixos internos)
  supabase/client.ts, server.ts   Clientes browser e server (ainda sem uso)
supabase/schema.sql        Tabelas, índices, RLS, grants e triggers
public/                    Ícone, mascote, favicon e logo do cliente de exemplo
```

## Fluxos

**Onboarding.** O usuário informa site (obrigatório) e Instagram (opcional). A rota de ingestão roda os dois actors do Apify em paralelo. Se o crawler do site falhar, tenta um `fetch` direto e limpa o HTML. Se tudo falhar, o modelo recebe só a URL e gera uma análise provisória com aviso. O brandbook resultante (nome, segmento, público, tom, paleta, tipografia, logos, produtos, evidências, posicionamento, diferenciais, estilo visual, pilares de conteúdo e o que evitar) é mostrado para revisão e salvo em `localStorage` sob `cria-brand-analysis`. Hoje nenhuma outra tela lê esse valor.

**Estúdio de imagem.** Prompt livre, escolha entre 1:1 e 9:16, anexos de ativos (apenas visuais). A rota chama GPT Image 2 via Gateway e devolve a imagem em base64. Os botões de salvar, editar briefing e usar na campanha ainda não têm ação.

**Campanha.** A rota recebe briefing, formato e IDs de ativos e devolve título, racional, legenda, hashtags, Story, carrossel de exatamente 3 telas e post, validados por schema Zod. O prompt de sistema proíbe inventar fatos e lista clichês a evitar. A rota está funcional, mas o componente que a consome não está montado em nenhuma página.

## APIs

| Rota | Entrada | Saída |
| --- | --- | --- |
| `POST /api/brand/ingest` | `websiteUrl`, `instagramUsername?` | `website`, `instagram`, `analysis`, `model`, `warnings`, `mode` |
| `POST /api/generate/campaign` | `prompt` (12 a 4000 chars), `format`, `assetIds` | `campaign`, `mode`, `model` |
| `POST /api/generate/image` | `prompt` (3 a 6000 chars), `format` | `image` (data URL), `mediaType`, `model`, `usage` |

Todas exigem `Content-Type: application/json`, rejeitam corpo acima de 16 KB e respondem 400 com detalhes do Zod em entrada inválida. Falhas de provedor retornam 502 com mensagem genérica. Timeouts: ingestão 90 s, campanha 60 s, imagem 120 s.

## Segurança

- **Proteção das rotas pagas.** Na Vercel (`VERCEL_ENV` definido) as rotas são públicas de propósito, para a demo do hackathon funcionar no browser. Fora da Vercel, se `CRIA_TEST_TOKEN` estiver definido ou `NODE_ENV=production`, exige-se `Authorization: Bearer <token>` com comparação em tempo constante. As telas atuais não enviam esse header, então em dev local deixe o token vazio.
- **SSRF.** A URL do site passa por `isSafePublicHttpUrl`: só HTTP/HTTPS, sem credenciais embutidas, bloqueia IPs privados e de loopback (v4 e v6) e sufixos como `.local`, `.internal`, `.nip.io`.
- **Injeção via conteúdo coletado.** O prompt do brandbook declara o material como evidência não confiável e proíbe URLs que não estejam literalmente nas fontes.
- **Logs.** Erros são registrados só pelo nome da exceção, sem payload.

## Estado do MVP

| Área | Situação |
| --- | --- |
| Landing e onboarding | Funcional, com análise real de marca |
| Estúdio de imagem | Funcional com Gateway configurado |
| API de campanha | Funcional, sem tela ligada |
| Biblioteca, Minha marca, Planejamento | Mockups estáticos com dados do "Empório Aurora" |
| Persistência | Schema Supabase pronto; nenhuma tela grava ou lê |
| Autenticação | Não implementada |

## Pontos de atenção

- Em `lib/security/api-access.ts` a variável de ambiente lida como `CRيا_DEMO_PUBLIC` contém caracteres árabes no lugar de "IA". Como o bypass por `VERCEL_ENV` vem na mesma condição, isso não afeta a Vercel, mas a flag nunca vai funcionar localmente até ser renomeada.
- `next.config.ts` libera imagens de `raw.githubusercontent.com` apenas para o mascote usado em `components/cria-studio.tsx`, que hoje não é renderizado.
- Ativos, campanhas e planejamento nas telas são dados fixos de exemplo, não vêm do brandbook analisado.

## Verificação

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Histórico

Desenvolvido em 19 e 20 de agosto de 2026 por Enrico Tucunduva e Luiz Amorim, com apoio do Codex. Deploy previsto na Vercel.

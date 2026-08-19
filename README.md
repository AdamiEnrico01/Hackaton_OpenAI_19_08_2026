# crIA — seu marketeiro favorito

MVP de uma plataforma de marketing para pequenos negócios. A crIA transforma um briefing em campanha, aplica o brandbook da empresa e entrega Story, carrossel de 3 telas, post, legenda e hashtags.

## Produto atual

- Estúdio responsivo com seleção de formato e preview ao vivo.
- Biblioteca de logo, produtos e referências descobertos no site/Instagram.
- Sugestões que enriquecem o briefing em linguagem natural.
- Campanha estruturada com GPT-5.6 Luna via Vercel AI Gateway.
- Geração de imagem preparada para GPT Image 2.
- Ingestão paralela de site e Instagram com Apify.
- Análise de brandbook: nome, segmento, público, tom, paleta, tipografia, logos, produtos, posicionamento e pilares de conteúdo.
- Schema Supabase multiempresa com RLS e rastreamento de gerações/custos.

## Stack

- Next.js 16, React 19 e TypeScript
- Vercel AI SDK + AI Gateway
- OpenAI GPT-5.6 Luna e GPT Image 2
- Supabase Auth, Postgres e Storage
- Apify para descoberta de marca e Instagram

## Executar localmente

Requer Node.js 22+ e pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Abra `http://localhost:3000`.

## Configuração

Preencha `.env.local` sem versionar credenciais:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
AI_GATEWAY_API_KEY=
CRIA_TEXT_MODEL=openai/gpt-5.6-luna
CRIA_BRAND_MODEL=openai/gpt-5.6-luna
CRIA_IMAGE_MODEL=openai/gpt-image-2
APIFY_API_TOKEN=
APIFY_WEBSITE_ACTOR=apify/website-content-crawler
APIFY_INSTAGRAM_ACTOR=apify/instagram-profile-scraper
```

Execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor do projeto Supabase. As políticas RLS isolam os dados pelo `auth.uid()` do proprietário.

## APIs

| Rota | Função |
| --- | --- |
| `POST /api/generate/campaign` | Gera estratégia, Story, carrossel, post, legenda e hashtags. |
| `POST /api/generate/image` | Gera criativo 1:1 ou 9:16 com GPT Image 2. |
| `POST /api/brand/ingest` | Coleta site/Instagram e produz o brandbook operacional. |

As rotas validam entrada com Zod. A campanha mantém um fallback demonstrativo quando o Gateway está indisponível; a ingestão devolve as fontes coletadas quando só o Apify estiver configurado.

## Verificação

```bash
pnpm typecheck
pnpm build
```

O arquivo `.env.local` está coberto pelo `.gitignore` e nunca deve ser enviado ao GitHub.

# Marcus PWA — Guia de Setup e Deploy

## Pré-requisitos

- Node.js 18+ instalado
- Conta no GitHub (gratuita)
- Conta na Vercel (gratuita): https://vercel.com
- Domínio no Hostinger (que você já tem)

---

## 1. Preparar o projeto localmente

```bash
# Entre na pasta do projeto
cd marcus-pwa

# Instale as dependências
npm install

# Rode em modo desenvolvimento para testar
npm run dev
```

Acesse http://localhost:3000 — a app deve funcionar.

### Ícones da PWA (obrigatório antes do deploy)

Crie ou exporte dois ícones (sugestão: use https://favicon.io ou Figma):
- `public/icons/icon-192.png` (192×192px)
- `public/icons/icon-512.png` (512×512px)

O ícone pode ser a inicial "M" com a cor azul `#3B82F6` num fundo branco ou colorido.

---

## 2. Subir para o GitHub

```bash
# Dentro da pasta marcus-pwa
git init
git add .
git commit -m "feat: marcus pwa inicial"

# Crie um repositório no github.com (botão New repository)
# Nome sugerido: marcus-pwa
# Deixe PRIVADO

# Conecte e faça push
git remote add origin https://github.com/SEU_USUARIO/marcus-pwa.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy na Vercel

1. Acesse https://vercel.com e faça login (pode usar sua conta GitHub)
2. Clique em **"Add New Project"**
3. Selecione o repositório `marcus-pwa`
4. Na tela de configuração:
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `.` (deixe padrão)
   - Não precisa de variáveis de ambiente
5. Clique em **Deploy**

Aguarde ~2 minutos. A Vercel vai te dar uma URL como:
`https://marcus-pwa.vercel.app`

---

## 4. Conectar domínio do Hostinger

### Na Vercel:
1. Vá em **Settings → Domains**
2. Clique **Add Domain**
3. Digite seu domínio (ex: `marcus.seudominio.com` ou `rotina.seudominio.com`)
4. A Vercel vai mostrar dois registros DNS para configurar:
   - Um registro `A` ou `CNAME`

### No Hostinger:
1. Acesse o painel do Hostinger
2. Vá em **Domínios → Gerenciar DNS** (do seu domínio)
3. Adicione os registros que a Vercel informou:
   - Para subdomínio (`marcus.seudominio.com`):
     - Tipo: **CNAME**
     - Nome: `marcus`
     - Valor: `cname.vercel-dns.com` (ou o que a Vercel indicar)
4. Aguarde até 24h para propagar (geralmente minutos)

### Alternativa — usar o domínio raiz:
Se quiser usar `seudominio.com.br` diretamente:
- Tipo: **A** → IP que a Vercel fornece
- Tipo: **AAAA** → IPv6 que a Vercel fornece

---

## 5. Instalar como PWA (para Marcus usar no celular)

### Android:
1. Abra o domínio no Chrome
2. Aparece banner "Instalar app" → toque em **Instalar**
3. O ícone aparece na tela inicial como app nativo

### iPhone (iOS):
1. Abra no Safari
2. Toque no ícone de compartilhar (□↑)
3. Role e toque em **"Adicionar à Tela de Início"**
4. Confirme — aparece na tela inicial

---

## 6. Acessar o painel admin

- Na tela principal, toque no ícone ⚙️ (canto inferior direito)
- Digite o PIN (padrão: **1234**)
- Primeira coisa a fazer: **alterar o PIN** em Configurações

---

## Estrutura do projeto

```
marcus-pwa/
├── app/
│   ├── page.tsx              # Home — visão geral do dia
│   ├── rotina/[dia]/page.tsx # Rotina por dia com checkboxes
│   ├── missoes/page.tsx      # Missões da semana
│   ├── dashboard/page.tsx    # Dashboard com gráficos
│   └── admin/page.tsx        # Admin PIN-protegido
├── components/
│   └── BottomNav.tsx         # Navegação inferior
├── lib/
│   ├── types.ts              # Interfaces TypeScript
│   ├── data.ts               # Dados padrão (tarefas, missões)
│   └── store.ts              # localStorage — leitura e escrita
└── public/
    ├── manifest.json         # Configuração PWA
    └── icons/                # Ícones (você precisa adicionar)
```

---

## Futuramente — migrar para banco de dados

Se quiser dados sincronizados entre dispositivos (tablet do Marcus + celular da mãe), a migração é simples:

1. Crie conta no **Supabase** (https://supabase.com) — gratuito até 500MB
2. Crie uma tabela `completions` com colunas: `user_id`, `date`, `day_id`, `task_id`, `completed`
3. Substitua as funções `localStorage` em `lib/store.ts` por chamadas à API do Supabase
4. Adicione autenticação leve (magic link por e-mail)

O código está estruturado exatamente para facilitar essa migração — toda a lógica de dados está isolada em `lib/store.ts`.

---

## Atualizar o app

Qualquer mudança que você fizer e enviar para o GitHub:
```bash
git add .
git commit -m "sua mensagem"
git push
```
A Vercel detecta automaticamente e faz novo deploy em ~1 minuto.

---

## PIN padrão

**1234** — Altere imediatamente no painel admin → Configurações.

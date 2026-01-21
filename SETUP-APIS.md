# 🔧 GUIA DE CONFIGURAÇÃO DE APIs - AUTNEW

## ⚠️ PROBLEMAS IDENTIFICADOS NO SEU SISTEMA

De acordo com o último system check:

### ✅ **FUNCIONANDO:**
- ✓ Servidor online
- ✓ Banco de Dados conectado
- ✓ OpenAI
- ✓ JSON2Video
- ✓ Pexels
- ✓ Pixabay

### ❌ **FALTANDO / COM ERRO:**
1. **Gemini API** - Quota excedida (precisa renovar)
2. **YouTube API** - Não testada (falta YOUTUBE_CHANNEL_ID)
3. **ElevenLabs API** - Não configurada
4. **Anthropic/Claude API** - Não configurada
5. **Groq API** - Não configurada
6. **Stability AI** - Não configurada
7. **Google OAuth** - Não configurado

---

## 🚨 AÇÕES IMEDIATAS NECESSÁRIAS

### 1️⃣ **YOUTUBE API - CONFIGURAR AGORA**

**O que você precisa fazer no Vercel:**

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Crie/pegue sua **YouTube Data API v3 Key**
3. Pegue seu **YouTube Channel ID**:
   - Vá para: https://www.youtube.com/account_advanced
   - Ou use: https://commentpicker.com/youtube-channel-id.php

**Adicione no Vercel:**
```
Variável: YOUTUBE_CHANNEL_ID
Valor: UC... (seu channel ID)
```

**Status:** ❌ **FALTA ESSA VARIÁVEL NO VERCEL!**

---

### 2️⃣ **GEMINI API - RENOVAR QUOTA**

**Problema:** `Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests`

**Solução:**

**Opção A - Criar Nova Chave (Grátis):**
1. Acesse: https://makersuite.google.com/app/apikey
2. Crie uma NOVA API Key
3. Substitua no Vercel a `GEMINI_API_KEY` atual

**Opção B - Upgrade para Paid (se acabou quota):**
1. Acesse: https://console.cloud.google.com/billing
2. Habilite billing no projeto
3. Gemini tem 1500 requests/dia grátis no tier pago

**Opção C - Usar outra IA (OpenAI já funciona):**
- Seu OpenAI já está OK, pode usar como fallback

---

## 📋 APIs OPCIONAIS (Se quiser ativar depois)

### 3️⃣ **ElevenLabs (Text-to-Speech)**
- Site: https://elevenlabs.io/
- Pegue API Key em: https://elevenlabs.io/app/settings/api-keys
- Adicione no Vercel: `ELEVENLABS_API_KEY`

### 4️⃣ **Anthropic Claude API**
- Site: https://console.anthropic.com/
- Pegue API Key em: https://console.anthropic.com/settings/keys
- Adicione no Vercel: `ANTHROPIC_API_KEY`

### 5️⃣ **Groq (IA ultrarrápida)**
- Site: https://console.groq.com/
- Pegue API Key em: https://console.groq.com/keys
- Adicione no Vercel: `GROQ_API_KEY`

### 6️⃣ **Stability AI (Image Generation)**
- Site: https://platform.stability.ai/
- Pegue API Key em: https://platform.stability.ai/account/keys
- Adicione no Vercel: `STABILITY_API_KEY`

---

## 🔥 CHECKLIST RÁPIDO - FAÇA ISSO AGORA:

```
[ ] 1. Adicionar YOUTUBE_CHANNEL_ID no Vercel
[ ] 2. Renovar/Criar nova GEMINI_API_KEY
[ ] 3. Fazer Redeploy no Vercel (Deploy > Redeploy)
[ ] 4. Testar novamente no System Check
```

---

## 🎯 COMO ADICIONAR VARIÁVEIS NO VERCEL

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Clique em **Add Environment Variable**
4. Preencha:
   - **Key:** Nome da variável (ex: `YOUTUBE_CHANNEL_ID`)
   - **Value:** Valor da chave
   - **Environment:** Selecione `Production`, `Preview`, `Development`
5. Clique em **Save**
6. **IMPORTANTE:** Depois de adicionar, faça um **Redeploy**:
   - Vá em **Deployments**
   - Clique nos 3 pontinhos da última deployment
   - Clique em **Redeploy**

---

## 📊 COMO VERIFICAR SE FUNCIONOU

Depois de fazer as mudanças:

1. Espere o deploy terminar (1-2 minutos)
2. Acesse seu sistema
3. Vá em **System Check** / **Verificação do Sistema**
4. Veja se os avisos diminuíram

---

## 🆘 SUPORTE

Se mesmo depois dessas configurações não funcionar:

1. Verifique os logs no Vercel:
   - Vercel → Functions → Clique na função com erro
2. Me envie:
   - Screenshot do erro
   - Nome da API que falhou
   - Mensagem de erro completa

---

## ✅ RESUMO DO QUE EU JÁ CORRIGI NO CÓDIGO:

1. ✅ Adicionei teste real para YouTube API
2. ✅ Adicionei validação de YOUTUBE_CHANNEL_ID
3. ✅ Melhorei logs de erro nas APIs
4. ✅ Adicionei autenticação em todas as APIs
5. ✅ Implementei fallbacks seguros quando APIs falham

**Agora só falta você adicionar as chaves no Vercel!** 🚀

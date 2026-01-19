// ============================================
// AUTNEW STARTER V1 - MOCK DATA FOR TEST MODE
// ============================================

import type {
  YouTubeMetadata,
  InteligenciaData,
  OpcaoCriacao,
  Cena,
  EntregaData,
} from '../types'

// Simulated delay to mimic real API calls
export const mockDelay = (ms: number = 1500) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// ============================================
// YOUTUBE METADATA MOCK
// ============================================
export function getMockYouTubeMetadata(url: string): YouTubeMetadata {
  const videoId = url.includes('v=') ? url.split('v=')[1]?.split('&')[0] : 'mock123'

  return {
    videoId: videoId || 'dQw4w9WgXcQ',
    titulo: 'Oração Poderosa Para Acalmar a Mente e o Coração | Paz Interior',
    canal: 'Canal Espiritual Exemplo',
    inscritos: '1.2M',
    views: 458723,
    likes: 32456,
    comentarios: 1847,
    dataPublicacao: '2024-01-15',
    diasDecorridos: 45,
    duracao: '12:34',
    tags: [
      'oração',
      'paz interior',
      'espiritualidade',
      'meditação',
      'fé',
      'acalmar a mente',
      'oração da manhã',
    ],
    descricao:
      'Uma oração poderosa para trazer paz ao seu coração e acalmar sua mente. Permita-se relaxar e sentir a presença divina...',
    thumbnailUrl: 'https://picsum.photos/seed/thumb1/1280/720',
  }
}

// ============================================
// INTELIGENCIA (PHASE 2) MOCK
// ============================================
export function getMockInteligencia(
  tema: string,
  gatilhos: string[],
  duracao: string
): InteligenciaData {
  const gatilhoTexto = gatilhos.length > 0 ? gatilhos.join(', ') : 'esperança, paz'

  return {
    deepResearch: {
      fatos: [
        `O tema "${tema}" está entre os mais buscados no nicho espiritual nos últimos 30 dias`,
        'Vídeos com orações guiadas têm 40% mais retenção que conteúdo apenas falado',
        'O público 60+ prefere narração mais lenta e pausada',
        'Gatilhos emocionais como ' + gatilhoTexto + ' aumentam engajamento em 35%',
      ],
      curiosidades: [
        'A palavra "poderosa" no título aumenta CTR em 23%',
        'Thumbnails com luz dourada performam 2x melhor neste nicho',
        'Vídeos publicados às 6h da manhã têm 45% mais views nas primeiras 24h',
      ],
      referencias: [
        'Salmo 23 - Um dos mais requisitados pelo público',
        'Oração de São Francisco - Alta taxa de compartilhamento',
        'Meditação guiada com respiração - Tendência crescente',
      ],
    },
    analiseCanal: {
      padroesSuccesso: [
        'Títulos com promessa emocional clara',
        'Thumbnails com rostos serenos e luz suave',
        'Descrições com timestamps e links úteis',
      ],
      temasRetencao: [
        tema,
        'Oração da manhã',
        'Paz interior',
        'Cura emocional',
      ],
      duracaoIdeal: duracao === '5-10min' ? '8 minutos' : duracao === '10-15min' ? '12 minutos' : '6 minutos',
      gatilhosEngajamento: [
        'Abertura com pergunta retórica',
        'Pausas para reflexão',
        'Convite para comentar experiência',
      ],
    },
    analiseConcorrente: {
      estruturaNarrativa:
        'Abertura emocional (15s) → Contextualização (30s) → Oração principal (duração variável) → Fechamento esperançoso',
      ganchosRetencao: [
        'Promessa de transformação no início',
        'Uso de música ambiente suave',
        'Pausas estratégicas para absorção',
      ],
      elementosVirais: [
        'Título com palavra "poderosa" ou "milagrosa"',
        'Thumbnail com contraste luz/sombra',
        'Primeiros 5 segundos com gancho forte',
      ],
    },
  }
}

// ============================================
// CRIACAO OPTIONS (PHASE 3) MOCK
// ============================================
export function getMockOpcoesCriacao(tema: string, gatilhos: string[]): OpcaoCriacao[] {
  const gatilhoTexto = gatilhos[0] || 'esperança'

  return [
    {
      id: 1,
      titulo: `${tema} - Uma Oração Para Renovar Sua Fé`,
      conceitoThumbnail:
        'Pessoa idosa com mãos unidas em oração, luz dourada vindo de cima, expressão de paz',
      goldenHook:
        'Você já sentiu que sua fé estava abalada? Hoje, vamos juntos renovar essa chama...',
      thumbnailUrl: 'https://picsum.photos/seed/opt1/1280/720',
      thumbnailPrompt: `Elderly person praying with golden divine light, peaceful expression, cinematic lighting, spiritual atmosphere`,
    },
    {
      id: 2,
      titulo: `Oração Poderosa de ${gatilhoTexto.charAt(0).toUpperCase() + gatilhoTexto.slice(1)} | ${tema}`,
      conceitoThumbnail:
        'Céu com raios de luz atravessando nuvens, tons dourados e azuis celestiais',
      goldenHook:
        `Se você está precisando de ${gatilhoTexto} neste momento, esta oração foi feita especialmente para você...`,
      thumbnailUrl: 'https://picsum.photos/seed/opt2/1280/720',
      thumbnailPrompt: `Heavenly sky with divine light rays through clouds, golden and celestial blue tones, spiritual, 4K`,
    },
    {
      id: 3,
      titulo: `${tema} | Palavras Que Vão Tocar Seu Coração`,
      conceitoThumbnail:
        'Coração brilhante com luz divina, mãos abertas recebendo bênçãos',
      goldenHook:
        'Pare tudo o que está fazendo. Respire fundo. As próximas palavras podem mudar seu dia...',
      thumbnailUrl: 'https://picsum.photos/seed/opt3/1280/720',
      thumbnailPrompt: `Glowing heart with divine light, open hands receiving blessings, warm golden tones, spiritual art`,
    },
  ]
}

// ============================================
// ROTEIRO (SCRIPT) MOCK
// ============================================
export function getMockRoteiro(
  tema: string,
  titulo: string,
  gatilhos: string[],
  duracao: string
): string {
  const duracaoMinutos = duracao === '5-10min' ? '8' : duracao === '10-15min' ? '12' : '5'
  const gatilhoTexto = gatilhos.join(' e ') || 'paz e esperança'

  return `# ROTEIRO: ${titulo}
Duração estimada: ${duracaoMinutos} minutos
Tema: ${tema}
Gatilhos: ${gatilhoTexto}

---

## [00:00 - 00:15] ABERTURA MAGNÉTICA

[MÚSICA SUAVE DE FUNDO]

Narrador: "Se você chegou até aqui, não foi por acaso. Deus tem uma mensagem especial para você hoje..."

[PAUSA DE 3 SEGUNDOS]

---

## [00:15 - 00:45] GANCHO EMOCIONAL

Narrador: "Quantas vezes você se sentiu perdido, sem saber para onde ir? Quantas noites passou acordado, com o coração pesado?"

[PAUSA]

"Hoje, nesta oração sobre ${tema}, vamos juntos buscar ${gatilhoTexto}."

---

## [00:45 - 01:30] CTA ABERTURA

Narrador: "Antes de começarmos, se você ainda não é inscrito no canal, se inscreva e ative o sininho. Assim você recebe todas as nossas orações diárias."

---

## [01:30 - ${duracaoMinutos === '12' ? '08:00' : '05:00'}] ORAÇÃO PRINCIPAL

Narrador: "Vamos orar juntos..."

[MÚSICA MAIS SUAVE]

"Senhor, neste momento eu venho até Ti com o coração aberto...

[PAUSA PARA RESPIRAÇÃO]

Peço que derrame sobre mim e sobre quem está ouvindo esta oração, toda a ${gatilhoTexto} que tanto precisamos...

[PAUSA]

Sei que muitos estão passando por momentos difíceis, enfrentando ${tema.toLowerCase()}...

Mas também sei que Tu és maior do que qualquer problema...

[PAUSA LONGA]

Amém."

---

## [${duracaoMinutos === '12' ? '08:00' : '05:00'} - ${duracaoMinutos === '12' ? '09:30' : '06:30'}] CTA MEIO

Narrador: "Se esta oração tocou seu coração, deixe um 'Amém' nos comentários. E não se esqueça de baixar nosso E-book gratuito com 30 orações poderosas - o link está na descrição."

---

## [${duracaoMinutos === '12' ? '09:30' : '06:30'} - ${duracaoMinutos === '12' ? '11:30' : '07:30'}] FECHAMENTO

Narrador: "Lembre-se: você não está sozinho. Deus está com você em cada passo do caminho.

[PAUSA]

Que a paz do Senhor esteja com você hoje e sempre."

---

## [${duracaoMinutos === '12' ? '11:30' : '07:30'} - FIM] CTA FINAL

Narrador: "Se você quer receber mais orações como esta, entre no nosso Grupo VIP do WhatsApp - o link está na descrição.

Até a próxima oração. Fique com Deus."

[FADE OUT MÚSICA]

---

**FIM DO ROTEIRO**
`
}

// ============================================
// CENAS (SCENES) MOCK
// ============================================
export function getMockCenas(_roteiro: string): Cena[] {
  return [
    {
      id: 1,
      timestamp: '00:00 - 00:15',
      texto: 'Se você chegou até aqui, não foi por acaso. Deus tem uma mensagem especial para você hoje...',
      visualSugerido: 'Nascer do sol sobre montanhas, luz dourada, atmosfera celestial',
      visualUrl: 'https://picsum.photos/seed/cena1/1920/1080',
      visualTipo: 'gerado',
    },
    {
      id: 2,
      timestamp: '00:15 - 00:45',
      texto: 'Quantas vezes você se sentiu perdido, sem saber para onde ir?',
      visualSugerido: 'Pessoa contemplativa olhando para o horizonte, silhueta ao pôr do sol',
      visualUrl: 'https://picsum.photos/seed/cena2/1920/1080',
      visualTipo: 'stock',
    },
    {
      id: 3,
      timestamp: '00:45 - 01:30',
      texto: 'Antes de começarmos, se inscreva no canal e ative o sininho...',
      visualSugerido: 'Animação suave do botão de inscrição com fundo espiritual',
      visualUrl: 'https://picsum.photos/seed/cena3/1920/1080',
      visualTipo: 'gerado',
    },
    {
      id: 4,
      timestamp: '01:30 - 05:00',
      texto: 'Vamos orar juntos... Senhor, neste momento eu venho até Ti com o coração aberto...',
      visualSugerido: 'Mãos unidas em oração com luz divina, velas acesas ao fundo',
      visualUrl: 'https://picsum.photos/seed/cena4/1920/1080',
      visualTipo: 'gerado',
    },
    {
      id: 5,
      timestamp: '05:00 - 06:30',
      texto: 'Se esta oração tocou seu coração, deixe um Amém nos comentários...',
      visualSugerido: 'Coração brilhante com partículas de luz, atmosfera esperançosa',
      visualUrl: 'https://picsum.photos/seed/cena5/1920/1080',
      visualTipo: 'gerado',
    },
    {
      id: 6,
      timestamp: '06:30 - FIM',
      texto: 'Que a paz do Senhor esteja com você hoje e sempre. Fique com Deus.',
      visualSugerido: 'Céu estrelado com luz divina descendo, sensação de paz',
      visualUrl: 'https://picsum.photos/seed/cena6/1920/1080',
      visualTipo: 'gerado',
    },
  ]
}

// ============================================
// ENTREGA (DELIVERY) MOCK
// ============================================
export function getMockEntrega(
  titulo: string,
  tema: string,
  thumbnailUrl: string,
  roteiro: string
): EntregaData {
  return {
    videoUrl: 'https://example.com/mock-video.mp4',
    thumbnailUrl: thumbnailUrl || 'https://picsum.photos/seed/final/1280/720',
    titulo,
    descricaoSEO: `${titulo}

${tema} - Uma oração especial para você que está precisando de paz e renovação espiritual.

Neste vídeo, vamos orar juntos por:
- Paz interior
- Renovação da fé
- Força para enfrentar os desafios
- Esperança para o futuro

Se esta oração tocou seu coração, deixe seu AMÉM nos comentários!

LINKS IMPORTANTES:
E-book Gratuito - 30 Orações Poderosas: [LINK]
Grupo VIP WhatsApp: [LINK]

#oração #espiritualidade #fé #pazinterior #meditação #mundodaprece

---
Mundo da Prece - Orações diárias para alimentar sua alma`,
    tags: [
      'oração',
      'oração poderosa',
      tema.toLowerCase(),
      'espiritualidade',
      'fé',
      'paz interior',
      'meditação',
      'oração da manhã',
      'oração da noite',
      'mundo da prece',
    ],
    roteiro,
    promptThumbnail: `Spiritual thumbnail with elderly person praying, golden divine light, peaceful expression, text overlay space, 4K quality`,
    publicadoYouTube: false,
  }
}

// ============================================
// THUMBNAIL GENERATION MOCK
// ============================================
export function getMockThumbnail(): string {
  const seed = Math.random().toString(36).substring(7)
  return `https://picsum.photos/seed/${seed}/1280/720`
}

// ============================================
// AUDIO/NARRATION MOCK
// ============================================
export function getMockAudioUrl(): string {
  return 'https://example.com/mock-audio.mp3'
}

// ============================================
// VIDEO RENDER MOCK
// ============================================
export function getMockVideoUrl(): string {
  return 'https://example.com/mock-rendered-video.mp4'
}

// ============================================
// API STATUS MOCK
// ============================================
export function getMockAPIStatus() {
  return [
    { name: 'Gemini', status: 'online' as const, lastCheck: new Date().toISOString(), message: '[MOCK] Simulado' },
    { name: 'OpenAI', status: 'online' as const, lastCheck: new Date().toISOString(), message: '[MOCK] Simulado' },
    { name: 'ElevenLabs', status: 'online' as const, lastCheck: new Date().toISOString(), message: '[MOCK] Simulado' },
    { name: 'JSON2Video', status: 'online' as const, lastCheck: new Date().toISOString(), message: '[MOCK] Simulado' },
    { name: 'YouTube', status: 'online' as const, lastCheck: new Date().toISOString(), message: '[MOCK] Simulado' },
  ]
}

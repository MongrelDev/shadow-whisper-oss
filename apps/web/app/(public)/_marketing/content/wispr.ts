import type { LocalizedContent } from "../lib/types";

export const wisprContent: LocalizedContent = {
  "pt-BR": {
    topic: "wispr",
    locale: "pt-BR",
    meta: {
      title: "Alternativa ao Wispr Flow: mesmo ditado, preço justo",
      description:
        "Ditado por voz com IA por R$19,90/mês, sem cobrar em dólar. Veja por que o Shadow Whisper é a alternativa ao Wispr Flow que cabe no bolso brasileiro.",
    },
    breadcrumbLabel: "Alternativa ao Wispr Flow",
    hero: {
      eyebrow: "Comparativo",
      title: "Mesmo ditado por voz.",
      highlight: "Sem cobrar em dólar.",
      lede: "O Wispr Flow cobra US$15 por mês. O Shadow Whisper faz o mesmo ditado por voz com IA por R$19,90, em reais, pensado pra quem fala português.",
      scene: {
        scene: "auto-typing",
        kicker: "Voz → texto na hora",
        title: "Fale e veja aparecer",
        description:
          "O texto surge no campo onde você está, limpo e pontuado, sem você tocar no teclado.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "O ponto",
          title: "O preço é a diferença",
          description: "A tecnologia é parecida. O que muda é quanto sai do seu bolso todo mês.",
        },
        items: [
          "Ferramenta gringa cobra em dólar, e o câmbio faz o ditado custar o triplo no fim do mês.",
          "US$15/mês viram quase R$80, caro pra uma rotina simples de falar e escrever.",
          "O Shadow Whisper cobra R$19,90 em reais, sem surpresa na fatura do cartão.",
          "Mesma proposta: você fala, a IA limpa e escreve no app que você já usa.",
        ],
      },
      {
        kind: "comparison",
        meta: {
          kicker: "Comparativo",
          title: "Shadow Whisper x Wispr Flow x Superwhisper",
          description: "Preços de referência das opções mais conhecidas de ditado por voz.",
        },
        comparison: {
          ariaLabel: "Comparação de preço entre Shadow Whisper, Wispr Flow e Superwhisper",
          criterionLabel: "Critério",
          columns: [
            { label: "Shadow Whisper", name: "sw", highlight: true },
            { label: "Wispr Flow", name: "wispr" },
            { label: "Superwhisper", name: "super" },
          ],
          rows: [
            {
              criterion: "Preço mensal",
              cells: ["R$19,90", "US$15", "~US$9 ou US$250 vitalício"],
            },
            {
              criterion: "Cobrança em real",
              cells: ["Sim", "Não", "Não"],
            },
            {
              criterion: "Limpeza e formatação por IA",
              cells: ["Sim", "Sim", "Sim"],
            },
            {
              criterion: "Pensado pra português",
              cells: ["Sim", "Parcial", "Parcial"],
            },
            {
              criterion: "Escreve em qualquer app",
              cells: ["Sim", "Sim", "Sim"],
            },
          ],
        },
      },
      {
        kind: "prose",
        muted: true,
        meta: {
          kicker: "Além do preço",
          title: "O que você ganha junto",
          description: "Não é só mais barato; é feito pro seu dia a dia.",
        },
        items: [
          "Skills: peça “deixa formal”, “resume” ou “traduz pro inglês” por voz, sem sair do fluxo.",
          "Snippets: grave um texto longo uma vez e chame ele inteiro com uma frase curta.",
          "Bilíngue: fale em português e receba o texto em inglês, pronto pra mandar pro trabalho.",
          "Privacidade: o áudio é transcrito e descartado, não fica guardado em lugar nenhum.",
        ],
      },
    ],
    faqs: [
      {
        question: "O Shadow Whisper faz o mesmo que o Wispr Flow?",
        answer:
          "Faz a mesma coisa central: você fala e a IA escreve um texto limpo e formatado em qualquer app. A diferença está no preço em reais e no foco em quem fala português.",
      },
      {
        question: "Por que é mais barato?",
        answer:
          "Porque cobramos em reais e desenhamos o serviço pro mercado brasileiro, sem repassar câmbio em dólar no seu cartão.",
      },
      {
        question: "Funciona em qualquer aplicativo?",
        answer:
          "Sim. O texto é escrito no campo ativo do seu Mac, então funciona no WhatsApp Web, Gmail, Slack, Notion, no editor de código e em qualquer outro app.",
      },
      {
        question: "Tem limite de uso?",
        answer:
          "O plano Pro é R$19,90/mês com uso para o dia a dia de quem escreve muito. Há também um plano gratuito pra você testar antes de assinar.",
      },
      {
        question: "Meu áudio é guardado?",
        answer:
          "Não. O áudio é transcrito e descartado na hora; o que permanece é apenas o texto, com você.",
      },
    ],
    faqHeading: {
      kicker: "Dúvidas",
      title: "Perguntas frequentes",
    },
    finalCta: {
      title: "Ditado por voz",
      highlight: "em real, não em dólar.",
      description: "Entre na waitlist e seja avisado quando o Shadow Whisper abrir.",
    },
  },
  en: {
    topic: "wispr",
    locale: "en",
    meta: {
      title: "Wispr Flow alternative: same dictation, fair price",
      description:
        "AI voice dictation that writes clean text in any app, for less. See why Shadow Whisper is the Wispr Flow alternative built for everyday writing.",
    },
    breadcrumbLabel: "Wispr Flow alternative",
    hero: {
      eyebrow: "Comparison",
      title: "The same voice dictation.",
      highlight: "At a fair price.",
      lede: "Wispr Flow charges US$15 a month. Shadow Whisper does the same AI voice dictation for less, built for people who write all day.",
      scene: {
        scene: "auto-typing",
        kicker: "Voice → text live",
        title: "Speak and watch it land",
        description:
          "The text appears in the field you’re in, clean and punctuated, without you touching the keyboard.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "The point",
          title: "Price is the difference",
          description:
            "The tech is similar. What changes is how much leaves your pocket each month.",
        },
        items: [
          "Most tools price the same dictation at a premium for the brand, not the experience.",
          "US$15/month adds up fast for something as simple as speaking and writing.",
          "Shadow Whisper keeps it lean: the same speak-and-write loop, for less.",
          "Same promise: you talk, the AI cleans it up and writes into the app you already use.",
        ],
      },
      {
        kind: "comparison",
        meta: {
          kicker: "Comparison",
          title: "Shadow Whisper vs Wispr Flow vs Superwhisper",
          description: "Reference prices for the best-known voice dictation options.",
        },
        comparison: {
          ariaLabel: "Price comparison between Shadow Whisper, Wispr Flow and Superwhisper",
          criterionLabel: "Criterion",
          columns: [
            { label: "Shadow Whisper", name: "sw", highlight: true },
            { label: "Wispr Flow", name: "wispr" },
            { label: "Superwhisper", name: "super" },
          ],
          rows: [
            {
              criterion: "Monthly price",
              cells: ["From R$19,90 (~US$7.49)", "US$15", "~US$9 or US$250 lifetime"],
            },
            {
              criterion: "AI cleanup and formatting",
              cells: ["Yes", "Yes", "Yes"],
            },
            {
              criterion: "Writes in any app",
              cells: ["Yes", "Yes", "Yes"],
            },
            {
              criterion: "Bilingual on command",
              cells: ["Yes", "Partial", "Partial"],
            },
            {
              criterion: "Voice skills and snippets",
              cells: ["Yes", "Partial", "Partial"],
            },
          ],
        },
      },
      {
        kind: "prose",
        muted: true,
        meta: {
          kicker: "Beyond price",
          title: "What you get along with it",
          description: "It isn’t just cheaper; it’s built for your day.",
        },
        items: [
          "Skills: ask for “make it formal”, “summarize” or “translate to English” by voice, without leaving your flow.",
          "Snippets: record a long text once and call the whole thing with a short phrase.",
          "Bilingual: speak in your language and get the text in English, ready to send to work.",
          "Privacy: the audio is transcribed and discarded, never stored anywhere.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does Shadow Whisper do the same as Wispr Flow?",
        answer:
          "It does the same core thing: you speak and the AI writes clean, formatted text in any app. The difference is the price and the focus on everyday writing.",
      },
      {
        question: "Why is it cheaper?",
        answer:
          "Because we keep the service lean and priced for everyday users instead of charging a brand premium.",
      },
      {
        question: "Does it work in any application?",
        answer:
          "Yes. The text is written into the active field on your Mac, so it works in WhatsApp Web, Gmail, Slack, Notion, your code editor and any other app.",
      },
      {
        question: "Is there a usage limit?",
        answer:
          "The Pro plan covers heavy everyday writing, and there’s a free plan so you can test before you subscribe.",
      },
      {
        question: "Is my audio stored?",
        answer:
          "No. The audio is transcribed and discarded immediately; what remains is only the text, with you.",
      },
    ],
    faqHeading: {
      kicker: "Questions",
      title: "Frequently asked questions",
    },
    finalCta: {
      title: "Voice dictation",
      highlight: "without the brand premium.",
      description: "Join the waitlist and get notified when Shadow Whisper opens up.",
    },
  },
};

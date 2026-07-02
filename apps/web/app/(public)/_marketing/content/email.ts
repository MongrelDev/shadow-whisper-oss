import type { LocalizedContent } from "../lib/types";

export const emailContent: LocalizedContent = {
  "pt-BR": {
    topic: "email",
    locale: "pt-BR",
    meta: {
      title: "Ditar e-mail: escreva falando e zere a caixa de entrada",
      description:
        "Responda e-mails falando. O Shadow Whisper transcreve, organiza e escreve um e-mail profissional, com saudação e assinatura, pronto pra enviar do seu Mac.",
    },
    breadcrumbLabel: "Ditar e-mail",
    hero: {
      eyebrow: "E-mail",
      title: "Zere a caixa de entrada",
      highlight: "falando.",
      lede: "Você fala a resposta, o Shadow Whisper escreve um e-mail bem estruturado (com saudação, parágrafos e tom certo) direto no campo onde você está digitando.",
      scene: {
        scene: "email",
        kicker: "Voz → e-mail pronto",
        title: "Da fala ao envio",
        description:
          "Fale o que quer dizer e receba um e-mail com começo, meio e fim, sem precisar reescrever nada.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "O problema",
          title: "E-mail trava o seu dia",
          description: "A caixa de entrada cheia é peso mental que ninguém consegue ignorar.",
        },
        items: [
          "Você sabe o que quer responder, mas perde dez minutos escolhendo as palavras certas.",
          "Cada e-mail pede saudação, contexto, pedido claro e despedida, e isso cansa.",
          "Responder no celular é lento e cheio de erro; no computador, sempre tem algo mais urgente.",
          "Quanto mais a caixa enche, mais difícil fica começar, e a resposta atrasa dias.",
        ],
      },
      {
        kind: "useCases",
        meta: {
          kicker: "Pra que serve",
          title: "Fale a ideia, receba o e-mail",
          description: "O Shadow Whisper cuida da forma pra você cuidar só do conteúdo.",
        },
        items: [
          {
            tag: "Estrutura",
            title: "Saudação e assinatura prontas",
            description: "Você fala o miolo, ele monta abertura, parágrafos e fechamento.",
          },
          {
            tag: "Tom",
            title: "Formal ou casual sob comando",
            description: "Peça “mais formal pro cliente” ou “mais leve pro colega” e ele ajusta.",
          },
          {
            tag: "Velocidade",
            title: "Resposta em segundos",
            description: "Fale a resposta enquanto lê o e-mail e mande na sequência.",
          },
          {
            tag: "Qualquer app",
            title: "Gmail, Outlook, Mail",
            description: "Funciona em qualquer campo de texto do Mac, no app que você usa.",
          },
          {
            tag: "Clareza",
            title: "Sem rodeio, com pedido claro",
            description: "O texto sai direto ao ponto, com a ação que você espera do outro lado.",
          },
          {
            tag: "Bilíngue",
            title: "Responda em outro idioma",
            description: "Fale em português e peça o e-mail em inglês, pronto pra enviar.",
          },
        ],
      },
      {
        kind: "comparison",
        muted: true,
        meta: {
          kicker: "Comparativo",
          title: "Digitar, modelo pronto ou ditar",
          description: "Três formas de responder o mesmo e-mail.",
        },
        comparison: {
          ariaLabel: "Comparação entre digitar, usar modelo pronto e ditar com o Shadow Whisper",
          criterionLabel: "Critério",
          columns: [
            { label: "Digitar na mão", name: "typing" },
            { label: "Modelo pronto", name: "template" },
            { label: "Shadow Whisper", name: "sw", highlight: true },
          ],
          rows: [
            {
              criterion: "Velocidade",
              cells: ["Lento", "Médio", "Rápido"],
            },
            {
              criterion: "Soa natural",
              cells: ["Sim", "Não", "Sim"],
            },
            {
              criterion: "Personaliza por contexto",
              cells: ["Sim", "Pouco", "Sim, sob comando"],
            },
            {
              criterion: "Estrutura automática",
              cells: ["Não", "Sim", "Sim"],
            },
            {
              criterion: "Funciona em qualquer app",
              cells: ["Sim", "Depende", "Sim"],
            },
          ],
        },
      },
    ],
    faqs: [
      {
        question: "Funciona no Gmail e no Outlook?",
        answer:
          "Sim. O Shadow Whisper escreve no campo de texto ativo do seu Mac, então funciona no Gmail, Outlook, Apple Mail e qualquer cliente que você usar no navegador ou no app.",
      },
      {
        question: "Ele inventa o conteúdo do e-mail?",
        answer:
          "Não. Ele estrutura o que você fala. Você dá a ideia e ele organiza em um e-mail claro; o conteúdo é seu.",
      },
      {
        question: "Dá pra mudar o tom depois de ditar?",
        answer:
          "Dá. Peça por voz “mais formal”, “mais curto” ou “mais amigável” e ele reescreve sem você digitar.",
      },
      {
        question: "Posso ditar em português e enviar em inglês?",
        answer:
          "Pode. Fale na sua língua e peça o e-mail no idioma do destinatário; o texto sai pronto pra enviar.",
      },
    ],
    faqHeading: {
      kicker: "Dúvidas",
      title: "Perguntas frequentes",
    },
    finalCta: {
      title: "A caixa de entrada limpa",
      highlight: "começa hoje.",
      description: "Entre na waitlist e seja avisado quando o Shadow Whisper abrir.",
    },
  },
  en: {
    topic: "email",
    locale: "en",
    meta: {
      title: "Dictate email: write by voice and clear your inbox",
      description:
        "Answer emails by speaking. Shadow Whisper transcribes, structures and writes a professional email (greeting and sign-off included) ready to send from your Mac.",
    },
    breadcrumbLabel: "Dictate email",
    hero: {
      eyebrow: "Email",
      title: "Clear your inbox",
      highlight: "by talking.",
      lede: "You speak the reply, Shadow Whisper writes a well-structured email (greeting, paragraphs and the right tone) straight into the field you’re typing in.",
      scene: {
        scene: "email",
        kicker: "Voice → finished email",
        title: "From talking to sending",
        description:
          "Say what you mean and get an email with a beginning, middle and end, with nothing to rewrite.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "The problem",
          title: "Email jams up your day",
          description: "A full inbox is mental weight nobody can ignore.",
        },
        items: [
          "You know what you want to reply, but you lose ten minutes picking the right words.",
          "Every email wants a greeting, context, a clear ask and a sign-off, and that’s draining.",
          "Replying on the phone is slow and typo-ridden; on the computer, there’s always something more urgent.",
          "The fuller the inbox gets, the harder it is to start, and the reply slips by days.",
        ],
      },
      {
        kind: "useCases",
        meta: {
          kicker: "What it’s for",
          title: "Speak the idea, get the email",
          description: "Shadow Whisper handles the form so you only handle the content.",
        },
        items: [
          {
            tag: "Structure",
            title: "Greeting and sign-off ready",
            description: "You speak the core, it builds the opening, paragraphs and closing.",
          },
          {
            tag: "Tone",
            title: "Formal or casual on command",
            description:
              "Ask for “more formal for the client” or “lighter for a teammate” and it adjusts.",
          },
          {
            tag: "Speed",
            title: "A reply in seconds",
            description: "Speak the answer while you read the email and send right after.",
          },
          {
            tag: "Any app",
            title: "Gmail, Outlook, Mail",
            description: "Works in any text field on your Mac, in whatever app you use.",
          },
          {
            tag: "Clarity",
            title: "No filler, clear ask",
            description:
              "The text comes out to the point, with the action you expect from the other side.",
          },
          {
            tag: "Bilingual",
            title: "Reply in another language",
            description: "Speak in your language and ask for the email in English, ready to send.",
          },
        ],
      },
      {
        kind: "comparison",
        muted: true,
        meta: {
          kicker: "Comparison",
          title: "Type, template, or dictate",
          description: "Three ways to answer the same email.",
        },
        comparison: {
          ariaLabel:
            "Comparison between typing, using a template, and dictating with Shadow Whisper",
          criterionLabel: "Criterion",
          columns: [
            { label: "Type by hand", name: "typing" },
            { label: "Canned template", name: "template" },
            { label: "Shadow Whisper", name: "sw", highlight: true },
          ],
          rows: [
            {
              criterion: "Speed",
              cells: ["Slow", "Medium", "Fast"],
            },
            {
              criterion: "Sounds natural",
              cells: ["Yes", "No", "Yes"],
            },
            {
              criterion: "Personalizes per context",
              cells: ["Yes", "Barely", "Yes, on command"],
            },
            {
              criterion: "Automatic structure",
              cells: ["No", "Yes", "Yes"],
            },
            {
              criterion: "Works in any app",
              cells: ["Yes", "Maybe", "Yes"],
            },
          ],
        },
      },
    ],
    faqs: [
      {
        question: "Does it work in Gmail and Outlook?",
        answer:
          "Yes. Shadow Whisper writes into the active text field on your Mac, so it works in Gmail, Outlook, Apple Mail and any client you use in the browser or app.",
      },
      {
        question: "Does it make up the email content?",
        answer:
          "No. It structures what you say. You give the idea and it organizes it into a clear email; the content is yours.",
      },
      {
        question: "Can I change the tone after dictating?",
        answer:
          "Yes. Ask by voice for “more formal”, “shorter” or “friendlier” and it rewrites without you typing.",
      },
      {
        question: "Can I dictate in my language and send in English?",
        answer:
          "Yes. Speak in your language and ask for the email in the recipient’s language; the text comes out ready to send.",
      },
    ],
    faqHeading: {
      kicker: "Questions",
      title: "Frequently asked questions",
    },
    finalCta: {
      title: "A clean inbox",
      highlight: "starts today.",
      description: "Join the waitlist and get notified when Shadow Whisper opens up.",
    },
  },
};

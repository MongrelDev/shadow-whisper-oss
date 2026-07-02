import type { LocalizedContent } from "../lib/types";

export const macContent: LocalizedContent = {
  "pt-BR": {
    topic: "mac",
    locale: "pt-BR",
    meta: {
      title: "Melhor app de ditado para Mac: fale e escreva em qualquer lugar",
      description:
        "O Shadow Whisper escreve por voz em qualquer app do Mac: Mail, Slack, Notion, WhatsApp Web e até no editor de código. Com skills e suporte bilíngue.",
    },
    breadcrumbLabel: "Ditado para Mac",
    hero: {
      eyebrow: "macOS",
      title: "Fale em qualquer app.",
      highlight: "Escreva em todos eles.",
      lede: "O Shadow Whisper escreve por voz onde o cursor estiver: Mail, Slack, Notion, WhatsApp Web, no terminal e no editor de código. Um atalho, e o texto aparece limpo.",
      scene: {
        scene: "auto-typing",
        kicker: "Atalho → texto onde você está",
        title: "Funciona no app inteiro",
        description:
          "Aperte o atalho, fale, e o texto cai no campo ativo, sem copiar, colar ou trocar de janela.",
      },
    },
    sections: [
      {
        kind: "useCases",
        meta: {
          kicker: "Onde usar",
          title: "O mesmo atalho, o dia inteiro",
          description:
            "Não é um app isolado: é uma forma de escrever em tudo que você já usa no Mac.",
        },
        items: [
          {
            tag: "Mail e Notas",
            title: "Responda e anote falando",
            description: "Escreva e-mails e notas sem tirar a mão do café.",
          },
          {
            tag: "Slack e Notion",
            title: "Mensagens e docs por voz",
            description: "Mande recado no Slack ou escreva um doc no Notion falando.",
          },
          {
            tag: "WhatsApp Web",
            title: "Texto que vende, no navegador",
            description: "Responda cliente no WhatsApp Web sem mandar áudio.",
          },
          {
            tag: "Código",
            title: "Comentários e commits falados",
            description: "Dite comentários, mensagens de commit e descrições de PR no editor.",
          },
          {
            tag: "Skills",
            title: "Comandos por voz",
            description: "Peça “resume”, “deixa formal” ou “traduz” sem sair do fluxo.",
          },
          {
            tag: "Bilíngue",
            title: "Fale português, escreva inglês",
            description: "Dite na sua língua e receba o texto no idioma que precisar.",
          },
        ],
      },
      {
        kind: "comparison",
        muted: true,
        meta: {
          kicker: "Comparativo",
          title: "Ditado nativo, modelo local ou Shadow Whisper",
          description: "Três formas de ditar no Mac, lado a lado.",
        },
        comparison: {
          ariaLabel: "Comparação entre ditado nativo do macOS, modelo local e Shadow Whisper",
          criterionLabel: "Critério",
          columns: [
            { label: "Ditado nativo", name: "native" },
            { label: "Modelo local", name: "local" },
            { label: "Shadow Whisper", name: "sw", highlight: true },
          ],
          rows: [
            {
              criterion: "Limpeza por IA",
              cells: ["Não", "Parcial", "Sim"],
            },
            {
              criterion: "Skills por voz",
              cells: ["Não", "Não", "Sim"],
            },
            {
              criterion: "Funciona em qualquer app",
              cells: ["Parcial", "Sim", "Sim"],
            },
            {
              criterion: "Leve no Mac",
              cells: ["Sim", "Não", "Sim"],
            },
            {
              criterion: "Bilíngue sob comando",
              cells: ["Não", "Parcial", "Sim"],
            },
          ],
        },
      },
    ],
    faqs: [
      {
        question: "Funciona em qualquer aplicativo do Mac?",
        answer:
          "Sim. O Shadow Whisper escreve no campo de texto ativo, então funciona em apps nativos, no navegador e até no editor de código. Onde dá pra digitar, dá pra ditar.",
      },
      {
        question: "Precisa de um Mac potente?",
        answer:
          "Não. O processamento roda na nuvem, então funciona bem em MacBooks antigos e novos, sem pesar na máquina.",
      },
      {
        question: "É melhor que o ditado nativo do macOS?",
        answer:
          "Pra escrever de verdade, sim. O nativo transcreve cru; o Shadow Whisper limpa, formata, aplica skills e funciona melhor em apps de terceiros.",
      },
      {
        question: "Dá pra usar pra programar?",
        answer:
          "Dá. É ótimo pra ditar comentários, mensagens de commit, descrições de PR e documentação direto no editor.",
      },
    ],
    faqHeading: {
      kicker: "Dúvidas",
      title: "Perguntas frequentes",
    },
    finalCta: {
      title: "Um atalho pra escrever",
      highlight: "em todo o seu Mac.",
      description: "Entre na waitlist e seja avisado quando o Shadow Whisper abrir.",
    },
  },
  en: {
    topic: "mac",
    locale: "en",
    meta: {
      title: "Best Mac dictation app: speak and write anywhere",
      description:
        "Shadow Whisper writes by voice in any Mac app: Mail, Slack, Notion, WhatsApp Web and even your code editor. With voice skills and bilingual support.",
    },
    breadcrumbLabel: "Mac dictation",
    hero: {
      eyebrow: "macOS",
      title: "Speak in any app.",
      highlight: "Write in all of them.",
      lede: "Shadow Whisper writes by voice wherever your cursor is: Mail, Slack, Notion, WhatsApp Web, the terminal and your code editor. One shortcut, and clean text appears.",
      scene: {
        scene: "auto-typing",
        kicker: "Shortcut → text where you are",
        title: "Works across the whole app",
        description:
          "Hit the shortcut, speak, and the text drops into the active field, no copy, paste, or window switching.",
      },
    },
    sections: [
      {
        kind: "useCases",
        meta: {
          kicker: "Where to use it",
          title: "The same shortcut, all day",
          description:
            "It isn’t a standalone app: it’s a way to write across everything you already use on the Mac.",
        },
        items: [
          {
            tag: "Mail and Notes",
            title: "Reply and jot by voice",
            description: "Write emails and notes without putting down your coffee.",
          },
          {
            tag: "Slack and Notion",
            title: "Messages and docs by voice",
            description: "Drop a Slack message or write a Notion doc by talking.",
          },
          {
            tag: "WhatsApp Web",
            title: "Text that sells, in the browser",
            description: "Reply to customers on WhatsApp Web without sending audio.",
          },
          {
            tag: "Code",
            title: "Spoken comments and commits",
            description: "Dictate comments, commit messages and PR descriptions in your editor.",
          },
          {
            tag: "Skills",
            title: "Voice commands",
            description:
              "Ask for “summarize”, “make it formal” or “translate” without leaving your flow.",
          },
          {
            tag: "Bilingual",
            title: "Speak your language, write English",
            description: "Dictate in your language and get the text in whatever language you need.",
          },
        ],
      },
      {
        kind: "comparison",
        muted: true,
        meta: {
          kicker: "Comparison",
          title: "Native dictation, local model, or Shadow Whisper",
          description: "Three ways to dictate on the Mac, side by side.",
        },
        comparison: {
          ariaLabel: "Comparison between native macOS dictation, a local model, and Shadow Whisper",
          criterionLabel: "Criterion",
          columns: [
            { label: "Native dictation", name: "native" },
            { label: "Local model", name: "local" },
            { label: "Shadow Whisper", name: "sw", highlight: true },
          ],
          rows: [
            {
              criterion: "AI cleanup",
              cells: ["No", "Partial", "Yes"],
            },
            {
              criterion: "Voice skills",
              cells: ["No", "No", "Yes"],
            },
            {
              criterion: "Works in any app",
              cells: ["Partial", "Yes", "Yes"],
            },
            {
              criterion: "Light on the Mac",
              cells: ["Yes", "No", "Yes"],
            },
            {
              criterion: "Bilingual on command",
              cells: ["No", "Partial", "Yes"],
            },
          ],
        },
      },
    ],
    faqs: [
      {
        question: "Does it work in any Mac app?",
        answer:
          "Yes. Shadow Whisper writes into the active text field, so it works in native apps, the browser and even your code editor. If you can type there, you can dictate there.",
      },
      {
        question: "Do I need a powerful Mac?",
        answer:
          "No. Processing runs in the cloud, so it works well on old and new MacBooks without taxing the machine.",
      },
      {
        question: "Is it better than native macOS dictation?",
        answer:
          "For real writing, yes. Native transcribes raw; Shadow Whisper cleans, formats, applies skills and works better in third-party apps.",
      },
      {
        question: "Can I use it for coding?",
        answer:
          "Yes. It’s great for dictating comments, commit messages, PR descriptions and documentation right in your editor.",
      },
    ],
    faqHeading: {
      kicker: "Questions",
      title: "Frequently asked questions",
    },
    finalCta: {
      title: "One shortcut to write",
      highlight: "across your whole Mac.",
      description: "Join the waitlist and get notified when Shadow Whisper opens up.",
    },
  },
};

import type { LocalizedContent } from "../lib/types";

export const scratchpadContent: LocalizedContent = {
  "pt-BR": {
    topic: "scratchpad",
    locale: "pt-BR",
    meta: {
      title: "Scratch Pad: a IA escreve com a sua memória",
      description:
        "Notas em Markdown ligadas como no Obsidian, locais e privadas. O Shadow Whisper consulta o seu Scratch Pad pra escrever com o seu contexto: preços, prazos, decisões. No roadmap.",
    },
    breadcrumbLabel: "Scratch Pad, seu segundo cérebro",
    hero: {
      eyebrow: "No roadmap",
      title: "A IA escreve com a",
      highlight: "sua memória.",
      lede: "Um bloco de notas em Markdown que se liga sozinho, no estilo do Obsidian, e que mora no seu Mac. Quando você pergunta “por quanto eu fechei com aquele cliente?”, o Shadow Whisper lê o seu Scratch Pad e responde com o seu dado, não com um chute genérico.",
      secondaryCta: { label: "Ver o Echo", href: "/pt-BR/respostas-na-hora" },
      scene: {
        scene: "scratchpad",
        kicker: "Sua nota → resposta certa",
        title: "Ele lembra o que você anotou",
        description:
          "Você pergunta e o Scratch Pad devolve o que já estava escrito ali, do seu jeito e com o seu número.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "O conceito",
          title: "Um segundo cérebro que a IA entende",
          description:
            "Suas notas viram contexto. Em vez de responder no genérico, a IA responde com o que é seu.",
        },
        items: [
          "Notas em Markdown que se conectam entre si, no estilo do Obsidian, formando o seu mapa de informação.",
          "Tudo fica local, no seu computador: é a sua memória, não um perfil numa nuvem qualquer.",
          "A LLM consulta o Scratch Pad como contexto na hora de escrever, então o texto sai com os seus fatos.",
          "Cresce com você: cada decisão, preço e prazo que você anota fica disponível pra próxima vez.",
        ],
      },
      {
        kind: "useCases",
        meta: {
          kicker: "Pra quê",
          title: "O que o Scratch Pad lembra por você",
          description:
            "Aquilo que você sempre esquece e tem que ir procurar no histórico ou no caderno.",
        },
        items: [
          {
            tag: "Freelancer",
            title: "Quanto você cobrou",
            description:
              "“Por quanto fechei o último projeto com esse cliente?” e o valor vem da sua própria nota, sem caçar e-mail.",
          },
          {
            tag: "Contrato",
            title: "Prazos e condições",
            description:
              "Data de renovação, multa, escopo combinado: o que ficou registrado responde quando você precisa.",
          },
          {
            tag: "Reunião",
            title: "O que ficou decidido",
            description:
              "Aquela decisão da call de três semanas atrás continua ali, pronta pra virar texto de novo.",
          },
          {
            tag: "Cliente",
            title: "Preferências e contexto",
            description:
              "Tom de voz, nome do contato, o que ele já pediu antes: o Scratch Pad mantém o histórico do relacionamento.",
          },
          {
            tag: "Projeto",
            title: "Decisões técnicas",
            description:
              "Por que você escolheu aquela abordagem? A justificativa fica anotada e ligada ao resto do projeto.",
          },
          {
            tag: "Pessoal",
            title: "Seu diário de fatos",
            description:
              "Senhas de ideias, metas, números soltos do dia a dia: um lugar só seu pra não depender da memória.",
          },
        ],
      },
      {
        kind: "prose",
        muted: true,
        meta: {
          kicker: "Local primeiro",
          title: "Fica no seu computador",
          description:
            "Uma memória pessoal só vale se for sua de verdade. O Scratch Pad nasce local e portátil.",
        },
        items: [
          "Os arquivos são seus: Markdown puro no seu Mac, que você abre em qualquer editor.",
          "Nada sobe pra nuvem sem você pedir; a memória mora com você, não num servidor.",
          "Portátil por natureza: abra as mesmas notas no Obsidian ou em qualquer app de Markdown.",
          "Você decide o que a IA pode ler, e o que fica só pra você.",
        ],
      },
    ],
    faqs: [
      {
        question: "Preciso usar o Obsidian?",
        answer:
          "Não. O Scratch Pad é do Shadow Whisper e funciona sozinho. Como é Markdown puro, você até pode abrir as mesmas notas no Obsidian se já usa, mas não é obrigatório.",
      },
      {
        question: "Onde ficam as minhas notas?",
        answer:
          "No seu computador, como arquivos de Markdown. É uma memória local: você sabe onde está e leva pra onde quiser.",
      },
      {
        question: "A IA manda minhas notas pra nuvem?",
        answer:
          "A proposta é local primeiro. A LLM usa o Scratch Pad como contexto pra escrever, e você controla o que ela pode ler. Nada de subir a sua memória sem você mandar.",
      },
      {
        question: "Posso editar fora do app?",
        answer:
          "Pode. Por ser Markdown puro, qualquer editor de texto abre e edita. O Scratch Pad só lê o que está ali pra te ajudar a escrever.",
      },
      {
        question: "Quando o Scratch Pad chega?",
        answer:
          "Ainda está no roadmap, não no app de hoje. Entre na waitlist e avisaremos quando o Scratch Pad estiver pronto pra testar.",
      },
    ],
    faqHeading: {
      kicker: "Dúvidas",
      title: "Perguntas frequentes",
    },
    finalCta: {
      title: "Sua memória,",
      highlight: "dentro do seu texto.",
      description: "Entre na waitlist e seja avisado quando o Scratch Pad abrir pra teste.",
    },
  },
  en: {
    topic: "scratchpad",
    locale: "en",
    meta: {
      title: "Scratch Pad: AI that writes from your memory",
      description:
        "Markdown notes linked like Obsidian, local and private. Shadow Whisper reads your Scratch Pad to write with your context: prices, deadlines, decisions. On the roadmap.",
    },
    breadcrumbLabel: "Scratch Pad, your second brain",
    hero: {
      eyebrow: "On the roadmap",
      title: "AI that writes from",
      highlight: "your memory.",
      lede: "A Markdown notebook that links itself, Obsidian style, and lives on your Mac. When you ask “how much did I close with that client for?”, Shadow Whisper reads your Scratch Pad and answers with your data, not a generic guess.",
      secondaryCta: { label: "See Echo", href: "/answers-while-you-talk" },
      scene: {
        scene: "scratchpad",
        kicker: "Your note → the right answer",
        title: "It remembers what you wrote",
        description:
          "You ask and the Scratch Pad returns what was already written there, in your words and with your number.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "The concept",
          title: "A second brain the AI understands",
          description:
            "Your notes become context. Instead of answering in the generic, the AI answers with what's yours.",
        },
        items: [
          "Markdown notes that connect to each other, Obsidian style, forming your own map of information.",
          "Everything stays local, on your computer: it's your memory, not a profile in some cloud.",
          "The LLM reads the Scratch Pad as context when it writes, so the text comes out with your facts.",
          "It grows with you: every decision, price and deadline you note stays available for next time.",
        ],
      },
      {
        kind: "useCases",
        meta: {
          kicker: "What for",
          title: "What the Scratch Pad remembers for you",
          description:
            "The things you always forget and have to dig out of your history or a notebook.",
        },
        items: [
          {
            tag: "Freelancer",
            title: "What you charged",
            description:
              "“How much did I close the last project for with this client?” and the number comes from your own note, no email to hunt.",
          },
          {
            tag: "Contract",
            title: "Deadlines and terms",
            description:
              "Renewal date, penalty, agreed scope: whatever you recorded answers back when you need it.",
          },
          {
            tag: "Meeting",
            title: "What got decided",
            description:
              "That call from three weeks ago is still there, ready to become text again.",
          },
          {
            tag: "Client",
            title: "Preferences and context",
            description:
              "Tone of voice, contact name, what they asked for before: the Scratch Pad keeps the relationship history.",
          },
          {
            tag: "Project",
            title: "Technical decisions",
            description:
              "Why did you pick that approach? The reasoning stays noted and linked to the rest of the project.",
          },
          {
            tag: "Personal",
            title: "Your log of facts",
            description:
              "Loose ideas, goals, numbers from the day: a place that's only yours, so you don't lean on memory.",
          },
        ],
      },
      {
        kind: "prose",
        muted: true,
        meta: {
          kicker: "Local first",
          title: "It stays on your computer",
          description:
            "A personal memory only counts if it's truly yours. The Scratch Pad is born local and portable.",
        },
        items: [
          "The files are yours: plain Markdown on your Mac, open in any editor.",
          "Nothing goes to the cloud unless you ask; the memory lives with you, not on a server.",
          "Portable by nature: open the same notes in Obsidian or any Markdown app.",
          "You decide what the AI can read, and what stays only with you.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need Obsidian?",
        answer:
          "No. The Scratch Pad is Shadow Whisper's own and works on its own. Since it's plain Markdown, you can open the same notes in Obsidian if you already use it, but it isn't required.",
      },
      {
        question: "Where do my notes live?",
        answer:
          "On your computer, as Markdown files. It's a local memory: you know where it is and you take it wherever you want.",
      },
      {
        question: "Does the AI send my notes to the cloud?",
        answer:
          "The approach is local first. The LLM uses the Scratch Pad as context to write, and you control what it can read. No uploading your memory unless you say so.",
      },
      {
        question: "Can I edit outside the app?",
        answer:
          "Yes. Because it's plain Markdown, any text editor can open and edit it. The Scratch Pad just reads what's there to help you write.",
      },
      {
        question: "When does the Scratch Pad ship?",
        answer:
          "It's on the roadmap, not in today's app. Join the waitlist and we'll let you know when the Scratch Pad is ready to try.",
      },
    ],
    faqHeading: {
      kicker: "Questions",
      title: "Frequently asked questions",
    },
    finalCta: {
      title: "Your memory,",
      highlight: "inside your text.",
      description: "Join the waitlist and get notified when the Scratch Pad opens for testing.",
    },
  },
};

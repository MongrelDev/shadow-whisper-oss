import type { LocalizedContent } from "../lib/types";

export const whatsappContent: LocalizedContent = {
  "pt-BR": {
    topic: "whatsapp",
    locale: "pt-BR",
    meta: {
      title: "Ditar no WhatsApp: transforme áudio em texto que vende",
      description:
        "Pare de mandar áudio de 3 minutos. Fale e o Shadow Whisper escreve uma mensagem clara, com tom de venda, pronta pra colar no WhatsApp Web.",
    },
    breadcrumbLabel: "Ditar no WhatsApp",
    hero: {
      eyebrow: "WhatsApp",
      title: "Pare de mandar áudio de 3 minutos.",
      highlight: "Fale e mande texto que vende.",
      lede: "Você fala do seu jeito, o Shadow Whisper escreve a mensagem limpa e pronta pra enviar. Sem digitar, sem revisar, sem o cliente ter que ouvir um áudio gigante.",
      scene: {
        scene: "whatsapp",
        kicker: "Áudio → texto limpo",
        title: "Fale solto, mande organizado",
        description:
          "O Shadow Whisper tira os “é…”, os “tipo assim” e a bagunça, e entrega uma mensagem que o cliente lê em segundos.",
      },
    },
    sections: [
      {
        kind: "prose",
        variant: "numbered",
        meta: {
          kicker: "O problema",
          title: "Áudio longo afasta cliente",
          description: "Todo mundo já sentiu isso do outro lado da conversa.",
        },
        items: [
          "O cliente vê “3:42” de áudio e deixa pra ouvir depois, que nunca chega.",
          "Quem está no busão, na reunião ou no trabalho não consegue ouvir, só ler.",
          "Áudio não dá pra buscar, copiar valor, reenviar pra um colega ou colar numa proposta.",
          "Digitar tudo é lento, e no meio da correria a mensagem sai torta e cheia de erro.",
        ],
      },
      {
        kind: "useCases",
        meta: {
          kicker: "Pra que serve",
          title: "Falar é rápido. Vender bem é melhor ainda.",
          description: "O mesmo áudio que você mandaria, agora vira texto que trabalha por você.",
        },
        items: [
          {
            tag: "Velocidade",
            title: "3x mais rápido que digitar",
            description: "Você fala em 20 segundos o que levaria dois minutos pra escrever.",
          },
          {
            tag: "Venda",
            title: "Tom de venda automático",
            description: "Peça “deixa mais persuasivo” e o texto sai com chamada pra ação.",
          },
          {
            tag: "Profissional",
            title: "Sem erro de digitação",
            description: "Pontuação, acentuação e parágrafos prontos pra mandar pro cliente.",
          },
          {
            tag: "Buscável",
            title: "Texto que dá pra reusar",
            description: "Copie o valor, reenvie a proposta, cole na planilha. Áudio não faz isso.",
          },
          {
            tag: "Acessível",
            title: "O cliente lê na hora",
            description: "Na reunião, no transporte ou no mudo, o texto chega em qualquer lugar.",
          },
          {
            tag: "Snippets",
            title: "Respostas prontas com um gatilho",
            description: "Fale “meu cardápio de segunda” e o texto inteiro aparece sozinho.",
          },
        ],
      },
      {
        kind: "showcase",
        muted: true,
        meta: {
          kicker: "Snippets",
          title: "Diga o gatilho, receba o texto inteiro",
          description:
            "Snippet é um atalho de voz: você fala uma frase curta e o Shadow Whisper expande pra um bloco de texto que você salvou antes. Ideal pra tudo que você manda toda semana.",
        },
        scenes: [
          {
            scene: "whatsapp",
            kicker: "Atalho de voz",
            title: "Gatilho curto, resposta completa",
            description:
              "Fale “cardápio de segunda” e sai o cardápio inteiro. Fale “link de entrevista” e sai o convite com horário e link. Você grava uma vez, usa pra sempre.",
          },
        ],
      },
      {
        kind: "prose",
        variant: "numbered",
        meta: {
          kicker: "Exemplos de snippet",
          title: "Três formas de usar hoje",
          description: "Funciona pra qualquer mensagem repetitiva que sai da sua boca toda semana.",
        },
        items: [
          "Restaurante: o cliente pede o cardápio, você fala “cardápio de segunda” e o Shadow Whisper escreve o menu completo, com pratos e preços, pronto pra enviar.",
          "Recrutador: você fala “link de entrevista” e sai a mensagem com data, horário e o link da call, sem digitar nada.",
          "Candidato a vaga: você fala “me apresentar” e sai um texto curto de apresentação com seu nome, experiência e por que você serve pra vaga.",
        ],
      },
      {
        kind: "comparison",
        meta: {
          kicker: "Comparativo",
          title: "Áudio, digitar ou Shadow Whisper",
          description: "O mesmo recado, três formas de mandar.",
        },
        comparison: {
          ariaLabel: "Comparação entre mandar áudio, digitar e usar o Shadow Whisper",
          criterionLabel: "Critério",
          columns: [
            { label: "Mandar áudio", name: "audio" },
            { label: "Digitar na mão", name: "typing" },
            { label: "Shadow Whisper", name: "sw", highlight: true },
          ],
          rows: [
            {
              criterion: "Velocidade pra criar",
              cells: ["Rápido", "Lento", "Rápido"],
            },
            {
              criterion: "Cliente consome na hora",
              cells: ["Não", "Sim", "Sim"],
            },
            {
              criterion: "Dá pra buscar e copiar",
              cells: ["Não", "Sim", "Sim"],
            },
            {
              criterion: "Tom de venda",
              cells: ["Depende", "Depende", "Sim, sob comando"],
            },
            {
              criterion: "Sem erro de digitação",
              cells: ["N/A", "Não", "Sim"],
            },
          ],
        },
      },
    ],
    faqs: [
      {
        question: "Funciona no WhatsApp Web?",
        answer:
          "Sim. O Shadow Whisper escreve direto em qualquer campo de texto do seu Mac, inclusive o WhatsApp Web no navegador. Você fala, o texto aparece onde o cursor está.",
      },
      {
        question: "Preciso digitar para corrigir depois?",
        answer:
          "Não. A limpeza de “é…”, gaguejo e repetição é automática. Se quiser, você pede um ajuste por voz, como “mais curto” ou “mais formal”.",
      },
      {
        question: "Dá pra deixar a mensagem com cara de venda?",
        answer:
          "Dá. Use uma skill de venda ou peça “deixa persuasivo com chamada pra ação” e o texto sai pronto pra converter.",
      },
      {
        question: "O que são snippets?",
        answer:
          "São atalhos de voz: você grava uma vez um texto longo (cardápio, link de entrevista, apresentação) e depois é só falar o gatilho pra ele aparecer inteiro.",
      },
      {
        question: "Meus áudios ficam salvos em algum lugar?",
        answer:
          "Não armazenamos seu áudio. Ele é transcrito e descartado; o que fica é só o texto, no seu dispositivo.",
      },
    ],
    faqHeading: {
      kicker: "Dúvidas",
      title: "Perguntas frequentes",
    },
    finalCta: {
      title: "Sua próxima venda começa com",
      highlight: "uma mensagem bem escrita.",
      description: "Entre na waitlist e seja avisado quando o Shadow Whisper abrir.",
    },
  },
  en: {
    topic: "whatsapp",
    locale: "en",
    meta: {
      title: "Dictate on WhatsApp: turn voice into text that sells",
      description:
        "Stop sending 3-minute voice notes. Speak and Shadow Whisper writes a clean, sales-ready message you can paste straight into WhatsApp Web.",
    },
    breadcrumbLabel: "Dictate on WhatsApp",
    hero: {
      eyebrow: "WhatsApp",
      title: "Stop sending 3-minute voice notes.",
      highlight: "Speak and send text that sells.",
      lede: "You talk the way you talk, Shadow Whisper writes the clean message, ready to send. No typing, no editing, and no customer forced to sit through a giant audio.",
      scene: {
        scene: "whatsapp",
        kicker: "Voice → clean text",
        title: "Talk loose, send it sharp",
        description:
          "Shadow Whisper strips the “uhh”, the “like, you know” and the mess, and hands over a message your customer reads in seconds.",
      },
    },
    sections: [
      {
        kind: "prose",
        variant: "numbered",
        meta: {
          kicker: "The problem",
          title: "Long voice notes lose the customer",
          description: "Everyone has felt this from the other side of the chat.",
        },
        items: [
          "The customer sees “3:42” of audio and saves it for later, which never comes.",
          "People on the bus, in a meeting, or at work can’t listen, they can only read.",
          "Audio can’t be searched, copied, forwarded to a colleague, or pasted into a proposal.",
          "Typing it all out is slow, and in a rush the message comes out messy and full of typos.",
        ],
      },
      {
        kind: "useCases",
        meta: {
          kicker: "What it’s for",
          title: "Talking is fast. Selling well is even better.",
          description: "The same audio you would have sent now becomes text that works for you.",
        },
        items: [
          {
            tag: "Speed",
            title: "3x faster than typing",
            description: "You say in 20 seconds what would take two minutes to write.",
          },
          {
            tag: "Sales",
            title: "Sales tone on demand",
            description: "Ask for “make it more persuasive” and it ships with a call to action.",
          },
          {
            tag: "Professional",
            title: "Zero typos",
            description: "Punctuation, capitalization and paragraphs, ready to send to the client.",
          },
          {
            tag: "Searchable",
            title: "Text you can reuse",
            description: "Copy the price, resend the proposal, paste into a sheet. Audio can’t.",
          },
          {
            tag: "Accessible",
            title: "The customer reads instantly",
            description: "In a meeting, in transit, or on mute, text lands anywhere.",
          },
          {
            tag: "Snippets",
            title: "Saved replies from one trigger",
            description: "Say “my Monday menu” and the whole block of text appears on its own.",
          },
        ],
      },
      {
        kind: "showcase",
        muted: true,
        meta: {
          kicker: "Snippets",
          title: "Say the trigger, get the whole text",
          description:
            "A snippet is a voice shortcut: you say a short phrase and Shadow Whisper expands it into a block of text you saved earlier. Perfect for everything you send every week.",
        },
        scenes: [
          {
            scene: "whatsapp",
            kicker: "Voice shortcut",
            title: "Short trigger, full reply",
            description:
              "Say “Monday menu” and the full menu comes out. Say “interview link” and the invite with time and link appears. Record it once, use it forever.",
          },
        ],
      },
      {
        kind: "prose",
        variant: "numbered",
        meta: {
          kicker: "Snippet examples",
          title: "Three ways to use it today",
          description: "Works for any repetitive message that leaves your mouth every week.",
        },
        items: [
          "Restaurant: a customer asks for the menu, you say “Monday menu” and Shadow Whisper writes the full menu, dishes and prices, ready to send.",
          "Recruiter: you say “interview link” and out comes the message with date, time and the call link, without typing a thing.",
          "Job applicant: you say “introduce me” and out comes a short intro with your name, experience and why you fit the role.",
        ],
      },
      {
        kind: "comparison",
        meta: {
          kicker: "Comparison",
          title: "Audio, typing, or Shadow Whisper",
          description: "Same message, three ways to send it.",
        },
        comparison: {
          ariaLabel: "Comparison between sending audio, typing, and using Shadow Whisper",
          criterionLabel: "Criterion",
          columns: [
            { label: "Send audio", name: "audio" },
            { label: "Type by hand", name: "typing" },
            { label: "Shadow Whisper", name: "sw", highlight: true },
          ],
          rows: [
            {
              criterion: "Speed to create",
              cells: ["Fast", "Slow", "Fast"],
            },
            {
              criterion: "Customer reads instantly",
              cells: ["No", "Yes", "Yes"],
            },
            {
              criterion: "Searchable and copyable",
              cells: ["No", "Yes", "Yes"],
            },
            {
              criterion: "Sales tone",
              cells: ["Maybe", "Maybe", "Yes, on command"],
            },
            {
              criterion: "No typos",
              cells: ["N/A", "No", "Yes"],
            },
          ],
        },
      },
    ],
    faqs: [
      {
        question: "Does it work on WhatsApp Web?",
        answer:
          "Yes. Shadow Whisper writes directly into any text field on your Mac, including WhatsApp Web in the browser. You speak, the text appears where your cursor is.",
      },
      {
        question: "Do I have to type to fix it afterward?",
        answer:
          "No. Cleaning up the “uhh”, stutters and repetition is automatic. If you want, you ask for a tweak by voice, like “shorter” or “more formal”.",
      },
      {
        question: "Can I give the message a sales tone?",
        answer:
          "Yes. Use a sales skill or ask for “make it persuasive with a call to action” and the text comes out ready to convert.",
      },
      {
        question: "What are snippets?",
        answer:
          "They’re voice shortcuts: you record a long text once (a menu, an interview link, an intro) and then just say the trigger to make it appear in full.",
      },
      {
        question: "Is my audio saved somewhere?",
        answer:
          "We don’t store your audio. It is transcribed and discarded; what stays is only the text, on your device.",
      },
    ],
    faqHeading: {
      kicker: "Questions",
      title: "Frequently asked questions",
    },
    finalCta: {
      title: "Your next sale starts with",
      highlight: "a well-written message.",
      description: "Join the waitlist and get notified when Shadow Whisper opens up.",
    },
  },
};

import type { LocalizedContent } from "../lib/types";

export const echoContent: LocalizedContent = {
  "pt-BR": {
    topic: "echo",
    locale: "pt-BR",
    meta: {
      title: "Echo: a resposta aparece enquanto você fala",
      description:
        "Esqueceu a fórmula, a lei ou a sintaxe? O Echo, o agente de pesquisa do Shadow Whisper, traz a resposta na pílula sem você abrir o navegador. Em breve.",
    },
    breadcrumbLabel: "Echo, respostas na hora",
    hero: {
      eyebrow: "No roadmap",
      title: "Esqueceu? Continue falando.",
      highlight: "O Echo responde.",
      lede: "Você está ditando e trava numa dúvida: a fórmula de Bhaskara, a dose de paracetamol pra adulto, como iterar um array em JavaScript. O Echo percebe a pergunta no meio da fala e devolve a resposta numa notinha sobre a pílula de contexto. Sem abrir o navegador, sem perder o fio.",
      secondaryCta: { label: "Ver o Scratch Pad", href: "/pt-BR/segundo-cerebro" },
      scene: {
        scene: "echo",
        kicker: "Pergunta → resposta na pílula",
        title: "A resposta aparece sozinha",
        description:
          "Você fala a dúvida no meio da frase e a resposta surge logo acima da pílula, pronta pra usar ou ignorar.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "A ideia",
          title: "Ele lê a intenção, não só a voz",
          description:
            "Em vez de só transcrever, um agente acompanha o que você fala e identifica quando ali tem uma pergunta escondida.",
        },
        items: [
          "O agente captura a intenção: percebe que você duvidou de uma dose, de uma fórmula ou de uma sintaxe enquanto ditava.",
          "A pesquisa roda em segundo plano e volta por streaming, então a resposta aparece aos poucos, sem travar o seu ditado.",
          "Uma notinha discreta sobe sobre a pílula de contexto: “Paracetamol: 750 mg a cada 6h pra adulto, segundo a bula.”",
          "Você continua falando. Pega a resposta se quiser, ignora se não precisar. O fluxo nunca para.",
        ],
      },
      {
        kind: "useCases",
        meta: {
          kicker: "Pra quem",
          title: "Quem ganha tempo com o Echo",
          description: "A mesma dúvida, em qualquer profissão, resolvida sem trocar de janela.",
        },
        items: [
          {
            tag: "Advogado",
            title: "Citou um prazo de cabeça",
            description:
              "“O prazo de recurso é de 15 dias?” e o Echo confirma o número e de onde veio, pra você checar antes de protocolar.",
          },
          {
            tag: "Dev",
            title: "Esqueceu a sintaxe",
            description:
              "“Como faço streaming em Java?” ou “qual a ordem de um array em JS?” e o snippet chega pronto na pílula.",
          },
          {
            tag: "Estudante",
            title: "Travou na fórmula",
            description:
              "“Qual é a fórmula de Bhaskara?” e ela aparece na hora, sem abrir aba nenhuma no meio do estudo.",
          },
          {
            tag: "Jornalista",
            title: "Precisa de um fato",
            description:
              "Uma data, um número, um nome próprio: o Echo traz a referência enquanto você termina o parágrafo.",
          },
          {
            tag: "Redator",
            title: "Quer a palavra certa",
            description:
              "“O que significa esse termo?” ou “qual o sinônimo disso?” sem sair do texto que está escrevendo.",
          },
          {
            tag: "Suporte",
            title: "Responde mais rápido",
            description:
              "Confere um procedimento ou um número de versão enquanto fala com o cliente, sem deixar a conversa esfriar.",
          },
        ],
      },
      {
        kind: "prose",
        muted: true,
        meta: {
          kicker: "Sem alucinação cega",
          title: "Um ponto de partida, com a fonte",
          description:
            "Resposta rápida não pode virar resposta errada. O Echo te dá a pista e de onde ela veio, pra você decidir.",
        },
        items: [
          "Toda resposta vem com a origem, pra você conferir na fonte antes de usar em algo sério.",
          "Em tema sensível, como direito ou saúde, o Echo é um atalho de memória, não um conselho final.",
          "Você manda no que entra no texto: nada é escrito sem você aceitar.",
          "Se a confiança for baixa, ele avisa em vez de inventar uma certeza que não tem.",
        ],
      },
    ],
    faqs: [
      {
        question: "Posso confiar no Echo pra um caso de verdade?",
        answer:
          "Trate como um lembrete rápido, não como a palavra final. O Echo aponta a lei, o artigo ou o fato e de onde veio, mas a conferência na fonte e a decisão continuam sendo suas, ainda mais em direito e saúde.",
      },
      {
        question: "De onde vem a resposta?",
        answer:
          "O agente pesquisa e devolve a resposta junto com a origem, pra você saber em que se basear. A ideia é ser transparente sobre a fonte, não te entregar uma certeza sem lastro.",
      },
      {
        question: "Vai atrapalhar o meu ditado?",
        answer:
          "Não. A pesquisa roda em segundo plano e a resposta chega numa notinha discreta sobre a pílula. Você continua falando e só olha se quiser.",
      },
      {
        question: "Funciona sem internet?",
        answer:
          "A pesquisa precisa de conexão pra buscar o que você não sabe. O ditado em si segue funcionando; o Echo entra quando há uma dúvida pra resolver.",
      },
      {
        question: "Quando o Echo chega?",
        answer:
          "Ainda está no roadmap, não no app de hoje. Entre na waitlist e avisaremos assim que o Echo estiver pronto pra testar.",
      },
    ],
    faqHeading: {
      kicker: "Dúvidas",
      title: "Perguntas frequentes",
    },
    finalCta: {
      title: "A resposta na hora,",
      highlight: "sem sair do texto.",
      description: "Entre na waitlist e seja avisado quando o Echo abrir pra teste.",
    },
  },
  en: {
    topic: "echo",
    locale: "en",
    meta: {
      title: "Echo: the answer shows up while you talk",
      description:
        "Forgot the formula, the law or the syntax? Echo, Shadow Whisper's research agent, brings the answer to the pill without you opening a browser. On the roadmap.",
    },
    breadcrumbLabel: "Echo, instant answers",
    hero: {
      eyebrow: "On the roadmap",
      title: "Forgot it? Keep talking.",
      highlight: "Echo answers.",
      lede: "You are dictating and hit a blank: the quadratic formula, the adult dose of acetaminophen, how to iterate an array in JavaScript. Echo catches the question mid-sentence and returns the answer in a small note above the context pill. No browser, no lost train of thought.",
      secondaryCta: { label: "See the Scratch Pad", href: "/second-brain" },
      scene: {
        scene: "echo",
        kicker: "Question → answer in the pill",
        title: "The answer appears on its own",
        description:
          "You ask mid-sentence and the answer surfaces right above the pill, ready to use or ignore.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "The idea",
          title: "It reads intent, not just voice",
          description:
            "Instead of only transcribing, an agent follows what you say and spots when a question is hiding in there.",
        },
        items: [
          "The agent captures intent: it notices you doubted a dose, a formula or a syntax while dictating.",
          "The search runs in the background and streams back, so the answer fills in gradually without stalling your dictation.",
          "A quiet note rises above the context pill: “Acetaminophen: 750 mg every 6 hours for adults, per the label.”",
          "You keep talking. Take the answer if you want it, ignore it if you don't. The flow never stops.",
        ],
      },
      {
        kind: "useCases",
        meta: {
          kicker: "Who it's for",
          title: "Who saves time with Echo",
          description: "The same kind of question, in any job, solved without switching windows.",
        },
        items: [
          {
            tag: "Lawyer",
            title: "Cited a deadline from memory",
            description:
              "“Is the appeal window 15 days?” and Echo confirms the number and where it came from, so you can check before you file.",
          },
          {
            tag: "Developer",
            title: "Forgot the syntax",
            description:
              "“How do I stream in Java?” or “what's the order of a JS array?” and the snippet lands in the pill.",
          },
          {
            tag: "Student",
            title: "Blanked on a formula",
            description:
              "“What's the quadratic formula?” and it shows up instantly, no tab to open in the middle of studying.",
          },
          {
            tag: "Journalist",
            title: "Needs a fact",
            description:
              "A date, a number, a proper name: Echo brings the reference while you finish the paragraph.",
          },
          {
            tag: "Writer",
            title: "Wants the right word",
            description:
              "“What does this term mean?” or “what's a synonym for this?” without leaving the draft you're in.",
          },
          {
            tag: "Support",
            title: "Replies faster",
            description:
              "Check a procedure or a version number while talking to the customer, without letting the chat go cold.",
          },
        ],
      },
      {
        kind: "prose",
        muted: true,
        meta: {
          kicker: "No blind hallucination",
          title: "A starting point, with the source",
          description:
            "A fast answer can't become a wrong one. Echo gives you the lead and where it came from, so you decide.",
        },
        items: [
          "Every answer comes with its origin, so you can check the source before using it for anything serious.",
          "On sensitive topics like law or health, Echo is a memory shortcut, not final advice.",
          "You control what reaches the text: nothing is written until you accept it.",
          "When confidence is low, it says so instead of inventing a certainty it doesn't have.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I trust Echo on a real case?",
        answer:
          "Treat it as a quick reminder, not the final word. Echo points to the law, the section or the fact and where it came from, but checking the source and making the call stay with you, especially in law and health.",
      },
      {
        question: "Where does the answer come from?",
        answer:
          "The agent searches and returns the answer along with its source, so you know what it's based on. The goal is to be transparent about where it came from, not to hand you an unbacked certainty.",
      },
      {
        question: "Will it get in the way of dictation?",
        answer:
          "No. The search runs in the background and the answer arrives as a quiet note above the pill. You keep talking and only look if you want to.",
      },
      {
        question: "Does it work offline?",
        answer:
          "The search needs a connection to look up what you don't know. Dictation itself keeps working; Echo steps in when there's a question to resolve.",
      },
      {
        question: "When does Echo ship?",
        answer:
          "It's on the roadmap, not in today's app. Join the waitlist and we'll let you know the moment Echo is ready to try.",
      },
    ],
    faqHeading: {
      kicker: "Questions",
      title: "Frequently asked questions",
    },
    finalCta: {
      title: "The answer right away,",
      highlight: "without leaving the text.",
      description: "Join the waitlist and get notified when Echo opens for testing.",
    },
  },
};

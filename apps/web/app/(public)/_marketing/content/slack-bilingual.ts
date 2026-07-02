import type { MarketingPageContent } from "../lib/types";

export const slackBilingualContent: MarketingPageContent = {
  topic: "slackBilingual",
  locale: "pt-BR",
  meta: {
    title: "Falar português, escrever inglês: o Slack do trabalho sem travar",
    description:
      "Precisa responder um colega importante em inglês no Slack? Fale em português e o Shadow Whisper escreve a mensagem em inglês profissional, pronta pra enviar.",
  },
  breadcrumbLabel: "Falar português, escrever inglês",
  hero: {
    eyebrow: "Trabalho",
    title: "Fale português.",
    highlight: "Mande inglês no trabalho.",
    lede: "Aquele colega importante escreveu em inglês e você travou pra responder? Fale na sua língua mãe e o Shadow Whisper escreve a mensagem em inglês claro e profissional, direto no Slack.",
    scene: {
      scene: "auto-typing",
      kicker: "Português → inglês na hora",
      title: "Você fala, ele escreve em inglês",
      description:
        "Aperte o atalho, fale em português, e o texto aparece em inglês no campo do Slack, pronto pra enviar.",
    },
  },
  sections: [
    {
      kind: "prose",
      meta: {
        kicker: "O problema",
        title: "Responder em inglês trava qualquer um",
        description: "Você entende tudo, mas escrever na hora, sem erro, é outra história.",
      },
      items: [
        "O colega de outro país manda uma pergunta no Slack e você sabe a resposta, só não em inglês fluente.",
        "Você abre o Google Tradutor, cola, ajusta, apaga, e dez minutos depois ainda não enviou.",
        "Medo de errar a gramática faz você adiar a resposta e parecer mais lento do que é.",
        "Reunião, gestor, cliente lá fora: a barreira do idioma trava a sua imagem no trabalho.",
      ],
    },
    {
      kind: "useCases",
      muted: true,
      meta: {
        kicker: "Como ajuda",
        title: "A língua deixa de ser barreira",
        description: "Você pensa e fala em português; o inglês profissional sai pronto.",
      },
      items: [
        {
          tag: "Fluência",
          title: "Fale como você pensa",
          description:
            "Sem caçar palavra em inglês: fale solto em português e mande a versão certa.",
        },
        {
          tag: "Profissional",
          title: "Inglês de trabalho, sem gafe",
          description:
            "Gramática e tom corporativo prontos, do jeito que um colega nativo escreveria.",
        },
        {
          tag: "Velocidade",
          title: "Responda na hora",
          description: "Nada de travar dez minutos no tradutor; o texto sai em segundos.",
        },
        {
          tag: "Tom certo",
          title: "Formal ou direto, você escolhe",
          description: "Peça “mais formal pro meu gestor” ou “mais direto” e o inglês se ajusta.",
        },
        {
          tag: "No Slack",
          title: "Direto no campo de mensagem",
          description: "O texto aparece onde o cursor está, sem copiar e colar de outra aba.",
        },
        {
          tag: "Confiança",
          title: "Mostre o seu valor",
          description: "Sua competência deixa de ficar presa atrás de uma segunda língua.",
        },
      ],
    },
    {
      kind: "prose",
      meta: {
        kicker: "Exemplo real",
        title: "Uma resposta que você manda hoje",
        description: "Mesma situação que trava você no Slack toda semana.",
      },
      items: [
        "O gestor pergunta o status do projeto em inglês. Você fala em português “oi, o projeto está no prazo, terminei a parte do backend e começo o frontend amanhã”.",
        "O Shadow Whisper escreve: “Hi, the project is on track. I’ve finished the backend and I’ll start the frontend tomorrow.”",
        "Você confere, ajusta o tom se quiser, e envia. Sem tradutor, sem medo de errar, sem demora.",
      ],
    },
  ],
  faqs: [
    {
      question: "Funciona dentro do Slack?",
      answer:
        "Sim. O Shadow Whisper escreve no campo de mensagem ativo do seu Mac, então funciona no Slack do app e no navegador. Você fala em português e o inglês aparece ali mesmo.",
    },
    {
      question: "O inglês fica natural ou parece traduzido?",
      answer:
        "Fica natural. Ele não faz tradução literal: reescreve a sua ideia em inglês profissional, do jeito que um colega nativo mandaria no trabalho.",
    },
    {
      question: "Dá pra escolher o tom da mensagem?",
      answer:
        "Dá. Peça por voz “mais formal pro meu gestor”, “mais direto” ou “mais amigável” e o texto em inglês se ajusta antes de você enviar.",
    },
    {
      question: "Serve pra outros idiomas além do inglês?",
      answer:
        "Serve. Você fala em português e pede o texto no idioma do seu colega; o inglês é só o caso mais comum no trabalho.",
    },
  ],
  faqHeading: {
    kicker: "Dúvidas",
    title: "Perguntas frequentes",
  },
  finalCta: {
    title: "Fale português,",
    highlight: "brilhe em inglês no trabalho.",
    description: "Entre na waitlist e seja avisado quando o Shadow Whisper abrir.",
  },
};

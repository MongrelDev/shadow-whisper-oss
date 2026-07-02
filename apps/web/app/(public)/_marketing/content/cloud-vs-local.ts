import type { LocalizedContent } from "../lib/types";

export const cloudVsLocalContent: LocalizedContent = {
  "pt-BR": {
    topic: "cloudVsLocal",
    locale: "pt-BR",
    meta: {
      title: "Ditado na nuvem ou local: por que escolhemos a nuvem",
      description:
        "Modelo local pesa no seu Mac e esquenta a máquina. Veja por que o Shadow Whisper roda na nuvem, fica leve, rápido e não guarda o seu áudio.",
    },
    breadcrumbLabel: "Nuvem x local",
    hero: {
      eyebrow: "Como funciona",
      title: "Leve no seu Mac.",
      highlight: "Pesado na nuvem.",
      lede: "Modelos locais de ditado consomem memória, esquentam o notebook e travam quando você mais precisa. O Shadow Whisper processa na nuvem e devolve o texto na hora, sem pesar.",
      scene: {
        scene: "clean-up",
        kicker: "Processa fora, entrega aqui",
        title: "Seu Mac fica livre",
        description:
          "O trabalho pesado roda na nuvem; o que chega no seu computador é só o texto pronto.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "O custo do local",
          title: "Modelo no seu Mac cobra caro",
          description: "Rodar IA pesada na própria máquina parece grátis, mas não é.",
        },
        items: [
          "Modelos de transcrição de qualidade ocupam gigabytes de RAM e disputam memória com seus apps.",
          "A máquina esquenta, a ventoinha dispara e a bateria some no meio da tarde.",
          "Notebook mais antigo trava ou demora pra transcrever, justo quando você tem pressa.",
          "Pra melhorar o modelo, você precisa baixar tudo de novo e refazer a configuração.",
        ],
      },
      {
        kind: "prose",
        muted: true,
        meta: {
          kicker: "A vantagem da nuvem",
          title: "O peso fica do nosso lado",
          description: "Você só recebe o resultado, rápido e sempre atualizado.",
        },
        items: [
          "O processamento roda em servidores potentes, então seu Mac continua leve e silencioso.",
          "Funciona igual de bem num MacBook antigo ou novo, não depende do seu hardware.",
          "Melhoramos os modelos no nosso lado; você ganha qualidade sem reinstalar nada.",
          "Texto volta em segundos, com limpeza e formatação já aplicadas.",
        ],
      },
      {
        kind: "comparison",
        meta: {
          kicker: "Comparativo",
          title: "Local x nuvem, na prática",
          description: "O que muda no seu dia entre os dois caminhos.",
        },
        comparison: {
          ariaLabel: "Comparação entre ditado com modelo local e ditado na nuvem",
          criterionLabel: "Critério",
          columns: [
            { label: "Modelo local", name: "local" },
            { label: "Shadow Whisper (nuvem)", name: "sw", highlight: true },
          ],
          rows: [
            {
              criterion: "Uso de memória do Mac",
              cells: ["Alto", "Mínimo"],
            },
            {
              criterion: "Esquenta a máquina",
              cells: ["Sim", "Não"],
            },
            {
              criterion: "Depende do hardware",
              cells: ["Sim", "Não"],
            },
            {
              criterion: "Atualização do modelo",
              cells: ["Manual", "Automática"],
            },
            {
              criterion: "Guarda o seu áudio",
              cells: ["Depende", "Não"],
            },
          ],
        },
      },
    ],
    faqs: [
      {
        question: "Vocês guardam o meu áudio na nuvem?",
        answer:
          "Não. O áudio é transcrito e descartado na hora. O que processamos não fica armazenado; só o texto final fica com você, no seu dispositivo.",
      },
      {
        question: "Funciona offline?",
        answer:
          "O ditado por voz precisa de conexão, porque o processamento roda na nuvem. Em troca, seu Mac fica leve e você não baixa modelos pesados.",
      },
      {
        question: "É mais lento que o local?",
        answer:
          "Na prática, não. Servidores potentes transcrevem rápido e o texto volta em segundos, sem travar quando a máquina está cheia de apps abertos.",
      },
      {
        question: "Meu MacBook antigo aguenta?",
        answer:
          "Aguenta. Como o trabalho pesado roda na nuvem, o Shadow Whisper funciona igual de bem em Macs antigos e novos.",
      },
    ],
    faqHeading: {
      kicker: "Dúvidas",
      title: "Perguntas frequentes",
    },
    finalCta: {
      title: "Ditado rápido",
      highlight: "sem pesar no seu Mac.",
      description: "Entre na waitlist e seja avisado quando o Shadow Whisper abrir.",
    },
  },
  en: {
    topic: "cloudVsLocal",
    locale: "en",
    meta: {
      title: "Cloud vs local dictation: why we chose the cloud",
      description:
        "Local models tax your Mac and heat it up. See why Shadow Whisper runs in the cloud, staying light and fast while never storing your audio.",
    },
    breadcrumbLabel: "Cloud vs local",
    hero: {
      eyebrow: "How it works",
      title: "Light on your Mac.",
      highlight: "Heavy in the cloud.",
      lede: "Local dictation models eat memory, heat up your laptop and stall when you need them most. Shadow Whisper processes in the cloud and hands back the text instantly, with no weight.",
      scene: {
        scene: "clean-up",
        kicker: "Process away, deliver here",
        title: "Your Mac stays free",
        description:
          "The heavy lifting runs in the cloud; what reaches your computer is just the finished text.",
      },
    },
    sections: [
      {
        kind: "prose",
        meta: {
          kicker: "The cost of local",
          title: "A model on your Mac charges you",
          description: "Running heavy AI on your own machine looks free, but it isn’t.",
        },
        items: [
          "Quality transcription models take gigabytes of RAM and fight your apps for memory.",
          "The machine heats up, the fan spins, and the battery vanishes by mid-afternoon.",
          "Older laptops stall or lag while transcribing, right when you’re in a hurry.",
          "To improve the model, you have to download it all again and redo the setup.",
        ],
      },
      {
        kind: "prose",
        muted: true,
        meta: {
          kicker: "The cloud advantage",
          title: "The weight stays on our side",
          description: "You just get the result, fast and always up to date.",
        },
        items: [
          "Processing runs on powerful servers, so your Mac stays light and quiet.",
          "It works just as well on an old MacBook or a new one, it doesn’t hinge on your hardware.",
          "We improve the models on our side; you gain quality without reinstalling anything.",
          "Text comes back in seconds, with cleanup and formatting already applied.",
        ],
      },
      {
        kind: "comparison",
        meta: {
          kicker: "Comparison",
          title: "Local vs cloud, in practice",
          description: "What changes in your day between the two paths.",
        },
        comparison: {
          ariaLabel: "Comparison between local-model dictation and cloud dictation",
          criterionLabel: "Criterion",
          columns: [
            { label: "Local model", name: "local" },
            { label: "Shadow Whisper (cloud)", name: "sw", highlight: true },
          ],
          rows: [
            {
              criterion: "Mac memory usage",
              cells: ["High", "Minimal"],
            },
            {
              criterion: "Heats up the machine",
              cells: ["Yes", "No"],
            },
            {
              criterion: "Depends on hardware",
              cells: ["Yes", "No"],
            },
            {
              criterion: "Model updates",
              cells: ["Manual", "Automatic"],
            },
            {
              criterion: "Stores your audio",
              cells: ["Maybe", "No"],
            },
          ],
        },
      },
    ],
    faqs: [
      {
        question: "Do you store my audio in the cloud?",
        answer:
          "No. The audio is transcribed and discarded immediately. What we process is not stored; only the final text stays with you, on your device.",
      },
      {
        question: "Does it work offline?",
        answer:
          "Voice dictation needs a connection, because the processing runs in the cloud. In return, your Mac stays light and you never download heavy models.",
      },
      {
        question: "Is it slower than local?",
        answer:
          "In practice, no. Powerful servers transcribe fast and the text comes back in seconds, without stalling when your machine is full of open apps.",
      },
      {
        question: "Can my old MacBook handle it?",
        answer:
          "Yes. Since the heavy lifting runs in the cloud, Shadow Whisper works just as well on old and new Macs.",
      },
    ],
    faqHeading: {
      kicker: "Questions",
      title: "Frequently asked questions",
    },
    finalCta: {
      title: "Fast dictation",
      highlight: "without weighing down your Mac.",
      description: "Join the waitlist and get notified when Shadow Whisper opens up.",
    },
  },
};

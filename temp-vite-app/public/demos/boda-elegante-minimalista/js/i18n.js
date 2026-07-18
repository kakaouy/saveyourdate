(() => {
  const requested = new URLSearchParams(window.location.search).get("lang");
  const language = ["es", "en", "pt"].includes(requested) ? requested : "es";

  document.documentElement.lang = language;
  window.INVITATION_LANGUAGE = language;

  const translations = {
    en: {
      page: {
        title: "Ana & Juan | We're getting married",
        description: "We invite you to share a very special moment."
      },
      welcome: {
        pretitle: "You're invited to",
        title: "Our wedding",
        message: "We want to share a very special moment with you.",
        buttonWithMusic: "Enter with music",
        buttonWithoutMusic: "Enter without music"
      },
      hero: { pretitle: "We're getting married" },
      quote: {
        text: "The best part of our story is still waiting to be written."
      },
      schedule: {
        title: "Schedule",
        dateText: "Saturday, August 22, 2026",
        items: [
          { time: "18:00", title: "Ceremony", description: "Parroquia del Prado · Av. Joaquín Suárez 3480" },
          { time: "20:00", title: "Reception", description: "Salón del Lago · Camino de los Aromos 2150" },
          { time: "21:00", title: "Dinner", description: "A shared table, toasts and moments to remember." },
          { time: "23:30", title: "Party", description: "Let the music begin and let's dance the night away." }
        ]
      },
      countdown: {
        eyebrow: "Almost there",
        title: "Countdown",
        expiredMessage: "The big day is here!"
      },
      eventInfo: {
        eyebrow: "Save the date",
        title: "The wedding",
        day: "Saturday",
        date: "August 22, 2026",
        locationButtonText: "Get directions"
      },
      location: { eyebrow: "Where", title: "Location" },
      gallery: { eyebrow: "Some memories", title: "Gallery" },
      gifts: {
        eyebrow: "A little something",
        title: "Gifts",
        message: "Your presence is our greatest gift.",
        buttonText: "View information",
        modal: {
          title: "Gifts",
          message: "If you would like to give us a gift, you will find the information here."
        },
        copyButtonText: "Copy bank details"
      },
      playlist: {
        eyebrow: "Let's celebrate together",
        message: "Suggest a song that cannot be missing.",
        buttonText: "Suggest a song",
        errorMessage: "We couldn't send your song. Please try again.",
        modal: { title: "Suggest a song" },
        form: {
          nameLabel: "Your name",
          songLabel: "Song",
          linkLabel: "Optional link",
          submitText: "Send song"
        }
      },
      rsvp: {
        eyebrow: "We hope you can join us",
        title: "RSVP",
        message: "Please confirm your attendance.",
        buttonText: "RSVP",
        modalTitle: "Confirm attendance",
        modalMessage: "Select the attendance status for each guest.",
        submitText: "Save confirmation",
        successMessage: "Thank you! Your response was saved successfully.",
        errorMessage: "An error occurred. Please try again.",
        loadErrorMessage: "We couldn't load the guests.",
        dietaryTitle: "Do you have any dietary restrictions?",
        dietaryDetailLabel: "Tell us which one",
        dietaryDetailPlaceholder: "Specify the restriction",
        dietaryRestrictions: [
          { id: "none", label: "No restrictions" },
          { id: "vegetarian", label: "Vegan / Vegetarian" },
          { id: "celiac", label: "Gluten-free" },
          { id: "other", label: "Other" }
        ]
      },
      closing: {
        pretitle: "We would love to share",
        title: "This moment with you",
        message: "We can't wait to see you!"
      },
      footer: { brandText: "Invitation created by" }
    },
    pt: {
      page: {
        title: "Ana & Juan | Vamos nos casar",
        description: "Convidamos você para compartilhar um momento muito especial."
      },
      welcome: {
        pretitle: "Você está convidado para",
        title: "Nosso casamento",
        message: "Queremos compartilhar com você um momento muito especial.",
        buttonWithMusic: "Entrar com música",
        buttonWithoutMusic: "Entrar sem música"
      },
      hero: { pretitle: "Vamos nos casar" },
      quote: {
        text: "A melhor parte da nossa história ainda está por ser escrita."
      },
      schedule: {
        title: "Cronograma",
        dateText: "Sábado, 22 de agosto de 2026",
        items: [
          { time: "18:00", title: "Cerimônia", description: "Parroquia del Prado · Av. Joaquín Suárez 3480" },
          { time: "20:00", title: "Recepção", description: "Salón del Lago · Camino de los Aromos 2150" },
          { time: "21:00", title: "Jantar", description: "Uma mesa compartilhada, brindes e momentos para recordar." },
          { time: "23:30", title: "Festa", description: "Que comece a música e uma noite para dançar sem olhar o relógio." }
        ]
      },
      countdown: {
        eyebrow: "Falta muito pouco",
        title: "Contagem regressiva",
        expiredMessage: "O grande dia chegou!"
      },
      eventInfo: {
        eyebrow: "Reserve a data",
        title: "O casamento",
        day: "Sábado",
        date: "22 de agosto de 2026",
        locationButtonText: "Como chegar"
      },
      location: { eyebrow: "Onde será", title: "Localização" },
      gallery: { eyebrow: "Algumas lembranças", title: "Galeria" },
      gifts: {
        eyebrow: "Um detalhe",
        title: "Presentes",
        message: "Sua presença é o nosso melhor presente.",
        buttonText: "Ver informações",
        modal: {
          title: "Presentes",
          message: "Se desejar nos dar um presente, aqui você encontrará as informações."
        },
        copyButtonText: "Copiar dados bancários"
      },
      playlist: {
        eyebrow: "Vamos celebrar juntos",
        message: "Sugira uma música que não pode faltar.",
        buttonText: "Sugerir música",
        errorMessage: "Não foi possível enviar sua música. Tente novamente.",
        modal: { title: "Sugira uma música" },
        form: {
          nameLabel: "Seu nome",
          songLabel: "Música",
          linkLabel: "Link opcional",
          submitText: "Enviar música"
        }
      },
      rsvp: {
        eyebrow: "Queremos contar com você",
        title: "Confirmar presença",
        message: "Por favor, confirme sua presença.",
        buttonText: "Confirmar presença",
        modalTitle: "Confirmar presença",
        modalMessage: "Selecione a presença de cada convidado.",
        submitText: "Salvar confirmação",
        successMessage: "Obrigado! Sua resposta foi salva corretamente.",
        errorMessage: "Ocorreu um erro. Tente novamente.",
        loadErrorMessage: "Não foi possível carregar os convidados.",
        dietaryTitle: "Você tem alguma restrição alimentar?",
        dietaryDetailLabel: "Conte para nós",
        dietaryDetailPlaceholder: "Especifique a restrição",
        dietaryRestrictions: [
          { id: "none", label: "Sem restrições" },
          { id: "vegetarian", label: "Vegano / Vegetariano" },
          { id: "celiac", label: "Celíaco / Sem glúten" },
          { id: "other", label: "Outra" }
        ]
      },
      closing: {
        pretitle: "Adoraríamos compartilhar",
        title: "Este momento com você",
        message: "Esperamos por você!"
      },
      footer: { brandText: "Convite criado por" }
    }
  };

  const merge = (target, source) => {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        target[key] = target[key] || {};
        merge(target[key], value);
      } else {
        target[key] = value;
      }
    });
  };

  if (language !== "es") {
    merge(EVENT_CONFIG, translations[language]);
  }

  const staticTexts = {
    en: {
      "Días": "Days",
      "Horas": "Hours",
      "Minutos": "Minutes",
      "Segundos": "Seconds",
      "Google Maps": "Google Maps",
      "Waze": "Waze",
      "Comentario": "Comment",
      "Cerrar": "Close",
      "Cerrar galería": "Close gallery",
      "Imagen anterior": "Previous image",
      "Imagen siguiente": "Next image"
    },
    pt: {
      "Días": "Dias",
      "Horas": "Horas",
      "Minutos": "Minutos",
      "Segundos": "Segundos",
      "Google Maps": "Google Maps",
      "Waze": "Waze",
      "Comentario": "Comentário",
      "Cerrar": "Fechar",
      "Cerrar galería": "Fechar galeria",
      "Imagen anterior": "Imagem anterior",
      "Imagen siguiente": "Próxima imagem"
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (language === "es") return;
    const dictionary = staticTexts[language];

    document.querySelectorAll("body *").forEach((element) => {
      element.childNodes.forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const original = node.textContent.trim();
        if (dictionary[original]) {
          node.textContent = node.textContent.replace(original, dictionary[original]);
        }
      });

      ["aria-label", "placeholder"].forEach((attribute) => {
        const original = element.getAttribute(attribute);
        if (original && dictionary[original]) {
          element.setAttribute(attribute, dictionary[original]);
        }
      });
    });
  });
})();
const EVENT_CONFIG = {
  event: {
    id: "boda-ana-juan-002",
    type: "wedding",
    name: "Ana & Juan",
    date: "2026-08-22T18:00:00",
    endDate: "2026-08-23T05:00:00",
    timezone: "America/Montevideo"
  },

  page: {
    title: "Ana & Juan | Nos casamos",
    description: "Te invitamos a compartir un momento muy especial.",
    favicon: "assets/icons/favicon.png"
  },

  sections: {
    welcome: false,
    hero: true,

    polaroids: true,
    quote: true,
    schedule: true,

    countdown: false,
    event: false,
    location: true,
    dressCode: false,
    gallery: false,

    fullPhoto: true,
    gifts: true,
    playlist: false,
    rsvp: true,

    closing: false,
    footer: true
  },

  theme: {
    defaultPalette: "marfil",
    palettes: {
      marfil: {
        primary: "#273127",
        background: "#f5f0e7",
        secondary: "#d9cdbd",
        accent: "#b79a6b",
        text: "#273127",
        textSoft: "#6f7069"
      },
      rosa: {
        primary: "#513943",
        background: "#f8eeee",
        secondary: "#d8b7bd",
        accent: "#b97986",
        text: "#3e3036",
        textSoft: "#7f6970"
      },
      eucalipto: {
        primary: "#34483d",
        background: "#f0f3ee",
        secondary: "#b8c5b9",
        accent: "#859a87",
        text: "#2d3a32",
        textSoft: "#68756c"
      },
      azul: {
        primary: "#273846",
        background: "#eef3f5",
        secondary: "#b8cad2",
        accent: "#819ead",
        text: "#273846",
        textSoft: "#667985"
      }
    }
  },

  welcome: {
    pretitle: "Estás invitado a",
    title: "Nuestro casamiento",
    message: "Queremos compartir contigo un momento muy especial.",
    buttonWithMusic: "Entrar con música",
    buttonWithoutMusic: "Entrar sin música"
  },

  hero: {
    pretitle: "Nos casamos",
    nameOne: "Ana",
    nameTwo: "Juan",
    location: "Montevideo",
    year: "2026",

    backgroundImage: "",

    decoration: {
      enabled: false,
      image: ""
    }
  },

  polaroids: {
    images: [
      {
        src: "assets/images/galeria/foto-01.jpg",
        alt: "Ana y Juan"
      },
      {
        src: "assets/images/galeria/foto-02.jpg",
        alt: "Ana y Juan"
      },
      {
        src: "assets/images/galeria/foto-03.jpg",
        alt: "Ana y Juan"
      },
      {
        src: "assets/images/galeria/foto-04.jpg",
        alt: "Ana y Juan"
      }
    ]
  },

  quote: {
    text: "La mejor parte de nuestra historia todavía está por escribirse.",
    author: "Ana & Juan"
  },

  schedule: {
    eyebrow: "",
    title: "Cronograma",
    dateText: "Sábado 22 de agosto de 2026",

    items: [
      {
        time: "18:00",
        title: "Ceremonia",
        description: "Parroquia del Prado · Av. Joaquín Suárez 3480"
      },
      {
        time: "20:00",
        title: "Recepción",
        description: "Salón del Lago · Camino de los Aromos 2150"
      },
      {
        time: "21:00",
        title: "Cena",
        description: "Una mesa compartida, brindis y momentos para recordar."
      },
      {
        time: "23:30",
        title: "Fiesta",
        description: "Que empiece la música y una noche para bailar sin mirar el reloj."
      }
    ]
  },

  countdown: {
    eyebrow: "Falta muy poco",
    title: "Cuenta regresiva",
    expiredMessage: "¡Llegó el gran día!"
  },

  eventInfo: {
    eyebrow: "Guardá la fecha",
    title: "El casamiento",
    day: "Sábado",
    date: "22 de agosto de 2026",
    time: "18:00",
    venue: "Parroquia del Prado",
    address: "Av. Joaquín Suárez 3480",
    icon: "assets/icons/calendar.svg",
    locationButtonText: "Cómo llegar"
  },

  location: {
    eyebrow: "Dónde será",
    title: "Ubicación",
    name: "Salón del Lago",
    address: "Camino de los Aromos 2150",
    googleMapsUrl: "https://maps.google.com/",
    wazeUrl: "https://waze.com/",
    icon: "assets/icons/location.svg"
  },

  dressCode: {
    eyebrow: "Para la ocasión",
    title: "Dress Code",
    description: "Elegante",
    note: "",
    icon: "assets/icons/dress-code.svg"
  },

  gallery: {
    eyebrow: "Algunos recuerdos",
    title: "Galería",

    showDots: true,
    showArrows: true,

    autoplay: false,
    autoplaySpeed: 5000,

    images: [
      {
        src: "assets/images/placeholders/placeholder-galeria.jpeg",
        alt: "Ana y Juan",
        objectPosition: "center top"
      },
      {
        src: "assets/images/placeholders/placeholder-galeria.jpeg",
        alt: "Ana y Juan"
      },
      {
        src: "assets/images/placeholders/placeholder-galeria.jpeg",
        alt: "Ana y Juan",
        objectPosition: "50% 20%"
      }
    ]
  },

  fullPhoto: {
    image: "assets/images/galeria/foto-06.jpg",
    alt: "Ana y Juan",
    objectPosition: "center center"
  },

  gifts: {
    eyebrow: "Un detalle",
    title: "Regalos",
    message: "Tu presencia es nuestro mejor regalo.",
    buttonText: "Ver información",
    icon: "assets/icons/gift.svg",

    modal: {
      title: "Regalos",
      message: "Si deseás hacernos un regalo, aquí encontrarás la información."
    },

    accounts: [
      {
        label: "Banco",
        value: "Nombre del banco",
        copyable: false
      },
      {
        label: "Titular",
        value: "Ana y Juan",
        copyable: false
      },
      {
        label: "Cuenta",
        value: "000000000",
        copyable: false
      },
      {
        label: "Alias",
        value: "ANA.JUAN.BODA",
        copyable: false
      }
    ],
    copyButtonText: "Copiar datos bancarios",
    copyValue: "Banco: Nombre del banco\nTitular: Ana y Juan\nCuenta: 000000000\nAlias: ANA.JUAN.BODA"
  },

  playlist: {
    eyebrow: "Hagamos juntos la fiesta",
    title: "Playlist",
    message: "Sugerinos una canción que no puede faltar.",
    buttonText: "Sugerir canción",
    icon: "assets/icons/music.svg",

    errorMessage: "No pudimos enviar tu canción. Intentá nuevamente.",

    modal: {
      title: "Sugerí una canción"
    },

    form: {
      showName: true,
      showLink: true,

      nameLabel: "Tu nombre",
      songLabel: "Canción",
      linkLabel: "Link opcional",
      submitText: "Enviar canción"
    }
  },

  rsvp: {
    eyebrow: "Queremos contar contigo",
    title: "Confirmar asistencia",
    message: "Por favor, confirmá tu asistencia.",
    buttonText: "Confirmar asistencia",

    modalTitle: "Confirmar asistencia",
    modalMessage: "Seleccioná la asistencia de cada invitado.",

    submitText: "Guardar confirmación",

    successMessage: "¡Gracias! Tu respuesta fue guardada correctamente.",
    errorMessage: "Ocurrió un error. Intentá nuevamente.",
    loadErrorMessage: "No pudimos cargar los invitados.",

    showComment: true,
    allowDietaryRestrictions: true,

    dietaryTitle: "¿Tenés alguna restricción alimentaria?",
    dietaryDetailLabel: "Contanos cuál",
    dietaryDetailPlaceholder: "Especificá la restricción",

    dietaryRestrictions: [
      {
        id: "none",
        label: "Sin restricciones"
      },
      {
        id: "vegetarian",
        label: "Vegano / Vegetariano"
      },
      {
        id: "celiac",
        label: "Celíaco / Sin TACC"
      },
      {
        id: "other",
        label: "Otra"
      }
    ]
  },

  closing: {
    pretitle: "Nos encantará compartir",
    title: "Este momento contigo",
    message: "¡Te esperamos!"
  },

  footer: {
    eventName: "Ana & Juan",
    showBrand: true,
    brandText: "Invitación creada por",
    brandName: "Save Your Date",
    brandUrl: "https://saveyourdate.site"
  },

  music: {
    enabled: false,
    loop: true,
    volume: 0.45,
    file: "assets/audio/musica.mp3",
    iconPlaying: "assets/icons/music.svg",
    iconPaused: "assets/icons/music.svg"
  },

  behavior: {
    smoothScroll: true,
    lockBodyOnModal: true,
    closeModalOnBackdrop: true,
    closeModalOnEscape: true
  },

  animations: {
    enabled: true,
    revealOnScroll: true,
    defaultAnimation: "fade-up",
    threshold: 0.15
  },

  loader: {
    enabled: true,
    duration: 3000
  },

  integrations: {
    googleSheets: {
      enabled: false,
      scriptUrl: "https://script.google.com/macros/s/AKfycbzr_12IZjyyfaqO1LYr0BCLoGI8xi5Ex0kcI9rnY5xURj5GYvpdq5gJPbdqvirDW6ogJw/exec"
    },

    rsvp: {
      enabled: true,
      endpoint: ""
    },

    playlist: {
      enabled: false,
      endpoint: ""
    }
  },

  urlParams: {
    guestGroup: "grupo",
    guestId: "invitado",
    preview: "preview"
  }
};

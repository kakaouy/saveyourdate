const EVENT_CONFIG = {
  event: {
    id: "evento-001",
    type: "quince",
    name: "Juanita",
    date: "2026-08-22T21:00:00",
    endDate: "2026-08-23T05:00:00",
    timezone: "America/Montevideo"
  },

  page: {
    title: "Juanita | Mis 15 años",
    description: "Te invito a compartir una noche muy especial.",
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

    gifts: true,
    playlist: false,
    rsvp: true,

    closing: true,
    footer: true
  },

  welcome: {
    pretitle: "Estás invitado a",
    title: "Mis 15 años",
    message: "Quiero compartir contigo una noche muy especial.",
    buttonWithMusic: "Entrar con música",
    buttonWithoutMusic: "Entrar sin música"
  },

  hero: {
    pretitle: "Nos casamos",
    nameOne: "Ana",
    nameTwo: "Juan",
    location: "Montevideo",
    country: "URUGUAY"
  
  
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
      },
      {
        src: "assets/images/galeria/foto-05.jpg",
        alt: "Ana y Juan"
      },
      {
        src: "assets/images/galeria/foto-06.jpg",
        alt: "Ana y Juan"
      }
    ]
  },


  quote: {
    text:
      "La mejor parte de nuestra historia todavía está por escribirse.",

    author:
      "Ana & Juan"
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
        description:  "Una mesa compartida, brindis y momentos para recordar."
      },
      {
        time: "23:30",
        title: "Fiesta",
        description: "Que empiece la música, los abrazos y una noche para bailar sin mirar el reloj."

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
    title: "La fiesta",
    day: "Sábado",
    date: "22 de agosto de 2026",
    time: "21:00",
    venue: "Quinta Los Capibaras ",
    address: "Caminito de los Capibaras 1234, Montevideo, Uruguay",
    icon: "assets/icons/calendar.svg",
    locationButtonText: "Cómo llegar"
  },

  location: {
    eyebrow: "Te espero",
    title: "Ubicación",
    name: "Quinta Los Capibaras",
    address: "Caminito de los Capibaras 1234, Montevideo, Uruguay",
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
        alt: "",
        objectPosition: "center top"
        },

        {
        src: "assets/images/placeholders/placeholder-galeria.jpeg",
        alt: ""
        },

        {
        src: "assets/images/placeholders/placeholder-galeria.jpeg",
        alt: "",
        objectPosition: "50% 20%"
        }
    ]
    },

  gifts: {
    eyebrow: "Un detalle",
    title: "Regalos",
    message: "Tu presencia es mi mejor regalo.",
    buttonText: "Ver información",
    icon: "assets/icons/icon-gift-gd.png",

    modal: {
      title: "Regalos",
      message: "Si deseás hacerme un regalo, podés encontrar aquí la información."
    },

    accounts: [
      {
        label: "Banco",
        value: "Nombre del banco",
        copyable: false
      },
      {
        label: "Titular",
        value: "Nombre del titular",
        copyable: true
      },
      {
        label: "Cuenta",
        value: "000000000",
        copyable: true
      },
    {
        label: "Alias",
        value: "MARIA.EVENTO",
        copyable: true
    }
    ]
  },

playlist: {
  eyebrow: "Hagamos juntos la fiesta",

  title: "Playlist",

  message:
    "Sugerinos una canción que no puede faltar.",

  buttonText:
    "Sugerir canción",

  icon:
    "assets/icons/music.svg",

  errorMessage:
    "No pudimos enviar tu canción. Intentá nuevamente.",

  modal: {
    title:
      "Sugerí una canción"
  },

  form: {
    showName: true,

    showLink: true,

    nameLabel:
      "Tu nombre",

    songLabel:
      "Canción",

    linkLabel:
      "Link opcional",

    submitText:
      "Enviar canción"
  }
},

rsvp: {
  eyebrow:
    "Queremos contar contigo",

  title:
    "Confirmar asistencia",

  message:
    "Por favor, confirmá tu asistencia.",

  buttonText:
    "Confirmar asistencia",

  modalTitle:
    "Confirmar asistencia",

  modalMessage:
    "Seleccioná la asistencia de cada invitado.",

  submitText:
    "Guardar confirmación",

  successMessage:
    "¡Gracias! Tu respuesta fue guardada correctamente.",

  errorMessage:
    "Ocurrió un error. Intentá nuevamente.",

  loadErrorMessage:
    "No pudimos cargar los invitados.",

  showComment:
    true,

  allowDietaryRestrictions:
    true,

  dietaryTitle:
    "¿Tenés alguna restricción alimentaria?",

  dietaryDetailLabel:
    "Contanos cuál",

  dietaryDetailPlaceholder:
    "Especificá la restricción",

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
    pretitle: "Me encantará compartir",
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
    iconPaused: "assets/icons/music-off.svg"
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
   /* =========================================================
     INTEGRACIONES
  ========================================================= */

  integrations: {

    googleSheets: {
      enabled: true,
      scriptUrl: "https://script.google.com/macros/s/AKfycbzr_12IZjyyfaqO1LYr0BCLoGI8xi5Ex0kcI9rnY5xURj5GYvpdq5gJPbdqvirDW6ogJw/exec"
    },

    rsvp: {
      enabled: true,
      endpoint: ""
    },

    playlist: {
      enabled: true,
      endpoint: ""
    }

  },


  /* =========================================================
     PARÁMETROS DE URL
  ========================================================= */

  urlParams: {
    guestGroup: "grupo",
    guestId: "invitado",
    preview: "preview"
  }


};
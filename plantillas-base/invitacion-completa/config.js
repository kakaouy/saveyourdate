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
    welcome: true,
    hero: true,
    countdown: true,
    event: true,
    location: true,
    dressCode: true,
    gallery: true,
    gifts: true,
    playlist: true,
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
    pretitle: "Mis 15 años",
    title: "Juanita",
    subtitle: "Quiero compartir este momento contigo",
    dateText: "22 de agosto de 2026",
    backgroundImage: "assets/images/portada/portada.png",
    decoration: {
      enabled: true,
      image: "assets/decorations/marcos/top.png"
  }
  
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
    venue: "Club La Fiesta",
    address: "Avenida River 487",
    icon: "assets/icons/calendar.svg",
    locationButtonText: "Cómo llegar"
  },

  location: {
    eyebrow: "Te espero",
    title: "Ubicación",
    name: "Club La Fiesta",
    address: "Avenida River 487",
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
        alt: "Juanita",
        objectPosition: "center top"
        },

        {
        src: "assets/images/placeholders/placeholder-galeria.jpeg",
        alt: "Juanita"
        },

        {
        src: "assets/images/placeholders/placeholder-galeria.jpeg",
        alt: "Juanita",
        objectPosition: "50% 20%"
        }
    ]
    },

  gifts: {
    eyebrow: "Un detalle",
    title: "Regalos",
    message: "Tu presencia es mi mejor regalo.",
    buttonText: "Ver información",
    icon: "assets/icons/gift.svg",

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
    message: "¡Te espero!"
  },

  footer: {
    eventName: "Juanita",
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
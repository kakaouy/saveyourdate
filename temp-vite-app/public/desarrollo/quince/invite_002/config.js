window.INVITATION_CONFIG = {
  event: {
    id: "demo-maite-jardin-floral",
    type: "quince",
    honoree: "Maite",
    milestone: "Mis 15",
    startsAt: "2027-06-15T21:00:00-03:00",
    endsAt: "2027-06-16T05:00:00-03:00",
    venue: "Casa Azul",
    address: "Avenida Suarez 5445",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Avenida%20Suarez%205445",
    wazeUrl: "https://waze.com/ul?q=Avenida%20Suarez%205445&navigate=yes",
    dressCode: "Semi formal",
    intro: {
      es: "Quiero invitarte a una noche épica, llena de magia y alegría. Falta muy poquito. Es importante que confirmes tu asistencia antes del 01 de junio.",
      pt: "Quero convidar você para uma noite épica, cheia de magia e alegria. Falta muito pouco. É importante confirmar sua presença antes de 1º de junho.",
      en: "I want to invite you to an epic night filled with magic and joy. It is almost here. Please confirm your attendance before June 1."
    },
    rsvpDeadline: "2027-06-01T23:59:59-03:00",
    instagram: "@maite_XV",
    bank: {
      account: "000000000",
      bankName: "The Bank",
      alias: "maite_xv"
    }
  },
  media: {
    cover: {
      enabled: false,
      src: "./assets/maite-portrait-mural.jpg",
      alt: "Maite frente a un mural colorido",
      position: "50% 33%"
    },
    gallery: [
      { src: "./assets/maite-portrait-tree.jpg", alt: "Maite junto a un árbol durante una sesión nocturna", position: "50% 42%" },
      { src: "./assets/maite-portrait-grass.jpg", alt: "Maite sonriendo sentada sobre el césped", position: "50% 45%" },
      { src: "./assets/maite-portrait-city.jpg", alt: "Maite con luces de la ciudad de fondo", position: "50% 37%" },
      { src: "./assets/maite-portrait-mural.jpg", alt: "Maite frente a un mural urbano", position: "50% 34%" }
    ],
    ornaments: {
      enabled: true,
      top: "./assets/floral-top.png",
      divider: "./assets/floral-divider.png",
      bottom: "./assets/floral-bottom.png"
    },
    calendarIcon: "./assets/icon-calendar.png",
    music: {
      enabled: false,
      src: "",
      title: ""
    }
  },
  sections: {
    cover: true,
    intro: true,
    countdown: true,
    party: true,
    location: true,
    dressCode: true,
    gifts: true,
    playlist: true,
    gallery: true,
    rsvp: true,
    footer: true
  },
  locale: {
    default: "es",
    enabled: ["es", "pt", "en"]
  },
  theme: {
    defaultPalette: "original",
    palettes: {
      original: {
        label: { es: "Original", pt: "Original", en: "Original" },
        page: "#fdfcf8",
        surface: "#f7f1e5",
        accent: "#9ed1aa",
        accentDeep: "#7e9b91",
        ink: "#778c85",
        contrast: "#ffffff",
        coral: "#ff735d",
        gold: "#ffb544"
      },
      night: {
        label: { es: "Noche", pt: "Noite", en: "Night" },
        page: "#f7f1e8",
        surface: "#f4d8bd",
        accent: "#183b59",
        accentDeep: "#102b43",
        ink: "#183b59",
        contrast: "#fff6dc",
        coral: "#ff6f61",
        gold: "#ffc857"
      },
      soft: {
        label: { es: "Suave", pt: "Suave", en: "Soft" },
        page: "#fffaf2",
        surface: "#f5e7df",
        accent: "#b9d4b4",
        accentDeep: "#889f8a",
        ink: "#8d7775",
        contrast: "#ffffff",
        coral: "#e9a4a5",
        gold: "#e8c889"
      }
    }
  },
  integrations: {
    formId: "demo-maite-jardin-floral",
    playlistEndpoint: "",
    rsvpEndpoint: ""
  },
  playlist: {
    allowLinks: true
  },
  rsvp: {
    allowGuestCount: true,
    allowDietaryRestrictions: true
  }
};

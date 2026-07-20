/*
 * CONFIGURACIÓN DEL MODELO 15-001
 * Para crear una nueva invitación, duplicá este objeto y cambiá solamente datos,
 * recursos, paleta y módulos. El motor no contiene información de la clienta.
 */
window.INVITATION_CONFIG = {
  model: {
    id: "quince-001",
    name: "Sueño Rosa",
    eventType: "quince",
    version: 1
  },
  locale: {
    default: "es",
    enabled: ["es", "pt", "en"]
  },
  theme: {
    defaultPalette: "rose",
    palettes: {
      rose: {
        label: { es: "Rosa viejo", pt: "Rosa antigo", en: "Dusty rose" },
        background: "#fffaf6", surface: "#ead7d5", accent: "#b9989a",
        accentDeep: "#8a666a", ink: "#3d3435"
      },
      blue: {
        label: { es: "Azul bruma", pt: "Azul névoa", en: "Misty blue" },
        background: "#f8fafc", surface: "#dce3ec", accent: "#8295ad",
        accentDeep: "#52657f", ink: "#344050"
      },
      sage: {
        label: { es: "Verde salvia", pt: "Verde sálvia", en: "Sage green" },
        background: "#fbfaf5", surface: "#dfe5d8", accent: "#91a087",
        accentDeep: "#63705b", ink: "#394038"
      }
    }
  },
  celebrant: {
    name: "Juanita",
    age: 15,
    instagram: "@juanita.15",
    instagramUrl: "https://www.instagram.com/"
  },
  event: {
    startsAt: "2026-12-12T21:00:00-03:00",
    endsAt: "2026-12-13T05:00:00-03:00",
    rsvpDeadline: "2026-11-20T23:59:00-03:00",
    venue: "Salón Magnolia",
    address: "Av. de las Américas 4900, Montevideo",
    mapsUrl: "https://maps.google.com/?q=Av.+de+las+Américas+4900,+Montevideo",
    dressCode: "Elegante",
    reservedColor: "blanco"
  },
  gifts: {
    enabled: true,
    accounts: [
      { bank: "BROU", holder: "Juanita Demo", account: "000000-00001", currency: "Pesos uruguayos", alias: "JUANITA.15" }
    ]
  },
  music: {
    enabled: true,
    audio: "",
    spotifyEmbed: "",
    suggestionsEnabled: true
  },
  gallery: {
    enabled: true,
    photos: [
      "./assets/juanita-galeria-01.jpg",
      "./assets/juanita-galeria-02.jpg",
      "./assets/juanita-galeria-03.jpg",
      "./assets/juanita-galeria-04.jpg"
    ]
  },
  integrations: {
    /* Se completa al crear el pedido real. Vacío = modo demostración sin enviar datos. */
    appsScriptUrl: ""
  },
  modules: {
    entrance: true,
    countdown: true,
    gallery: true,
    location: true,
    dressCode: true,
    instagram: true,
    playlist: true,
    gifts: true,
    rsvp: true,
    dietaryRestrictions: true
  },
  assets: {
    cover: "./assets/juanita-portada-blur.png",
    parallax: "./assets/juanita-portada-blur.png",
    music: "",
    floralSide: ""
  }
};

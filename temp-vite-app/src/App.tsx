import React, { useState, useEffect } from 'react';
import './App.css';
import { INVITATION_MODELS } from './data/models';
import type { InvitationModel } from './data/models';

// ==========================================
// TRANSLATION DICTIONARY (ES, EN, PT)
// ==========================================
const TRANSLATIONS = {
  es: {
    nav: {
      home: "Inicio",
      models: "Modelos",
      features: "¿Qué incluyen?",
      process: "¿Cómo pedir?",
      questions: "Preguntas",
      upload: "Cargar Datos",
      contact: "Contacto",
      cta: "Crea tu invite",
      myEvent: "Mi Evento"
    },
    hero: {
      tag: "Invitaciones Digitales Premium",
      title1: "Tu evento empieza en la",
      titleHighlight: "primera pantalla",
      desc: "Diseñamos invitaciones digitales hermosas, interactivas y orientadas a tus invitados. Con cuenta regresiva, confirmación de asistencia en tiempo real, mapas, música y mucho más. Todo en un solo link fácil de compartir.",
      ctaPrimary: "Crea tu invite ♥",
      ctaSecondary: "Ver modelos",
      miniCountdown: "FALTAN SOLO",
      miniBtn: "Ver Demo Completo",
      days: "Días", hours: "Hs", mins: "Min"
    },
    catalog: {
      subtitle: "Diseños Únicos",
      title: "Encontrá el modelo para tu evento",
      desc: "Cada diseño se personaliza completamente con tus colores, fotos, información clave y la música que más te represente.",
      filterAll: "Todos",
      filterWedding: "Bodas",
      filter15: "15 Años",
      filterOther: "Otros Eventos",
      popularBadge: "Más Elegido",
      newBadge: "Nuevo",
      trendBadge: "Tendencia",
      verDemo: "Ver Demo",
      personalize: "Personalizar",
      viewMore: "Ver más modelos",
      viewLess: "Ver menos"
    },
    features: {
      subtitle: "Funciones Premium",
      title: "Todo lo que tu invitación necesita",
      desc: "Nuestras invitaciones de un solo link combinan belleza visual con máxima practicidad para vos y tus invitados.",
      cards: [
        { t: "Cuenta Regresiva", d: "La emoción crece segundo a segundo. Un reloj dinámico muestra exactamente cuánto falta para tu gran día." },
        { t: "Confirmación RSVP", d: "Tus invitados confirman su asistencia con un formulario online directo. Recibís los datos organizados al instante." },
        { t: "Música de Fondo", d: "Elegí la canción que los define para ambientar la navegación desde que se abre la pantalla." },
        { t: "Ubicación con GPS", d: "Un enlace directo a Google Maps o Waze para que nadie se pierda y todos lleguen a tiempo al festejo." },
        { t: "Sugerencia de Regalos", d: "Incluí tus datos bancarios, CBU, alias o un link a tu lista de regalos para facilitar el presente a tus invitados." },
        { t: "Código de Vestimenta", d: "Informá a tus invitados sobre el Dress Code de forma elegante (Gala, Elegante Sport, Temático, etc.)." },
        { t: "Galería de Fotos", d: "Compartí un álbum con los mejores momentos de la pareja o fotos previas para emocionar a todos." },
        { t: "Diseño 100% Responsivo", d: "Se adapta de manera fluida y fluida a cualquier dispositivo: computadoras, tablets y sobre todo smartphones." }
      ]
    },
    process: {
      subtitle: "Simple & Rápido",
      title: "¿Cómo es el proceso?",
      desc: "Obtener tu invitación digital Save Your Date es muy sencillo y toma muy pocos pasos.",
      steps: [
        { t: "Elegí tu modelo", d: "Navegá por nuestra galería de diseños elegantes y seleccioná la plantilla que mejor exprese tu personalidad." },
        { t: "Completá los datos", d: "Envianos la información clave: nombres, fecha, lugar, mapa, fotos y la canción de fondo que querés incluir." },
        { t: "Revisá tu borrador", d: "Te enviaremos un link privado para que pruebes tu invitación, corrijas detalles y verifiques que todo esté perfecto." },
        { t: "¡Listo para enviar!", d: "Una vez aprobado, te entregamos tu link final optimizado para compartir directamente por WhatsApp y redes sociales." }
      ],
      cta: "¡Quiero Pedir la Mía! ♥"
    },
    faq: {
      subtitle: "Dudas Comunes",
      title: "Preguntas Frecuentes",
      desc: "Queremos darte total tranquilidad. Aquí respondemos las principales dudas sobre el funcionamiento y personalización de tu invitación digital.",
      items: [
        { q: "¿Cuánto tiempo tarda en estar lista mi invitación?", a: "Una vez que completás el formulario con todos tus datos y subís tus fotos, el borrador privado estará listo en 24 a 48 horas hábiles para tu revisión completa." },
        { q: "¿Puedo realizar cambios después de que esté publicada?", a: "¡Sí, totalmente! Sabemos que pueden surgir imprevistos (cambios de horario, mesa, etc.). Los cambios de información de texto, cronograma y ubicación son gratuitos y los realizamos a la brevedad durante todo tu evento." },
        { q: "¿Cómo confirman asistencia los invitados?", a: "Tus invitados completan un formulario RSVP dentro de la misma invitación web. La respuesta te llega automáticamente a tu planilla de Google Sheets vinculada en tiempo real para que veas el listado organizado al instante." },
        { q: "¿Por cuánto tiempo permanece activo el enlace web?", a: "La invitación permanece activa, online y funcional hasta 30 días después de realizado tu evento. Si necesitás extender el tiempo por algún motivo, podés solicitarlo." },
        { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos transferencias bancarias directas (CBU/Alias) y todas las tarjetas de crédito o débito a través de la pasarela de Mercado Pago." },
        { q: "¿Cómo recibo mi código de validación después de realizar el pago?", a: "Una vez que el pago es aprobado (de forma inmediata con tarjeta o Mercado Pago), nuestro sistema valida la transacción automáticamente y te envía un mensaje de WhatsApp y un correo electrónico con tu confirmación de pago y tu código de validación único (SYD-XXXXXX) para que comiences a cargar tus datos al instante." },
        { q: "¿Cuáles son los precios de los planes?", a: "Nuestros precios varían según el plan de interactividad que elijas y la moneda de tu país. Podés consultar las tarifas actualizadas y realizar tu simulación de pago de forma segura en la sección <a href='#pago'>Elegí tu Plan Save Your Date</a>." },
        { q: "¿Qué incluye el Plan Bronce?", a: "El Plan Bronce es ideal para eventos sencillos y elegantes. Incluye: invitación web de link único activa hasta 30 días después del evento, reloj de cuenta regresiva, detalles de ubicación con mapas GPS interactivos, datos de regalo o alias bancario para transferencias, y galería con hasta 5 fotos." },
        { q: "¿Qué incluye el Plan Plata?", a: "El Plan Plata es nuestro plan Premium más elegido. Incluye todo lo del Plan Bronce (con hasta 10 fotos en la galería) más funciones interactivas avanzadas: música de fondo a tu elección y el formulario digital RSVP para que tus invitados confirmen asistencia directamente desde la web, con las respuestas sincronizadas en tiempo real en tu planilla privada de Google Sheets." },
        { q: "¿Qué incluye el Plan Oro?", a: "El Plan Oro es la experiencia interactiva definitiva. Incluye todo lo del Plan Plata (con hasta 15 fotos en la galería) más beneficios avanzados: playlist colaborativa de Spotify para que tus invitados sugieran canciones para la fiesta y un panel de administración privado y avanzado para gestionar tus invitados." }
      ]
    },
    portal: {
      subtitle: "Portal de Creación",
      title: "Cargá tus Datos Premium",
      desc: "Si ya hiciste el pago, ingresá tu código para comenzar a diseñar tu invitación. Si todavía no compraste, podés realizar el pago simulado y generar tu código inmediatamente debajo.",
      tabCode: "🔑 Tengo un Código de Validación",
      tabPay: "💳 Realizar Pago y Obtener Código",
      steps: {
        s1: "1. Validar Código",
        s2: "2. Tipo de Evento",
        s3: "3. Cargar Información",
        s4: "4. ¡Hecho!"
      },
      codeTitle: "Ingresá tu código de validación",
      codeDesc: "El código de validación garantiza tu acceso premium para subir archivos, música y fotos. Si realizaste la transferencia o pagaste con Mercado Pago, tu código fue enviado a tu WhatsApp o Email.",
      codeTip: "* Tip de prueba: Podés usar los códigos de validación WEDDING2026, QUINCE2026 o comprar un código en la pestaña superior.",
      codePlaceholder: "EJ: SYD-123456",
      codeInvalid: "✗ Código no válido. Por favor, verificá que esté bien escrito o generá un nuevo pago.",
      codeBtn: "Verificar Código y Comenzar",
      categoryTitle: "✓ Código validado correctamente. Seleccioná tu Evento",
      categoryDesc: "Seleccioná la categoría correspondiente. Las preguntas y requerimientos de carga se adaptarán automáticamente para pedirte solo lo que tu invitación necesita.",
      catWedding: "Boda / Casamiento",
      cat15: "Fiesta de 15 Años",
      catOther: "Otro Evento",
      selectModel: "Modelo de Plantilla de Interés",
      btnContinue: "Continuar a Carga de Datos",
      successTitle: "¡Borrador Generado Exitosamente!",
      successDesc: "Nuestros diseñadores están vinculando tus archivos y optimizando tu link personalizado. Te hemos enviado un correo y un mensaje de WhatsApp con los accesos al borrador web y tu planilla de invitados en Google Sheets.",
      successTrack: "CÓDIGO DE SEGUIMIENTO",
      successSheet: "PLANILLA DE INVITADOS: Listo para Google Sheets ✓",
      btnGenerate: "Generar e Inicializar Invitación"
    },
    weddingForm: {
      title: "Información de la Boda",
      p1: "Nombre del Novio/a 1",
      p1wa: "WhatsApp del Novio/a 1",
      p2: "Nombre del Novio/a 2",
      p2wa: "WhatsApp del Novio/a 2",
      civilTitle: "💍 Fecha y Lugar del Casamiento Civil (Opcional)",
      civilDate: "Fecha Civil",
      civilTime: "Hora Civil",
      civilPlace: "Dirección / Registro Civil",
      partyTitle: "💒 Fecha y Lugar de la Fiesta / Ceremonia Principal",
      partyDate: "Fecha Fiesta",
      partyTime: "Hora Fiesta",
      salon: "Nombre del Salón o Estancia",
      gps: "Link de Ubicación (Google Maps)",
      giftTitle: "🎁 Regalo y Detalles Premium",
      alias: "ALIAS de Mercado Pago / Banco",
      cbu: "CBU / CVU Bancario",
      music: "Música preferida (Link de Youtube/Spotify)",
      dress: "Código de Vestimenta (Dress Code)",
      upload: "Subir fotos para la galería (Cargar hasta 5 archivos)",
      uploadTip: "Formatos recomendados: JPG, PNG. Máximo 10MB por foto."
    },
    quinceForm: {
      title: "Información de la Fiesta de 15",
      name: "Nombre de la Quinceañera",
      parents: "Nombres de los Padres (Opcional)",
      partyTitle: "🎉 Fecha y Ubicación de la Fiesta",
      partyDate: "Fecha de la Fiesta",
      partyTime: "Hora de Ingreso",
      salon: "Nombre del Salón y Dirección",
      gps: "Link de Ubicación (Google Maps)",
      styleTitle: "🌟 Estilo, Playlist y Regalo",
      alias: "ALIAS para Lluvia de Sobres / Regalos",
      cbu: "CBU / CVU Bancario",
      music: "Música o Canción Favorita (Link de Spotify/Youtube)",
      dress: "Código de Vestimenta (Dress Code)",
      hashtag: "Hashtag del Evento para Instagram",
      upload: "Subir fotos de tu Book (Hasta 5 fotos)"
    },
    otherForm: {
      title: "Detalles del Evento Especial",
      type: "Tipo de Evento",
      eventTitle: "Título de la Invitación",
      organizer: "Organizador o Homenajeado",
      whenTitle: "📅 Cuándo y Dónde",
      date: "Fecha",
      time: "Hora de Inicio",
      salon: "Dirección del Salón o Quinta",
      gps: "Link de Ubicación (Google Maps)",
      giftTitle: "🎁 Regalo, Música y Requerimientos",
      alias: "ALIAS para Transferencias o Lista",
      cbu: "CBU o CVU Bancario",
      music: "Música preferida (Link de Youtube/Spotify)",
      instructions: "Indicaciones Especiales / Campos Libres para los Invitados",
      upload: "Subir fotos alusivas (Hasta 5 fotos)"
    },
    payment: {
      successTitle: "¡Pago Simulado con Éxito!",
      successDesc: "Hemos recibido la simulación de tu pago. Se ha generado un nuevo código de validación exclusivo para tu invitación. Podés copiarlo abajo e ingresarlo para empezar a diseñar.",
      codeLabel: "Tu código de validación premium",
      destLabel: "CBU destino de pago: Mercado Pago Save Your Date S.A.",
      btnStart: "Comenzar a Crear mi Invitación con este Código 🚀",
      title: "Elegí tu Plan Save Your Date",
      desc: "Seleccioná el nivel de interactividad que buscás. El pago generará inmediatamente tu código de acceso para subir toda tu información.",
      countryLabel: "Seleccioná tu País / Moneda:",
      bronzeTitle: "Plan Bronce (Básico)",
      bronzeDesc: "Invitación de un solo link, cuenta regresiva, detalles de ubicación con mapas y alias bancario.",
      silverTitle: "Plan Plata (Premium) ⭐",
      silverDesc: "Todo lo de Bronce + Música de fondo, formulario interactivo de RSVP en tiempo real con planilla de Google Sheets incluida.",
      goldTitle: "Plan Oro (Diseño 100% Custom)",
      goldDesc: "Plata + Panel de administración avanzado, hasta 20 fotos en la galería, playlist colaborativa de Spotify y adaptaciones de diseño únicas.",
      formTitle: "Formulario de Pago Seguro",
      name: "Nombre y Apellido",
      email: "Correo Electrónico (donde enviaremos el código)",
      phone: "Celular (WhatsApp para notificaciones de RSVP)",
      method: "Método de Pago",
      transfer: "🏦 Transferencia Local",
      mercadopago: "💳 Mercado Pago (Tarjeta)",
      transferInstruct: "* Una vez realizada la transferencia bancaria local, hacé click abajo para validar.",
      gatewayInstruct: "Se simulará una pasarela de pago seguro mediante tarjeta de crédito o débito de Mercado Pago",
      btnPay: "Pagar Plan Seleccionado",
      btnPaying: "Procesando pago seguro..."
    },
    contact: {
      title: "¿Tenés preguntas antes de comprar?",
      desc: "Estamos acá para ayudarte a crear la invitación ideal. Si tenés dudas sobre el funcionamiento, requerimientos especiales o querés consultarnos algo antes de realizar tu pedido, envianos un mensaje directamente aquí.",
      wa: "Escribinos por WhatsApp",
      email: "Envianos un Correo",
      social: "Seguinos en Redes",
      formName: "Nombre y Apellido",
      formPhone: "Celular de Contacto (WhatsApp)",
      formMsg: "Tu Consulta",
      formPlaceholder: "Escribí aquí tu pregunta, inquietud o consulta sobre nuestros modelos...",
      btnSend: "Enviar Mensaje",
      successTitle: "¡Consulta Enviada!",
      successDesc: "Muchas gracias por escribirnos. Recibimos tu consulta con éxito. Te responderemos por WhatsApp o correo electrónico a la brevedad para asesorarte."
    },
    footer: {
      copy: "Save Your Date. Todos los derechos reservados. Hecho con amor para tu día especial."
    },
    modal: {
      invited: "¡Estás Invitado!",
      musicTitle: "Ambientación",
      countdownTitle: "Cuenta Regresiva",
      countdownDesc: "Preparate, falta muy poco para compartir este gran momento.",
      days: "Días", hours: "Horas", mins: "Mins", segs: "Segs",
      where: "📍 ¿Dónde será?",
      whereDesc: "Hacé click abajo para ver cómo llegar en el mapa o abrir con GPS.",
      btnMap: "Ver Ubicación",
      rsvpTitle: "✉ Confirmar Asistencia",
      rsvpDesc: "Ayudanos con la organización confirmando tu presencia antes de la fecha límite.",
      rsvpSuccess: "✓ ¡Asistencia enviada! Muchas gracias por registrar tu respuesta.",
      rsvpName: "Tu nombre completo",
      rsvpOption: "¿Asistirás?",
      rsvpYes: "Asistiré con gusto 🎉",
      rsvpNo: "Lamentablemente no puedo ir 😢",
      guestLabel: "Invitados adicionales:",
      guestSolo: "Voy solo/a (1)",
      guestMultiple: "Somos {count} personas",
      btnConfirm: "Confirmar",
      giftTitle: "Regalo o CBU",
      giftDesc: "El mejor regalo es tu presencia, pero si deseás colaborar con nuestra luna de miel, podés hacerlo con una transferencia."
    },
    extras: {
      btn: "✨ Ver Extras & Beneficios Incluidos",
      title: "Beneficios Premium Incluidos",
      desc: "Además de las funciones interactivas, tu invitación Save Your Date incluye una suite completa de herramientas para facilitar la organización de tu gran día:",
      items: [
        "Diseño exclusivo, animado y adaptable a celulares.",
        "Link listo para compartir por WhatsApp o correo.",
        "Ubicación integrada con Google Maps y Waze.",
        "Confirmación de asistencia digital.",
        "Control de acompañantes y cupos.",
        "Registro de restricciones alimentarias.",
        "Canciones sugeridas por los invitados.",
        "Muro de saludos digital.",
        "Panel privado en Google Sheets con información en tiempo real.",
        "Reporte automático para catering.",
        "Enlaces de WhatsApp para contactar invitados pendientes.",
        "Código QR listo para imprimir.",
        "Opción para agregar el evento al calendario.",
        "Galería o álbum colaborativo.",
        "Mensaje de agradecimiento después del evento.",
        "Alojamiento en la nube hasta 30 días posteriores al evento."
      ]
    },
    admin: {
      loginTitle: "Ingreso al Panel de Control",
      loginDesc: "Iniciá sesión de forma segura usando tu correo electrónico o teléfono y tu código de validación Save Your Date.",
      inputContact: "Correo Electrónico o Celular",
      inputContactPlaceholder: "Ej: novios@correo.com o 11 5555 5555",
      inputCode: "Código de Validación Save Your Date",
      inputCodePlaceholder: "Ej: SYD-123456",
      btnLogin: "Ingresar de forma segura 🔑",
      invalidLogin: "✗ Los datos ingresados no coinciden con un evento premium activo.",
      title: "Panel de Control",
      logout: "Volver al Inicio",
      tabOverview: "Vista General",
      tabGuests: "Lista de Invitados",
      tabTables: "Organizar Mesas",
      statsConfirmed: "Total Confirmados",
      statsDeclined: "Declinados",
      statsPending: "Pendientes",
      statsAdults: "Adultos",
      statsKids: "Niños",
      statsDiets: "Menús Especiales",
      guestTableHead: {
        name: "Nombre",
        status: "Asiste",
        companions: "Acompañantes",
        diet: "Restricciones",
        actions: "Acciones"
      },
      btnSendReminder: "Recordatorio WhatsApp",
      reminderTemplate: "¡Hola! Esperamos que puedas acompañarnos. Te recordamos que podés confirmar tu asistencia directamente en nuestra invitación Save Your Date. ¡Un abrazo!",
      tableTitle: "Gestión de Mesas",
      tableDesc: "Asigná a tus invitados confirmados a mesas virtuales para organizar la distribución del salón de forma visual.",
      unassignedGuests: "Invitados sin mesa asignada",
      tableLabel: "Mesa",
      btnAssign: "Asignar",
      noGuests: "No hay invitados en esta sección.",
      noUnassigned: "¡Todos los invitados confirmados ya tienen mesa asignada! 🎉",
      addGuest: "Agregar Invitado",
      deleteGuest: "Eliminar",
      guestAdded: "✓ Invitado agregado exitosamente.",
      placeholderAdd: "Nombre del invitado",
      addTable: "Agregar Mesa",
      deleteTable: "Eliminar Mesa",
      placeholderAddTable: "Nombre de la mesa (Ej: Mesa 4)"
    }
  },
  en: {
    nav: {
      home: "Home",
      models: "Models",
      features: "What's included?",
      process: "How to order?",
      questions: "FAQ",
      upload: "Upload Data",
      contact: "Contact",
      cta: "Create invite",
      myEvent: "My Event"
    },
    hero: {
      tag: "Premium Digital Invitations",
      title1: "Your event starts on the",
      titleHighlight: "first screen",
      desc: "We design beautiful, interactive, and guest-oriented digital invitations. Featuring live count down, real-time RSVP confirmations, maps, background music, and much more. All in a single easy-to-share link.",
      ctaPrimary: "Create your invite ♥",
      ctaSecondary: "View models",
      miniCountdown: "ONLY REMAINING",
      miniBtn: "View Full Demo",
      days: "Days", hours: "Hrs", mins: "Min"
    },
    catalog: {
      subtitle: "Unique Designs",
      title: "Find the template for your event",
      desc: "Each design is completely customized with your colors, photos, key information, and the background music that best represents you.",
      filterAll: "All",
      filterWedding: "Weddings",
      filter15: "15 Years",
      filterOther: "Other Events",
      popularBadge: "Best Seller",
      newBadge: "New",
      trendBadge: "Trending",
      verDemo: "See Demo",
      personalize: "Customize"
    },
    features: {
      subtitle: "Premium Features",
      title: "Everything your invitation needs",
      desc: "Our single-link web invitations combine breathtaking aesthetics with absolute convenience for you and your guests.",
      cards: [
        { t: "Countdown Timer", d: "Excitement builds up second by second. A dynamic clock shows exactly how much time is left for your big day." },
        { t: "RSVP Confirmation", d: "Your guests confirm attendance through a direct online form. You receive organized guest counts instantly." },
        { t: "Background Music", d: "Choose the song that defines you both to set the mood for your guests the moment they open the page." },
        { t: "GPS Location Map", d: "Direct link to Google Maps or Waze so that nobody gets lost and everyone arrives at the party on time." },
        { t: "Gift Registry / Bank", d: "Include your bank account details, wire info, or a registry link to make gifts easy and convenient." },
        { t: "Dress Code Guide", d: "Inform your guests about the preferred dress code in an elegant way (Black Tie, Smart Casual, White, etc.)." },
        { t: "Photo Gallery", d: "Share a beautiful photo album with the couple's best moments or pre-wedding shoots to touch everyone." },
        { t: "100% Responsive Design", d: "Adapts smoothly and elegantly to any device: desktop computers, tablets, and especially smartphones." }
      ]
    },
    process: {
      subtitle: "Simple & Fast",
      title: "How does it work?",
      desc: "Getting your Save Your Date digital invitation is incredibly straightforward and takes very few steps.",
      steps: [
        { t: "Choose your model", d: "Explore our gallery of elegant designs and select the template that best matches your event's personality." },
        { t: "Fill out your details", d: "Send us the key details: names, date, venue, maps, photos, and your favorite background music." },
        { t: "Review your draft", d: "We will send you a private draft link so you can test your invitation, adjust details, and make sure it's perfect." },
        { t: "Ready to share!", d: "Once approved, we deliver your final optimized link, perfect for sharing on WhatsApp and social media." }
      ],
      cta: "I Want Mine! ♥"
    },
    faq: {
      subtitle: "Common Questions",
      title: "Frequently Asked Questions",
      desc: "We want you to have peace of mind. Here we answer the main questions regarding how your digital invitation works.",
      items: [
        { q: "How long does it take for my invitation to be ready?", a: "Once you complete the form with your details and upload your photos, your private draft will be ready in 24 to 48 business hours for review." },
        { q: "Can I make changes after it is published?", a: "Yes, absolutely! We know unexpected adjustments happen (schedule changes, table numbers, etc.). Text and location updates are free throughout the duration of your event." },
        { q: "How do guests confirm their attendance?", a: "Your guests fill out an RSVP form within the web invitation. Answers are automatically added to your linked Google Sheet in real time." },
        { q: "How long does the web link remain active?", a: "The invitation remains active and fully functional online up to 30 days after your event has taken place." },
        { q: "What payment methods do you accept?", a: "We accept local bank transfers, wire transfers, and all credit/debit cards processed securely through Mercado Pago or PayPal." },
        { q: "What are the prices of the plans?", a: "Our prices vary depending on the interactivity plan you choose and your country's currency. You can check the updated rates and make your secure payment simulation in the <a href='#pago'>Choose Your Save Your Date Plan</a> section." },
        { q: "What does the Bronze Plan include?", a: "The Bronze Plan is perfect for simple and elegant events. It includes: single web link invitation active up to 30 days after the event, live countdown timer, location details with interactive GPS maps, gift registry or bank wire details, and a photo gallery with up to 5 photos." },
        { q: "What does the Silver Plan include?", a: "The Silver Plan is our most popular Premium plan. It includes everything in the Bronze Plan (with up to 10 gallery photos) plus advanced interactive features: background music of your choice and the digital RSVP form so your guests can confirm attendance directly from the website, with answers synced in real-time to your private Google Sheets spreadsheet." },
        { q: "What does the Gold Plan include?", a: "The Gold Plan is the ultimate interactive experience. It includes everything in the Silver Plan (with up to 15 gallery photos) plus advanced benefits: a collaborative Spotify playlist for your guests to suggest party songs and an advanced private admin panel to manage guests." }
      ]
    },
    portal: {
      subtitle: "Creation Portal",
      title: "Upload your Premium Details",
      desc: "If you have already paid, enter your code below to start designing. If you haven't purchased yet, you can simulate a payment and generate a code instantly.",
      tabCode: "🔑 I Have a Validation Code",
      tabPay: "💳 Simulate Payment & Get Code",
      steps: {
        s1: "1. Validate Code",
        s2: "2. Event Type",
        s3: "3. Upload Info",
        s4: "4. Done!"
      },
      codeTitle: "Enter your validation code",
      codeDesc: "The validation code ensures premium access to upload files, music, and photographs. Once payment is confirmed, your code is sent via WhatsApp or Email.",
      codeTip: "* Testing tip: You can use mock validation codes WEDDING2026, QUINCE2026, or buy a code on the second tab.",
      codePlaceholder: "EX: SYD-123456",
      codeInvalid: "✗ Invalid code. Please check your spelling or generate a new payment code.",
      codeBtn: "Verify Code and Begin",
      categoryTitle: "✓ Code successfully validated. Select your Event",
      categoryDesc: "Select the corresponding category. Questions and upload fields will automatically adjust to request exactly what your invitation needs.",
      catWedding: "Wedding / Marriage",
      cat15: "15th Birthday Party",
      catOther: "Other Event",
      selectModel: "Interest Template Model",
      btnContinue: "Continue to Information Form",
      successTitle: "Draft Generated Successfully!",
      successDesc: "Our designers are linking your files and optimizing your custom link. We have sent you an email and a WhatsApp message with the draft access and your Google Sheets guest sheet.",
      successTrack: "TRACKING CODE",
      successSheet: "GUEST SPREADSHEET: Ready on Google Sheets ✓",
      btnGenerate: "Generate and Build Digital Invite"
    },
    weddingForm: {
      title: "Wedding Information",
      p1: "Groom/Bride 1 Name",
      p1wa: "Groom/Bride 1 WhatsApp",
      p2: "Groom/Bride 2 Name",
      p2wa: "Groom/Bride 2 WhatsApp",
      civilTitle: "💍 Civil Ceremony Date & Venue (Optional)",
      civilDate: "Civil Date",
      civilTime: "Civil Time",
      civilPlace: "Address / Registry Venue",
      partyTitle: "💒 Main Ceremony & Party Date & Venue",
      partyDate: "Fiesta Date",
      partyTime: "Fiesta Time",
      salon: "Hall or Estate Name",
      gps: "Location Link (Google Maps)",
      giftTitle: "🎁 Gift Registry & Wire Details",
      alias: "Alias / Banking Code",
      cbu: "CBU / Wire Code",
      music: "Favorite Song (Youtube/Spotify Link)",
      dress: "Dress Code",
      upload: "Upload photos for the gallery (Up to 5 files)",
      uploadTip: "Recommended formats: JPG, PNG. Max 10MB per photo."
    },
    quinceForm: {
      title: "15th Birthday Party Information",
      name: "Birthday Girl Name",
      parents: "Parents' Names (Optional)",
      partyTitle: "🎉 Party Date & Location",
      partyDate: "Party Date",
      partyTime: "Arrival Time",
      salon: "Hall Name and Address",
      gps: "Location Link (Google Maps)",
      styleTitle: "🌟 Style, Playlist & Gifts",
      alias: "Gift Envelope / Bank Alias",
      cbu: "CBU / Wire Code",
      music: "Favorite Song (Spotify/Youtube Link)",
      dress: "Dress Code / Theme",
      hashtag: "Event Instagram Hashtag",
      upload: "Upload Book Photos (Up to 5 high-res files)"
    },
    otherForm: {
      title: "Special Event Details",
      type: "Event Type",
      eventTitle: "Invitation Title",
      organizer: "Organizer or Honoree",
      whenTitle: "📅 When and Where",
      date: "Date",
      time: "Start Time",
      salon: "Hall or Venue Address",
      gps: "Location Link (Google Maps)",
      giftTitle: "🎁 Gifts, Music & Requirements",
      alias: "Bank Alias or Wire Details",
      cbu: "CBU / Wire Code",
      music: "Background Music (Youtube/Spotify Link)",
      instructions: "Special Instructions / Custom Notes for Guests",
      upload: "Upload Event Photos (Up to 5 files)"
    },
    payment: {
      successTitle: "Payment Simulated Successfully!",
      successDesc: "We received your simulated payment. A new premium validation code has been generated. Copy it below to start designing.",
      codeLabel: "Your Premium Validation Code",
      destLabel: "Payment Destination: Mercado Pago Save Your Date S.A.",
      btnStart: "Start Building My Invitation with This Code 🚀",
      title: "Choose Your Save Your Date Plan",
      desc: "Select the level of interactivity you desire. Payment instantly generates your code to start uploading.",
      countryLabel: "Select Your Country / Currency:",
      bronzeTitle: "Bronze Plan (Basic)",
      bronzeDesc: "Single web link, live countdown timer, location details with maps, and banking details.",
      silverTitle: "Silver Plan (Premium) ⭐",
      silverDesc: "Everything in Bronze + Background music, interactive RSVP guest form linked in real time to your Google Sheet.",
      goldTitle: "Gold Plan (100% Custom)",
      goldDesc: "Silver + Advanced admin panel, up to 20 gallery photos, Spotify group playlist, and custom layout adaptations.",
      formTitle: "Secure Payment Checkout",
      name: "Full Name",
      email: "Email Address (to receive code)",
      phone: "Phone Number (WhatsApp for RSVP alerts)",
      method: "Payment Method",
      transfer: "🏦 Local Bank Wire",
      mercadopago: "💳 Credit / Debit Card (Mercado Pago)",
      transferInstruct: "* Once you complete the local bank wire, click below to validate.",
      gatewayInstruct: "A secure checkout simulation will be processed through Mercado Pago card payments",
      btnPay: "Pay Selected Plan",
      btnPaying: "Processing secure payment..."
    },
    contact: {
      title: "Have questions before buying?",
      desc: "We are here to help you design the perfect invitation. If you have questions about features, customized requirements, or want to consult before purchasing, send us a direct message.",
      wa: "Write us on WhatsApp",
      email: "Send us an Email",
      social: "Follow on Socials",
      formName: "Full Name",
      formPhone: "Contact Cellphone (WhatsApp)",
      formMsg: "Your Message",
      formPlaceholder: "Type your questions or inquiries about our templates here...",
      btnSend: "Send Message",
      successTitle: "Message Sent!",
      successDesc: "Thank you for writing. We successfully received your inquiry. We will contact you via WhatsApp or Email shortly to assist you."
    },
    footer: {
      copy: "Save Your Date. All rights reserved. Made with love for your special day."
    },
    modal: {
      invited: "You Are Invited!",
      musicTitle: "Background Music",
      countdownTitle: "Countdown",
      countdownDesc: "Get ready, there is very little time left to share this great moment.",
      days: "Days", hours: "Hours", mins: "Mins", segs: "Secs",
      where: "📍 Where will it be?",
      whereDesc: "Click below to see directions on the map or open with GPS.",
      btnMap: "View Location",
      rsvpTitle: "✉ Confirm Attendance (RSVP)",
      rsvpDesc: "Please help us organize by confirming your attendance before the deadline.",
      rsvpSuccess: "✓ Attendance confirmed! Thank you for letting us know.",
      rsvpName: "Your Full Name",
      rsvpOption: "Will you attend?",
      rsvpYes: "I will attend gladly 🎉",
      rsvpNo: "Unfortunately I cannot attend 😢",
      guestLabel: "Additional guests:",
      guestSolo: "Attending solo (1)",
      guestMultiple: "We are {count} people",
      btnConfirm: "Confirm RSVP",
      giftTitle: "Gift details",
      giftDesc: "The best gift is your presence, but if you wish to collaborate with our honeymoon fund, you can wire a transfer."
    },
    extras: {
      btn: "✨ See Included Extras & Benefits",
      title: "Premium Included Benefits",
      desc: "In addition to interactive features, your Save Your Date invitation includes a full suite of organization tools for your big day:",
      items: [
        "Exclusive, animated, and fully mobile-responsive design.",
        "Ready-to-share link for WhatsApp or email.",
        "Integrated location with Google Maps and Waze.",
        "Digital RSVP / attendance confirmation.",
        "Guest count and companion capacity controls.",
        "Dietary restriction and food allergy registry.",
        "Song suggestions from your guests.",
        "Digital congratulations guest book wall.",
        "Private Google Sheets panel with real-time sync.",
        "Automatic catering reports.",
        "WhatsApp shortcut links to contact pending guests.",
        "Print-ready QR Code.",
        "Add-to-calendar event options.",
        "Collaborative guest photo gallery or album.",
        "Thank-you message page post-event.",
        "Cloud hosting active up to 30 days after the event."
      ]
    },
    admin: {
      loginTitle: "Control Panel Login",
      loginDesc: "Log in securely using your email or phone number and your unique Save Your Date validation code.",
      inputContact: "Email or Phone Number",
      inputContactPlaceholder: "e.g. hosts@email.com or 11 5555 5555",
      inputCode: "Save Your Date Validation Code",
      inputCodePlaceholder: "e.g. SYD-123456",
      btnLogin: "Secure Login 🔑",
      invalidLogin: "✗ The entered credentials do not match an active premium event.",
      title: "Control Panel",
      logout: "Back to Home",
      tabOverview: "Overview",
      tabGuests: "Guest List",
      tabTables: "Manage Tables",
      statsConfirmed: "Total Confirmed",
      statsDeclined: "Declined",
      statsPending: "Pending",
      statsAdults: "Adults",
      statsKids: "Kids",
      statsDiets: "Special Menus",
      guestTableHead: {
        name: "Name",
        status: "Attending",
        companions: "Companions",
        diet: "Restrictions",
        actions: "Actions"
      },
      btnSendReminder: "WhatsApp Reminder",
      reminderTemplate: "Hi! We hope you can join us. We kindly remind you that you can confirm your attendance directly on our Save Your Date digital invitation. Hugs!",
      tableTitle: "Table Assignment",
      tableDesc: "Assign confirmed guests to virtual tables to visually organize your venue's seating chart layout.",
      unassignedGuests: "Guests with no table assigned",
      tableLabel: "Table",
      btnAssign: "Assign",
      noGuests: "No guests found in this section.",
      noUnassigned: "All confirmed guests have a table assigned! 🎉",
      addGuest: "Add Guest",
      deleteGuest: "Delete",
      guestAdded: "✓ Guest added successfully.",
      placeholderAdd: "Guest name",
      addTable: "Add Table",
      deleteTable: "Delete Table",
      placeholderAddTable: "Table name (e.g. Table 4)"
    }
  },
  pt: {
    nav: {
      home: "Início",
      models: "Modelos",
      features: "O que inclui?",
      process: "Como pedir?",
      questions: "Perguntas",
      upload: "Carregar Dados",
      contact: "Contato",
      cta: "Crie seu convite",
      myEvent: "Meu Evento"
    },
    hero: {
      tag: "Convites Digitais Premium",
      title1: "Seu evento começa na",
      titleHighlight: "primeira tela",
      desc: "Desenhamos convites digitais bonitos, interativos e focados nos seus convidados. Com contagem regressiva, confirmação de presença em tempo real, mapas, música e muito mais. Tudo num link fácil de compartilhar.",
      ctaPrimary: "Crie seu convite ♥",
      ctaSecondary: "Ver modelos",
      miniCountdown: "FALTAM SÓ",
      miniBtn: "Ver Demo Completo",
      days: "Dias", hours: "Hrs", mins: "Min"
    },
    catalog: {
      subtitle: "Modelos Únicos",
      title: "Encontre o modelo para seu evento",
      desc: "Cada modelo é totalmente personalizado com as suas cores, fotos, informações e a música que melhor representa você.",
      filterAll: "Todos",
      filterWedding: "Casamentos",
      filter15: "15 Anos",
      filterOther: "Outros Eventos",
      popularBadge: "Mais Escolhido",
      newBadge: "Novo",
      trendBadge: "Tendência",
      verDemo: "Ver Demo",
      personalize: "Personalizar"
    },
    features: {
      subtitle: "Funções Premium",
      title: "Tudo o que seu convite precisa",
      desc: "Nossos convites de link único combinam beleza visual com máxima praticidade para você e seus convidados.",
      cards: [
        { t: "Contagem Regressiva", d: "A emoção aumenta segundo a segundo. Um relógio dinâmico mostra exatamente quanto falta para o seu grande dia." },
        { t: "Confirmação RSVP", d: "Seus convidados confirmam presença em um formulário online direto. Você recebe a lista organizada instantaneamente." },
        { t: "Música de Fundo", d: "Escolha a música que melhor define vocês para ambientar a navegação desde que a tela se abre." },
        { t: "Localização com GPS", d: "Um link direto para o Google Maps ou Waze para que ninguém se perca e todos cheguem a tempo para celebrar." },
        { t: "Sugestão de Presentes", d: "Inclua seus dados bancários, chave PIX, conta ou link da sua lista de presentes para facilitar para seus convidados." },
        { t: "Código de Vestimenta", d: "Informe seus convidados sobre o Dress Code de forma elegante (Gala, Esporte Fino, Temático, etc.)." },
        { t: "Galeria de Fotos", d: "Compartilhe um álbum com os melhores momentos do casal ou fotos do ensaio pré-casamento para emocionar a todos." },
        { t: "Design 100% Responsivo", d: "Adapta-se de forma fluida a qualquer dispositivo: computadores, tablets e, principalmente, smartphones." }
      ]
    },
    process: {
      subtitle: "Simples & Rápido",
      title: "Como é o processo?",
      desc: "Obter seu convite digital Save Your Date é muito simples e leva poucos passos.",
      steps: [
        { t: "Escolha seu modelo", d: "Navegue pela nossa galeria de designs elegantes e selecione o modelo que melhor expresse sua personalidade." },
        { t: "Complete os dados", d: "Envie-nos as informações principais: nomes, data, local, mapa, fotos e a música de fundo que deseja incluir." },
        { t: "Revise seu rascunho", d: "Enviaremos um link privado para você testar seu convite, ajustar detalhes e garantir que tudo esteja perfeito." },
        { t: "Pronto para enviar!", d: "Uma vez aprovado, entregamos seu link final otimizado para compartilhar diretamente por WhatsApp e redes sociais." }
      ],
      cta: "Quero o Meu! ♥"
    },
    faq: {
      subtitle: "Dúvidas Comuns",
      title: "Perguntas Frequentes",
      desc: "Queremos lhe dar total tranquilidade. Aqui respondemos as principais dúvidas sobre o funcionamento e personalização do seu convite digital.",
      items: [
        { q: "Quanto tempo demora para meu convite ficar pronto?", a: "Assim que você preencher o formulário com seus dados e enviar as fotos, o rascunho privado estará pronto em 24 a 48 horas úteis para sua revisão." },
        { q: "Posso fazer alterações depois de publicado?", a: "Sim, com certeza! Sabemos que imprevistos acontecem (mudanças de horário, mesa, etc.). Alterações de texto e localização são gratuitas durante todo o evento." },
        { q: "Como os convidados confirmam presença?", a: "Seus convidados preenchem o formulário RSVP dentro do próprio convite digital. A resposta chega de forma automática na sua planilha do Google Sheets vinculada em tempo real." },
        { q: "Por quanto tempo o link permanece ativo?", a: "O convite digital permanece ativo e totalmente funcional online até 30 dias após a realização do seu evento." },
        { q: "Quais métodos de pagamento são aceitos?", a: "Aceitamos transferências bancárias locais, PIX (no Brasil) e todos os cartões de crédito ou débito através do Mercado Pago ou PayPal." },
        { q: "Quais são os preços dos planos?", a: "Nossos preços variam de acordo com o plano de interatividade escolhido e a moeda do seu país. Você pode consultar as tarifas atualizadas e simular seu pagamento com segurança na seção <a href='#pago'>Escolha seu Plano Save Your Date</a>." },
        { q: "O que inclui o Plano Bronze?", a: "O Plano Bronze é ideal para eventos simples e elegantes. Inclui: convite web de link único ativo até 30 dias após o evento, relógio de contagem regressiva, detalhes de localização com mapas GPS interativos, dados de presente ou chave bancária para transferências, e galeria de fotos com até 5 fotos." },
        { q: "O que inclui o Plano Prata?", a: "O Plano Prata é o nosso plano Premium mais escolhido. Inclui tudo do Plano Bronze (com até 10 fotos na galeria) além de recursos interativos avançados: música de fundo de sua escolha e o formulário digital RSVP para seus convidados confirmarem presença diretamente pelo site, com as respostas sincronizadas em tempo real na sua planilha privada do Google Sheets." },
        { q: "O que inclui o Plano Ouro?", a: "O Plano Ouro é a experiência interativa definitiva. Inclui tudo do Plano Prata (com até 15 fotos na galeria) além de benefícios avançados: playlist colaborativa do Spotify para os convidados sugerirem músicas para a festa e um painel de administração privado e avançado para gerenciar convidados." }
      ]
    },
    portal: {
      subtitle: "Portal de Criação",
      title: "Carregue seus Dados Premium",
      desc: "Se você já realizou o pagamento, insira seu código para começar a desenhar seu convite. Se ainda não comprou, simule o pagamento e gere seu código logo abaixo.",
      tabCode: "🔑 Tenho um Código de Validação",
      tabPay: "💳 Realizar Pagamento e Obter Código",
      steps: {
        s1: "1. Validar Código",
        s2: "2. Tipo de Evento",
        s3: "3. Carregar Informações",
        s4: "4. Pronto!"
      },
      codeTitle: "Insira seu código de validação",
      codeDesc: "O código de validação garante seu acesso premium para carregar arquivos, músicas e fotos. Se realizou o pagamento via PIX ou Mercado Pago, seu código foi enviado por WhatsApp ou E-mail.",
      codeTip: "* Dica de teste: Você pode usar os códigos de teste WEDDING2026, QUINCE2026 ou comprar um código na aba superior.",
      codePlaceholder: "EX: SYD-123456",
      codeInvalid: "✗ Código inválido. Por favor, verifique se foi digitado corretamente ou gere um novo pagamento.",
      codeBtn: "Verificar Código e Começar",
      categoryTitle: "✓ Código validado com sucesso. Selecione seu Evento",
      categoryDesc: "Selecione a categoria correspondente. As perguntas e requisitos de carregamento se adaptarão automaticamente para pedir apenas o que seu convite precisa.",
      catWedding: "Casamento / Boda",
      cat15: "Festa de 15 Anos",
      catOther: "Outro Evento",
      selectModel: "Modelo de Template de Interesse",
      btnContinue: "Continuar para Carregamento de Dados",
      successTitle: "Rascunho Gerado com Sucesso!",
      successDesc: "Nossos designers estão vinculando seus arquivos e otimizando seu link personalizado. Enviamos um e-mail e um WhatsApp com os acessos ao rascunho web e sua planilha de convidados no Google Sheets.",
      successTrack: "CÓDIGO DE RASTREAMENTO",
      successSheet: "PLANILHA DE CONVIDADOS: Pronto no Google Sheets ✓",
      btnGenerate: "Gerar e Inicializar Convite Digital"
    },
    weddingForm: {
      title: "Informações do Casamento",
      p1: "Nome do Noivo/a 1",
      p1wa: "WhatsApp do Noivo/a 1",
      p2: "Nome do Noivo/a 2",
      p2wa: "WhatsApp do Noivo/a 2",
      civilTitle: "💍 Data e Local do Casamento Civil (Opcional)",
      civilDate: "Data Civil",
      civilTime: "Hora Civil",
      civilPlace: "Endereço / Cartório Civil",
      partyTitle: "💒 Data e Local da Festa / Cerimônia Principal",
      partyDate: "Data Festa",
      partyTime: "Hora Festa",
      salon: "Nome do Salão ou Espaço",
      gps: "Link de Localização (Google Maps)",
      giftTitle: "🎁 Presente e Detalhes Premium",
      alias: "Chave PIX / Código do Banco",
      cbu: "Cód. de Transferência (CBU/IBAN)",
      music: "Música preferida (Link de Youtube/Spotify)",
      dress: "Código de Vestimenta (Dress Code)",
      upload: "Enviar fotos para a galeria (Carregar até 5 arquivos)",
      uploadTip: "Formatos recomendados: JPG, PNG. Máximo 10MB por foto."
    },
    quinceForm: {
      title: "Informações da Festa de 15 Anos",
      name: "Nome da Debutante",
      parents: "Nomes dos Pais (Opcional)",
      partyTitle: "🎉 Data e Local da Festa",
      partyDate: "Data da Festa",
      partyTime: "Hora de Entrada",
      salon: "Nome do Salão e Endereço",
      gps: "Link de Localização (Google Maps)",
      styleTitle: "🌟 Estilo, Playlist e Presentes",
      alias: "Chave PIX / Lista de Presentes",
      cbu: "Cód. de Transferência (CBU/Wire)",
      music: "Música Favorita (Link do Spotify/Youtube)",
      dress: "Código de Vestimenta / Tema",
      hashtag: "Hashtag do Evento para o Instagram",
      upload: "Carregar Fotos do Ensaio (Até 5 fotos de alta resolução)"
    },
    otherForm: {
      title: "Detalhes do Evento Especial",
      type: "Tipo de Evento",
      eventTitle: "Título do Convite",
      organizer: "Organizador ou Homenageado",
      whenTitle: "📅 Quando e Onde",
      date: "Data",
      time: "Hora de Início",
      salon: "Endereço do Salão ou Chácara",
      gps: "Link de Localização (Google Maps)",
      giftTitle: "🎁 Presente, Música e Requisitos",
      alias: "Chave PIX ou Detalhes da Conta",
      cbu: "Cód. de Transferência (CBU/Wire)",
      music: "Música de Fundo (Link de Youtube/Spotify)",
      instructions: "Instruções Especiais / Notas para os Convidados",
      upload: "Carregar Fotos Alusivas (Até 5 arquivos)"
    },
    payment: {
      successTitle: "Pagamento Simulado com Sucesso!",
      successDesc: "Recebemos a simulação do seu pagamento. Foi gerado um novo código de validação exclusivo para o seu convite. Copie-o abaixo para começar a projetar.",
      codeLabel: "Seu Código de Validação Premium",
      destLabel: "Destino do Pagamento: Mercado Pago Save Your Date S.A.",
      btnStart: "Começar a Criar meu Convite com este Código 🚀",
      title: "Escolha seu Plano Save Your Date",
      desc: "Selecione o nível de interatividade que você deseja. O pagamento gera seu código para carregar informações instantaneamente.",
      countryLabel: "Selecione seu País / Moeda:",
      bronzeTitle: "Plano Bronze (Básico)",
      bronzeDesc: "Convite de link único, contagem regressiva, detalhes de localização com mapas e chave bancária.",
      silverTitle: "Plano Prata (Premium) ⭐",
      silverDesc: "Tudo do Bronze + Música de fundo, formulário interativo de presença RSVP conectado em tempo real com sua planilha de Google Sheets.",
      goldTitle: "Plano Ouro (Design 100% Personalizado)",
      goldDesc: "Prata + Painel de administração avançado, até 20 fotos na galeria, playlist colaborativa do Spotify e adaptações exclusivas de layout.",
      formTitle: "Formulário de Pagamento Seguro",
      name: "Nome Completo",
      email: "E-mail (onde enviaremos o código)",
      phone: "Celular (WhatsApp para alertas de RSVP)",
      method: "Forma de Pagamento",
      transfer: "🏦 Transferência Bancária Local / PIX",
      mercadopago: "💳 Mercado Pago (Cartão)",
      transferInstruct: "* Depois de realizar a transferência bancária ou PIX, clique abaixo para validar.",
      gatewayInstruct: "Será simulada uma página de pagamento seguro através do Mercado Pago para cartões",
      btnPay: "Pagar Plano Selecionado",
      btnPaying: "Processando pagamento seguro..."
    },
    contact: {
      title: "Tem alguma dúvida antes de comprar?",
      desc: "Estamos aqui para ajudar você a criar o convite ideal. Se você tiver dúvidas sobre recursos, personalizações ou quiser falar conosco antes de realizar o pedido, envie uma mensagem direta.",
      wa: "Escreva-nos pelo WhatsApp",
      email: "Envie-nos um E-mail",
      social: "Siga nas Redes Sociais",
      formName: "Nome Completo",
      formPhone: "Celular de Contato (WhatsApp)",
      formMsg: "Sua Mensagem",
      formPlaceholder: "Digite aqui suas dúvidas ou perguntas sobre nossos modelos...",
      btnSend: "Enviar Mensagem",
      successTitle: "Mensagem Enviada!",
      successDesc: "Muito obrigado por nos escrever. Recebemos sua mensagem com sucesso. Entraremos em contato com você via WhatsApp ou E-mail em breve."
    },
    footer: {
      copy: "Save Your Date. Todos os direitos reservados. Feito com amor para o seu dia especial."
    },
    modal: {
      invited: "Você foi Convidado!",
      musicTitle: "Ambientação",
      countdownTitle: "Contagem Regressiva",
      countdownDesc: "Prepare-se, falta muito pouco para compartilharmos esse grande momento.",
      days: "Dias", hours: "Horas", mins: "Mins", segs: "Segs",
      where: "📍 Onde será?",
      whereDesc: "Clique abaixo para ver as direções no mapa ou abrir com GPS.",
      btnMap: "Ver Localização",
      rsvpTitle: "✉ Confirmar Presença (RSVP)",
      rsvpDesc: "Por favor, ajude-nos com a organização confirmando sua presença antes da data limite.",
      rsvpSuccess: "✓ Presença enviada! Muito obrigado por nos avisar.",
      rsvpName: "Seu Nome Completo",
      rsvpOption: "Você irá comparecer?",
      rsvpYes: "Sim, comparecerei com prazer 🎉",
      rsvpNo: "Infelizmente não poderei ir 😢",
      guestLabel: "Acompanhantes adicionais:",
      guestSolo: "Irei sozinho/a (1)",
      guestMultiple: "Seremos {count} pessoas",
      btnConfirm: "Confirmar RSVP",
      giftTitle: "Presente ou Chave PIX",
      giftDesc: "O melhor presente é a sua presença, mas se desejar colaborar com nossa lua de mel, você pode enviar um PIX ou transferência."
    },
    extras: {
      btn: "✨ Ver Extras & Benefícios Incluídos",
      title: "Benefícios Premium Incluídos",
      desc: "Além das funções interactivas, seu convite Save Your Date inclui um conjunto completo de ferramentas de organização:",
      items: [
        "Design exclusivo, animado e totalmente adaptável a celulares.",
        "Link pronto para compartilhar por WhatsApp ou e-mail.",
        "Localização integrada com Google Maps e Waze.",
        "Confirmação de presença digital RSVP.",
        "Controle de acompanhantes e vagas de convidados.",
        "Registro de restrições alimentares e alergias.",
        "Músicas sugeridas pelos convidados.",
        "Mural de recados digital para saudações.",
        "Painel privado no Google Sheets em tempo real.",
        "Relatório automático para buffet/catering.",
        "Atalhos de WhatsApp para contatar convidados pendentes.",
        "Código QR pronto para impressão.",
        "Opção para adicionar o evento ao calendário.",
        "Galeria ou álbum colaborativo de fotos.",
        "Mensagem de agradecimento pós-evento.",
        "Hospedagem em nuvem ativa até 30 dias após o evento."
        ]
        },
        admin: {
        loginTitle: "Login do Painel de Controle",
        loginDesc: "Faça login com segurança usando seu e-mail ou telefone e seu código de validação Save Your Date exclusivo.",
        inputContact: "E-mail ou Telefone Celular",
        inputContactPlaceholder: "Ex: noivos@email.com ou 11 5555 5555",
        inputCode: "Código de Validação Save Your Date",
        inputCodePlaceholder: "Ex: SYD-123456",
        btnLogin: "Acessar com Segurança 🔑",
        invalidLogin: "✗ Os dados digitados não correspondem a um evento premium ativo.",
        title: "Painel de Controle",
        logout: "Voltar ao Início",
        tabOverview: "Visão Geral",
        tabGuests: "Lista de Convidados",
        tabTables: "Organizar Mesas",
        statsConfirmed: "Total Confirmados",
        statsDeclined: "Declinados",
        statsPending: "Pendentes",
        statsAdults: "Adultos",
        statsKids: "Crianças",
        statsDiets: "Cardápios Especiais",
        guestTableHead: {
        name: "Nome",
        status: "Comparece",
        companions: "Acompanhantes",
        diet: "Restrições",
        actions: "Ações"
        },
        btnSendReminder: "Lembrete de WhatsApp",
        reminderTemplate: "Olá! Esperamos que possa nos acompanhar. Lembramos que você pode confirmar sua presença diretamente em nosso convite digital Save Your Date. Um grande abraço!",
        tableTitle: "Gestão de Mesas",
        tableDesc: "Atribua convidados confirmados a mesas virtuais para organizar visualmente o layout das mesas do salão.",
        unassignedGuests: "Convidados sem mesa atribuída",
        tableLabel: "Mesa",
        btnAssign: "Atribuir",
        noGuests: "Nenhum convidado encontrado nesta seção.",
        noUnassigned: "Todos os convidados confirmados já possuem mesa atribuída! 🎉",
        addGuest: "Adicionar Convidado",
        deleteGuest: "Excluir",
        guestAdded: "✓ Convidado adicionado com sucesso.",
        placeholderAdd: "Nome do convidado",
        addTable: "Adicionar Mesa",
        deleteTable: "Excluir Mesa",
        placeholderAddTable: "Nome da mesa (Ex: Mesa 4)"
        }
        }
        };

function App() {
  // Navigation & Language UI States
  const [lang, setLang] = useState<'es' | 'en' | 'pt'>('es');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'wedding' | '15years' | 'other'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const scrollCarouselLeft = () => {
    if (carouselRef.current) {
      const clientWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollBy({
        left: -clientWidth * 0.8,
        behavior: 'smooth'
      });
    }
  };

  const scrollCarouselRight = () => {
    if (carouselRef.current) {
      const clientWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollBy({
        left: clientWidth * 0.8,
        behavior: 'smooth'
      });
    }
  };
  
  // Interactive Simulator Modal States
  const [demoModel, setDemoModel] = useState<InvitationModel | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [selectedRsvpOption, setSelectedRsvpOption] = useState('');
  const [guestCount, setGuestCount] = useState('1');
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Live Simulated Countdown Timer for the modal
  const [timeLeft, setTimeLeft] = useState({ days: 45, hours: 12, minutes: 30, seconds: 45 });

  // FAQ STATE
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // SIMPLE CONTACT FORM STATE
  const [simpleContactSubmitted, setSimpleContactSubmitted] = useState(false);
  const [simpleContactData, setSimpleContactData] = useState({
    name: '',
    whatsapp: '',
    message: ''
  });

  // PORTAL DE CREACIÓN / ORDER WIZARD STATES
  const [validationCode, setValidationCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState<boolean | null>(null);
  const [wizardCategory, setWizardCategory] = useState<'wedding' | '15years' | 'other'>('wedding');
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardModel, setWizardModel] = useState('boda-marfil');
  const [wizardSubmitted, setWizardSubmitted] = useState(false);

  // Dynamic Form Field Values (State)
  const [weddingData, setWeddingData] = useState({
    partner1Name: '', novio1WhatsApp: '',
    partner2Name: '', novio2WhatsApp: '',
    civilDate: '', civilTime: '', civilPlace: '',
    ceremonyDate: '', ceremonyTime: '', ceremonyPlace: '', ceremonyGps: '',
    giftAlias: '', giftCbu: '', backgroundMusic: '', dressCode: 'Elegante', countdownDate: ''
  });

  const [quinceData, setQuinceData] = useState({
    quinceName: '', parentNames: '',
    partyDate: '', partyTime: '', partyPlace: '', partyGps: '',
    musicPreference: '', quinceDressCode: 'Formal Elegante', giftAlias: '', giftCbu: '',
    instagramHashtag: '', countdownDate: ''
  });

  const [otherEventData, setOtherEventData] = useState({
    eventType: 'Baby Shower', eventTitle: '', organizerName: '',
    eventDate: '', eventTime: '', eventPlace: '', eventGps: '',
    specialInstructions: '', giftAlias: '', giftCbu: '', backgroundMusic: '', countdownDate: ''
  });

  // Currency & Latam Regional Switching State
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'ARS' | 'MXN' | 'CLP' | 'COP' | 'PEN' | 'UYU' | 'BRL'>('USD');

  // MOCK PAYMENT & CHECKOUT STATES
  const [paymentPlan, setPaymentPlan] = useState<'bronze' | 'silver' | 'gold'>('silver');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerWhatsapp, setBuyerWhatsApp] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [newGeneratedCode, setNewGeneratedCode] = useState('');

  // Regional Currency and Payment Data (Rounded locally)
  const CURRENCY_DATA = {
    USD: { symbol: '$', suffix: 'USD', bronze: 50, silver: 70, gold: 100, label: 'Dólar (Internacional)', bank: 'PayPal / Stripe (USD)', bankDetails: 'Email de pago: saveyourdate.invite@gmail.com' },
    ARS: { symbol: '$', suffix: 'ARS', bronze: 50000, silver: 70000, gold: 100000, label: 'Peso Argentino', bank: 'Mercado Pago / Transferencia', bankDetails: 'ALIAS: saveyourdate.mp | CBU: 0000003100099999987654' },
    MXN: { symbol: '$', suffix: 'MXN', bronze: 900, silver: 1250, gold: 1800, label: 'Peso Mexicano', bank: 'Mercado Pago México / SPEI', bankDetails: 'CLABE SPEI: 012180009999999888 | BANCO: BBVA México' },
    CLP: { symbol: '$', suffix: 'CLP', bronze: 48000, silver: 68000, gold: 95000, label: 'Peso Chileno', bank: 'Mercado Pago Chile / Transferencia', bankDetails: 'Banco de Chile - Cuenta Corriente: 123-45678-90 | RUT: 77.777.777-7' },
    COP: { symbol: '$', suffix: 'COP', bronze: 200000, silver: 280000, gold: 400000, label: 'Peso Colombiano', bank: 'Mercado Pago / PSE / Nequi', bankDetails: 'Nequi / Daviplata: 310 000 0000 | Convenio PSE: Save Your Date' },
    PEN: { symbol: 'S/. ', suffix: 'PEN', bronze: 190, silver: 260, gold: 370, label: 'Sol Peruano', bank: 'Mercado Pago Perú / Yape / Plin', bankDetails: 'Yape / Plin: 999 999 999 | BCP Cuenta Corriente: 191-9999999-0-99' },
    UYU: { symbol: '$', suffix: 'UYU', bronze: 2000, silver: 2800, gold: 4000, label: 'Peso Uruguayo', bank: 'Mercado Pago Uruguay / Transferencia', bankDetails: 'BROU (Banco República) - Caja de Ahorros: 0015-1234567' },
    BRL: { symbol: 'R$ ', suffix: 'BRL', bronze: 275, silver: 385, gold: 550, label: 'Real Brasileño', bank: 'Mercado Pago Brasil / PIX', bankDetails: 'Chave PIX (E-mail): pix@saveyourdate.com.br' }
  };

  // Valid pre-approved mock codes for testing!
  const VALID_MOCK_CODES = ['WEDDING2026', 'QUINCE2026', 'VIPCUSTOMER', 'MP-PAY-OK'];

  // ADMIN CONTROL STATES & MOCK GUEST LIST DATA
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'guests' | 'tables'>('overview');
  const [loginContact, setLoginContact] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // Dashboard mock guest data
  const [guests, setGuests] = useState([
    { id: 1, name: "Carlos Gómez", rsvp: "yes", companions: 2, diet: "Ninguna / None", table: "Mesa 1" },
    { id: 2, name: "María Rodriguez", rsvp: "yes", companions: 1, diet: "Vegano / Vegan", table: "Mesa 1" },
    { id: 3, name: "Jorge Blanco", rsvp: "yes", companions: 1, diet: "Celíaco / Gluten-free", table: "Mesa 2" },
    { id: 4, name: "Ana Martínez", rsvp: "yes", companions: 3, diet: "Ninguna / None", table: "Mesa 2" },
    { id: 5, name: "Pedro Soto", rsvp: "no", companions: 0, diet: "Ninguna / None", table: "" },
    { id: 6, name: "Laura Díaz", rsvp: "pending", companions: 1, diet: "Vegano / Vegan", table: "" },
    { id: 7, name: "Sofía Peralta", rsvp: "yes", companions: 1, diet: "Ninguna / None", table: "" },
    { id: 8, name: "Luis Benítez", rsvp: "pending", companions: 2, diet: "Ninguna / None", table: "" },
    { id: 9, name: "Elena Vázquez", rsvp: "yes", companions: 2, diet: "Vegano / Vegan", table: "" },
    { id: 10, name: "Esteban Ruiz", rsvp: "pending", companions: 1, diet: "Hipertenso / Low sodium", table: "" }
  ]);

  const [tables, setTables] = useState(["Mesa 1", "Mesa 2", "Mesa 3", "Mesa Familiar", "Mesa Amigos"]);
  const [adminNewTableName, setAdminNewTableName] = useState('');
  
  // Add Guest state
  const [adminNewGuestName, setAdminNewGuestName] = useState('');
  const [adminNewGuestDiet, setAdminNewGuestDiet] = useState('Ninguna / None');
  const [adminNewGuestCompanions, setAdminNewGuestCompanions] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Filtered Models for catalog
  const filteredModels = selectedCategory === 'all' 
    ? INVITATION_MODELS 
    : INVITATION_MODELS.filter(m => m.category === selectedCategory);

  // Handler for Sidebar Toggling
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Handler for custom smooth scrolling to anchor
  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setSidebarOpen(false);
  };

  // Prefill contact form model and scroll down
  const handleSelectModelForOrder = (modelId: string) => {
    const model = INVITATION_MODELS.find(m => m.id === modelId);
    if (model) {
      setWizardModel(modelId);
      if (model.category === 'wedding') setWizardCategory('wedding');
      else if (model.category === '15years') setWizardCategory('15years');
      else setWizardCategory('other');
    }
    
    const contactSection = document.getElementById('crear');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open Demo Modal & Reset Demo Specific States
  const handleOpenDemo = (model: InvitationModel) => {
    setDemoModel(model);
    setIsPlayingMusic(false);
    setRsvpName('');
    setSelectedRsvpOption('');
    setGuestCount('1');
    setRsvpSuccess(false);
  };

  // Toggle FAQ Accordion Index
  const toggleFaq = (index: number) => {
    if (activeFaqIndex === index) {
      setActiveFaqIndex(null);
    } else {
      setActiveFaqIndex(index);
    }
  };

  // Check entered Validation Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = validationCode.trim().toUpperCase();
    if (VALID_MOCK_CODES.includes(trimmedCode) || trimmedCode.startsWith('SYD-')) {
      setIsCodeValid(true);
      setWizardStep(2); // advance to category selection
    } else {
      setIsCodeValid(false);
    }
  };

  // Process Mock Checkout & Generate Validation Code
  const handleSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerEmail || !buyerWhatsapp) return;

    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      const generated = 'SYD-' + Math.floor(100000 + Math.random() * 900000);
      setNewGeneratedCode(generated);
      setValidationCode(generated);
    }, 2000);
  };

  // Use the newly generated code directly in the form
  const handleUseGeneratedCode = () => {
    setIsCodeValid(true);
    setWizardStep(2);
    setPaymentSuccess(false);
    setBuyerName('');
    setBuyerEmail('');
    setBuyerWhatsApp('');

    // Smooth scroll back to the Creation Portal section to complete details!
    const crearSection = document.getElementById('crear');
    if (crearSection) {
      crearSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Wizard Submit (Simulation)
  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWizardSubmitted(true);
    setTimeout(() => {
      setWizardSubmitted(false);
      setWizardStep(1);
      setIsCodeValid(null);
      setValidationCode('');
    }, 10000);
  };

  // Handle Simple Contact Form Submit (Real Email Delivery via FormSubmit)
  const handleSimpleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpleContactData.name || !simpleContactData.message) return;
    
    // Set submitted state immediately to show success message on client
    setSimpleContactSubmitted(true);

    // Send the data securely in the background to saveyourdate.invite@gmail.com
    fetch("https://formsubmit.co/ajax/saveyourdate.invite@gmail.com", {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Nombre: simpleContactData.name,
        WhatsApp: simpleContactData.whatsapp,
        Mensaje: simpleContactData.message,
        _subject: `Nueva consulta de ${simpleContactData.name} - Save Your Date`
      })
    })
    .then(response => {
      if (!response.ok) {
        console.error("Error sending contact form:", response.statusText);
      }
    })
    .catch(error => {
      console.error("Error sending contact form:", error);
    });

    // Auto reset form and state after 8 seconds
    setTimeout(() => {
      setSimpleContactSubmitted(false);
      setSimpleContactData({ name: '', whatsapp: '', message: '' });
    }, 8000);
  };

  // Handle RSVP Submit (Simulation inside the modal)
  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName || !selectedRsvpOption) return;
    setRsvpSuccess(true);
  };

  // ADMIN ACTION HANDLERS
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = loginCode.trim().toUpperCase();
    if (VALID_MOCK_CODES.includes(code) || code.startsWith('SYD-')) {
      setIsAdminLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleAddGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewGuestName.trim()) return;
    const newGuest = {
      id: Date.now(),
      name: adminNewGuestName.trim(),
      rsvp: 'yes',
      companions: adminNewGuestCompanions,
      diet: adminNewGuestDiet,
      table: ""
    };
    setGuests([...guests, newGuest]);
    setAdminNewGuestName("");
    setAdminNewGuestCompanions(0);
    setAdminNewGuestDiet("Ninguna / None");
  };

  const handleDeleteGuest = (id: number) => {
    setGuests(guests.filter(g => g.id !== id));
  };

  const handleAssignGuestTable = (id: number, tableName: string) => {
    setGuests(guests.map(g => g.id === id ? { ...g, table: tableName } : g));
  };

  const handleRemoveGuestTable = (id: number) => {
    setGuests(guests.map(g => g.id === id ? { ...g, table: "" } : g));
  };

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminNewTableName.trim();
    if (!trimmed) return;
    if (tables.includes(trimmed)) return;
    setTables([...tables, trimmed]);
    setAdminNewTableName('');
  };

  const handleDeleteTable = (tableName: string) => {
    setTables(tables.filter(t => t !== tableName));
    setGuests(guests.map(g => g.table === tableName ? { ...g, table: "" } : g));
  };

  // Shortcut for translations based on active language
  const t = TRANSLATIONS[lang];

  // ==========================================
  // VIEW TAKEOVERS (LOGIN & DASHBOARD)
  // ==========================================

  // 1. ADMIN LOGIN VIEW
  if (showAdminLogin && !isAdminLoggedIn) {
    return (
      <div className="admin-login-takeover">
        <header className="admin-header">
          <div className="container admin-header-container">
            <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setShowAdminLogin(false)}>
              <img src="/logo.svg" alt="Save Your Date" className="logo-img" />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Language Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fafafa', border: '1px solid var(--color-border)', borderRadius: '15px', padding: '2px 8px' }}>
                🌐
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value as any)}
                  style={{ border: 'none', background: 'transparent', fontStyle: 'normal', fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="es">ES</option>
                  <option value="en">EN</option>
                  <option value="pt">PT</option>
                </select>
              </div>

              <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '20px' }} onClick={() => setShowAdminLogin(false)}>
                ← {lang === 'es' ? 'Volver' : (lang === 'en' ? 'Back' : 'Voltar')}
              </button>
            </div>
          </div>
        </header>

        <main className="admin-login-main container">
          <div className="contact-form-box" style={{ maxWidth: '500px', margin: '40px auto' }}>
            <form onSubmit={handleAdminLoginSubmit} className="contact-form" style={{ textAlign: 'left' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '48px' }}>🔐</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--color-accent)', marginTop: '8px' }}>
                  {t.admin.loginTitle}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.4 }}>
                  {t.admin.loginDesc}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="adminContact">{t.admin.inputContact}</label>
                <input 
                  className="form-input" 
                  type="text" 
                  id="adminContact" 
                  required 
                  placeholder={t.admin.inputContactPlaceholder} 
                  value={loginContact}
                  onChange={(e) => setLoginContact(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="adminCode">{t.admin.inputCode}</label>
                <input 
                  className="form-input" 
                  type="text" 
                  id="adminCode" 
                  required 
                  placeholder={t.admin.inputCodePlaceholder} 
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  style={{ textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}
                />
              </div>

              {loginError && (
                <div style={{ color: '#e0004d', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>
                  {t.admin.invalidLogin}
                </div>
              )}

              <button className="btn-form-submit" type="submit">
                {t.admin.btnLogin}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // 2. ADMIN DASHBOARD VIEW
  if (isAdminLoggedIn) {
    // Dynamic Computations
    const confirmedCount = guests.filter(g => g.rsvp === 'yes').length;
    const pendingCount = guests.filter(g => g.rsvp === 'pending').length;
    const declinedCount = guests.filter(g => g.rsvp === 'no').length;
    const companionCount = guests.filter(g => g.rsvp === 'yes').reduce((acc, curr) => acc + curr.companions, 0);
    const totalPeopleCount = confirmedCount + companionCount;
    const specialDietsCount = guests.filter(g => g.rsvp === 'yes' && g.diet !== 'Ninguna / None' && g.diet !== 'Ninguna').length;

    return (
      <div className="admin-dashboard-takeover">
        {/* Navigation Header */}
        <header className="admin-header">
          <div className="container admin-header-container">
            <div className="admin-header-logo-group">
              <img src="/logo.svg" alt="Save Your Date" className="logo-img" />
              <span className="admin-header-badge">GOLD</span>
              <h2 className="admin-event-title">Sofía & Mateo</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Language Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fafafa', border: '1px solid var(--color-border)', borderRadius: '15px', padding: '2px 8px' }}>
                🌐
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value as any)}
                  style={{ border: 'none', background: 'transparent', fontStyle: 'normal', fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="es">ES</option>
                  <option value="en">EN</option>
                  <option value="pt">PT</option>
                </select>
              </div>

              <button className="btn-secondary" style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px' }} onClick={() => { setIsAdminLoggedIn(false); setLoginCode(''); setLoginContact(''); }}>
                🚪 {t.admin.logout}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Tabs & Content Area */}
        <div className="admin-dashboard-body container">
          {/* Sub Navigation Tabs */}
          <div className="filter-tabs" style={{ justifyContent: 'flex-start', margin: '24px 0' }}>
            <button className={`filter-btn ${adminActiveTab === 'overview' ? 'active' : ''}`} onClick={() => setAdminActiveTab('overview')}>
              📊 {t.admin.tabOverview}
            </button>
            <button className={`filter-btn ${adminActiveTab === 'guests' ? 'active' : ''}`} onClick={() => setAdminActiveTab('guests')}>
              👥 {t.admin.tabGuests} ({guests.length})
            </button>
            <button className={`filter-btn ${adminActiveTab === 'tables' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tables')}>
              🍽️ {t.admin.tabTables}
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {adminActiveTab === 'overview' && (
            <div className="admin-overview-grid animate-fade-in">
              <div className="admin-card stats-card">
                <span className="stats-icon">👥</span>
                <div className="stats-info">
                  <h4>{t.admin.statsConfirmed}</h4>
                  <strong>{totalPeopleCount}</strong>
                  <p>{confirmedCount} {lang === 'es' ? 'invitados directos' : (lang === 'en' ? 'direct guests' : 'convidados diretos')} + {companionCount} {lang === 'es' ? 'acompañantes' : (lang === 'en' ? 'companions' : 'acompanhantes')}</p>
                </div>
              </div>

              <div className="admin-card stats-card" style={{ borderLeftColor: '#f39c12' }}>
                <span className="stats-icon">⏳</span>
                <div className="stats-info">
                  <h4>{t.admin.statsPending}</h4>
                  <strong style={{ color: '#f39c12' }}>{pendingCount}</strong>
                  <p>{lang === 'es' ? 'Respuestas pendientes de envío' : (lang === 'en' ? 'Pending guest responses' : 'Respostas pendentes')}</p>
                </div>
              </div>

              <div className="admin-card stats-card" style={{ borderLeftColor: '#e74c3c' }}>
                <span className="stats-icon">❌</span>
                <div className="stats-info">
                  <h4>{t.admin.statsDeclined}</h4>
                  <strong style={{ color: '#e74c3c' }}>{declinedCount}</strong>
                  <p>{lang === 'es' ? 'Invitados que no asisten' : (lang === 'en' ? 'Guests who declined' : 'Convidados que não vão')}</p>
                </div>
              </div>

              <div className="admin-card stats-card" style={{ borderLeftColor: 'var(--color-mint)' }}>
                <span className="stats-icon">🥦</span>
                <div className="stats-info">
                  <h4>{t.admin.statsDiets}</h4>
                  <strong style={{ color: 'var(--color-mint)' }}>{specialDietsCount}</strong>
                  <p>{lang === 'es' ? 'Requerimientos de catering' : (lang === 'en' ? 'Catering menu requirements' : 'Requisitos de cardápio')}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GUEST LIST */}
          {adminActiveTab === 'guests' && (
            <div className="admin-guests-tab animate-fade-in" style={{ textAlign: 'left' }}>
              {/* Add Guest mini form */}
              <div className="admin-card" style={{ marginBottom: '24px', padding: '20px' }}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--color-accent)', marginBottom: '16px' }}>➕ {t.admin.addGuest}</h4>
                <form onSubmit={handleAddGuestSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: '2 1 200px', marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>{t.admin.guestTableHead.name}</label>
                    <input className="form-input" type="text" placeholder={t.admin.placeholderAdd} value={adminNewGuestName} onChange={(e) => setAdminNewGuestName(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ flex: '1 1 100px', marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>{t.admin.guestTableHead.companions}</label>
                    <input className="form-input" type="number" min="0" value={adminNewGuestCompanions} onChange={(e) => setAdminNewGuestCompanions(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>{t.admin.guestTableHead.diet}</label>
                    <select className="form-select" value={adminNewGuestDiet} onChange={(e) => setAdminNewGuestDiet(e.target.value)}>
                      <option value="Ninguna / None">Ninguna / None</option>
                      <option value="Vegano / Vegan">Vegano / Vegan</option>
                      <option value="Celíaco / Gluten-free">Celíaco / Gluten-free</option>
                      <option value="Hipertenso / Low sodium">Hipertenso / Low sodium</option>
                    </select>
                  </div>
                  <button className="btn-primary" type="submit" style={{ padding: '12px 24px', height: '42px' }}>{t.admin.addGuest}</button>
                </form>
              </div>

              {/* Guest list table */}
              <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t.admin.guestTableHead.name}</th>
                      <th>{t.admin.guestTableHead.status}</th>
                      <th>{t.admin.guestTableHead.companions}</th>
                      <th>{t.admin.guestTableHead.diet}</th>
                      <th>{t.admin.tableLabel}</th>
                      <th>{t.admin.guestTableHead.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-light)' }}>
                          {t.admin.noGuests}
                        </td>
                      </tr>
                    ) : (
                      guests.map((g) => (
                        <tr key={g.id}>
                          <td style={{ fontWeight: 'bold' }}>{g.name}</td>
                          <td>
                            <span className={`admin-status-badge ${g.rsvp}`}>
                              {g.rsvp === 'yes' ? (lang === 'es' ? 'Confirmado' : (lang === 'en' ? 'Confirmed' : 'Confirmado')) : 
                               g.rsvp === 'no' ? (lang === 'es' ? 'No asiste' : (lang === 'en' ? 'Declined' : 'Não asiste')) : 
                               (lang === 'es' ? 'Pendiente' : (lang === 'en' ? 'Pending' : 'Pendente'))}
                            </span>
                          </td>
                          <td>{g.companions}</td>
                          <td>{g.diet}</td>
                          <td>
                            {g.table ? (
                              <span className="admin-table-badge">{g.table}</span>
                            ) : (
                              <span style={{ color: 'var(--color-text-light)', fontStyle: 'italic', fontSize: '12px' }}>-</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {g.rsvp === 'pending' && (
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '4px 12px', fontSize: '11px', color: '#25D366', borderColor: '#25D366', borderRadius: '15px' }}
                                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(t.admin.reminderTemplate)}`, '_blank')}
                                >
                                  💬 {t.admin.btnSendReminder}
                                </button>
                              )}
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '4px 12px', fontSize: '11px', color: '#e74c3c', borderColor: '#e74c3c', borderRadius: '15px' }}
                                onClick={() => handleDeleteGuest(g.id)}
                              >
                                🗑️ {t.admin.deleteGuest}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TABLE ASSIGNMENT */}
          {adminActiveTab === 'tables' && (
            <div className="admin-tables-tab animate-fade-in" style={{ textAlign: 'left' }}>
              <div className="admin-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--color-accent)', margin: '0 0 8px 0' }}>
                  {t.admin.tableTitle}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
                  {t.admin.tableDesc}
                </p>
              </div>

              {/* Add Table form */}
              <div className="admin-card" style={{ marginBottom: '24px', padding: '20px' }}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--color-accent)', marginBottom: '16px' }}>➕ {t.admin.addTable || 'Agregar Mesa'}</h4>
                <form onSubmit={handleAddTableSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <input 
                    className="form-input" 
                    type="text" 
                    placeholder={t.admin.placeholderAddTable || 'Nombre de la mesa...'} 
                    value={adminNewTableName} 
                    onChange={(e) => setAdminNewTableName(e.target.value)} 
                    required 
                    style={{ flex: '1', maxWidth: '300px', marginBottom: 0 }}
                  />
                  <button className="btn-primary" type="submit" style={{ padding: '10px 20px', height: '42px' }}>
                    {t.admin.addTable || 'Agregar Mesa'}
                  </button>
                </form>
              </div>

              <div className="admin-tables-layout-grid">
                {/* Unassigned guests side */}
                <div className="admin-card" style={{ padding: '20px' }}>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '16px' }}>
                    👥 {t.admin.unassignedGuests}
                  </h4>
                  
                  {guests.filter(g => g.rsvp === 'yes' && !g.table).length === 0 ? (
                    <p style={{ color: 'var(--color-mint)', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                      {t.admin.noUnassigned}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {guests.filter(g => g.rsvp === 'yes' && !g.table).map((g) => (
                        <div key={g.id} className="admin-unassigned-guest-row">
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{g.name}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select 
                              className="form-select" 
                              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                              onChange={(e) => handleAssignGuestTable(g.id, e.target.value)}
                              defaultValue=""
                            >
                              <option value="" disabled>{t.admin.tableLabel}...</option>
                              {tables.map((tbl) => (
                                <option key={tbl} value={tbl}>{tbl}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assigned Tables side */}
                <div className="admin-tables-visual-grid">
                  {tables.map((tableName) => {
                    const guestsInTable = guests.filter(g => g.table === tableName);
                    return (
                      <div key={tableName} className="admin-card table-visual-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--color-accent)', margin: 0 }}>
                              🍽️ {tableName}
                            </h4>
                            <button 
                              onClick={() => handleDeleteTable(tableName)}
                              style={{ border: 'none', background: 'transparent', color: '#e74c3c', cursor: 'pointer', padding: 0, fontSize: '14px', display: 'flex', alignItems: 'center' }}
                              title={t.admin.deleteTable || 'Eliminar Mesa'}
                            >
                              🗑️
                            </button>
                          </div>
                          <span className="admin-table-badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                            {guestsInTable.length}
                          </span>
                        </div>

                        {guestsInTable.length === 0 ? (
                          <p style={{ color: 'var(--color-text-light)', fontStyle: 'italic', fontSize: '12px', textAlign: 'center', padding: '16px 0', margin: 0 }}>
                            {lang === 'es' ? 'Mesa vacía' : (lang === 'en' ? 'Empty table' : 'Mesa vazia')}
                          </p>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {guestsInTable.map((g) => (
                              <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', background: '#fdfdfd', border: '1px solid #f0f0f0', padding: '6px 10px', borderRadius: '8px' }}>
                                <span>{g.name}</span>
                                <button 
                                  onClick={() => handleRemoveGuestTable(g.id)}
                                  style={{ border: 'none', background: 'transparent', color: '#e74c3c', fontSize: '14px', cursor: 'pointer', padding: 0 }}
                                  title={t.admin.deleteGuest}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* HEADER & STICKY NAVBAR */}
      <header className="header">
        <div className="container header-container">
          <a href="#inicio" className="logo" onClick={(e) => handleScrollToSection(e, 'inicio')}>
            <img src="/logo.svg" alt="Save Your Date" className="logo-img" />
          </a>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <a href="#inicio" className="nav-link" onClick={(e) => handleScrollToSection(e, 'inicio')}>{t.nav.home}</a>
            <a href="#modelos" className="nav-link" onClick={(e) => handleScrollToSection(e, 'modelos')}>{t.nav.models}</a>
            <a href="#incluyen" className="nav-link" onClick={(e) => handleScrollToSection(e, 'incluyen')}>{t.nav.features}</a>
            <a href="#contacto" className="nav-link" onClick={(e) => handleScrollToSection(e, 'contacto')}>{t.nav.contact}</a>
            
            {/* Language Selector in Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fafafa', border: '1px solid var(--color-border)', borderRadius: '15px', padding: '2px 8px', marginLeft: '8px' }}>
              🌐
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as any)}
                style={{ border: 'none', background: 'transparent', fontStyle: 'normal', fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="es">ES</option>
                <option value="en">EN</option>
                <option value="pt">PT</option>
              </select>
            </div>

            <a href="#crear" className="cta-nav-button" onClick={(e) => handleScrollToSection(e, 'crear')}>{t.nav.cta}</a>
          </nav>

          {/* Mobile Hamburguesa Button */}
          <button className={`burger-button ${sidebarOpen ? 'open' : ''}`} onClick={toggleSidebar} aria-label="Menú">
            <span className="burger-bar"></span>
            <span className="burger-bar"></span>
            <span className="burger-bar"></span>
          </button>
        </div>
      </header>

      {/* Sidebar navigation overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <a href="#inicio" className="sidebar-link" onClick={(e) => handleScrollToSection(e, 'inicio')}>{t.nav.home}</a>
        <a href="#modelos" className="sidebar-link" onClick={(e) => handleScrollToSection(e, 'modelos')}>{t.nav.models}</a>
        <a href="#incluyen" className="sidebar-link" onClick={(e) => handleScrollToSection(e, 'incluyen')}>{t.nav.features}</a>
        <a href="#contacto" className="sidebar-link" onClick={(e) => handleScrollToSection(e, 'contacto')}>{t.nav.contact}</a>
        
        {/* Language Selector in Sidebar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '18px' }}>🌐 Idioma / Language:</span>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as any)}
            style={{ border: '1px solid var(--color-border)', background: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}
          >
            <option value="es">Español (ES)</option>
            <option value="en">English (EN)</option>
            <option value="pt">Português (PT)</option>
          </select>
        </div>

        <a href="#crear" className="btn-primary animate-heartbeat" style={{ marginTop: '20px' }} onClick={(e) => handleScrollToSection(e, 'crear')}>{t.nav.cta}</a>
      </aside>

      {/* SECTION 1: HERO / INICIO */}
      <section id="inicio" className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content animate-fade-in">
            <span className="hero-tag">{t.hero.tag}</span>
            <h1 className="hero-title">
              {t.hero.title1} <span>{t.hero.titleHighlight}</span>.
            </h1>
            <p className="hero-description">{t.hero.desc}</p>
            <div className="hero-ctas">
              <a href="#crear" className="btn-primary animate-heartbeat" onClick={(e) => handleScrollToSection(e, 'crear')}>
                {t.hero.ctaPrimary}
              </a>
              <a href="#modelos" className="btn-secondary" onClick={(e) => handleScrollToSection(e, 'modelos')}>
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>

          {/* Floating Phone Visual inside Hero */}
          <div className="hero-visual">
            <div className="ornament ornament-1">
              <svg viewBox="0 0 100 100" width="120">
                <path d="M50 15 C35 5, 5 15, 15 45 C25 75, 50 95, 50 95 C50 95, 75 75, 85 45 C95 15, 65 5, 50 15 Z" fill="#F4A6B6" opacity="0.15" />
              </svg>
            </div>
            <div className="ornament ornament-2">
              <svg viewBox="0 0 100 100" width="150">
                <circle cx="50" cy="50" r="40" stroke="#73C6B6" strokeWidth="1" strokeDasharray="5,5" fill="none" opacity="0.3" />
                <path d="M30 50 Q50 30 70 50 T110 50" stroke="#73C6B6" strokeWidth="1.5" fill="none" opacity="0.4" />
              </svg>
            </div>

            {/* Smart mock smartphone */}
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="phone-header">
                  <h3 className="phone-header-title">Sofía & Mateo</h3>
                  <p className="phone-header-sub">¡Nos Casamos!</p>
                </div>
                <div className="phone-body">
                  <span style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 'bold' }}>{t.hero.miniCountdown}</span>
                  <div className="mini-countdown">
                    <div className="mini-cd-box">
                      <span className="mini-cd-num">32</span>
                      <span className="mini-cd-lbl">{t.hero.days}</span>
                    </div>
                    <div className="mini-cd-box">
                      <span className="mini-cd-num">15</span>
                      <span className="mini-cd-lbl">{t.hero.hours}</span>
                    </div>
                    <div className="mini-cd-box">
                      <span className="mini-cd-num">44</span>
                      <span className="mini-cd-lbl">{t.hero.mins}</span>
                    </div>
                  </div>
                  <div className="phone-section-divider"></div>
                  <div className="phone-details-box">
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px' }}>Sábado 24 de Octubre</p>
                    <p style={{ margin: '0', fontSize: '10px', color: '#666' }}>18:30 hs • Estancia La Linda</p>
                  </div>
                  <button 
                    className="phone-action-btn"
                    onClick={() => handleOpenDemo(INVITATION_MODELS[0])}
                  >
                    {t.hero.miniBtn}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: GALERÍA DE MODELOS */}
      <section id="modelos" className="models-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">{t.catalog.subtitle}</span>
            <h2 className="section-title">{t.catalog.title}</h2>
            <p className="section-desc">{t.catalog.desc}</p>
          </div>

          {/* Filter Navigation */}
          <div className="filter-tabs">
            <button className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>{t.catalog.filterAll}</button>
            <button className={`filter-btn ${selectedCategory === 'wedding' ? 'active' : ''}`} onClick={() => setSelectedCategory('wedding')}>{t.catalog.filterWedding}</button>
            <button className={`filter-btn ${selectedCategory === '15years' ? 'active' : ''}`} onClick={() => setSelectedCategory('15years')}>{t.catalog.filter15}</button>
            <button className={`filter-btn ${selectedCategory === 'other' ? 'active' : ''}`} onClick={() => setSelectedCategory('other')}>{t.catalog.filterOther}</button>
          </div>

          {/* Grid of models (now horizontal swimlane carousel) */}
          <div className="models-carousel-wrapper">
            <div ref={carouselRef} className="models-swimlane-container">
              {filteredModels.map((model) => (
                <article className="model-card" key={model.id}>
                  <div className="card-visual">
                    {model.badge && (
                      <span className="card-badge">
                        {model.badge === 'Más Elegido' ? t.catalog.popularBadge : (model.badge === 'Nuevo' ? t.catalog.newBadge : t.catalog.trendBadge)}
                      </span>
                    )}
                    
                    {/* Styled procedural preview of the card style */}
                    <div className={`mock-card-content ${model.themeClass}`}>
                      {model.illustrationType === 'rings' && (
                        <div className="mock-illustration-rings"></div>
                      )}
                      {model.illustrationType === 'crown' && (
                        <div className="mock-illustration-crown">👑</div>
                      )}
                      {model.illustrationType === 'balloon' && (
                        <div className="mock-illustration-balloon">🎈</div>
                      )}
                      <div className="mock-card-text-primary">{model.demoName1}</div>
                      {model.demoName2 && <div className="mock-card-text-primary" style={{ marginTop: '0px' }}>{model.demoName2}</div>}
                      <div className="mock-card-text-sec">{model.date}</div>
                    </div>
                  </div>

                  <div className="card-info">
                    <h3 className="card-title">{model.title}</h3>
                    <p className="card-desc">{model.description}</p>
                    
                    <div className="card-features">
                      {model.features.slice(0, 3).map((feat, index) => (
                        <span className="card-feature-tag" key={index}>{feat}</span>
                      ))}
                      {model.features.length > 3 && <span className="card-feature-tag">+{model.features.length - 3}</span>}
                    </div>

                    <div className="card-footer">
                      <button className="btn-card-demo" onClick={() => handleOpenDemo(model)}>
                        {t.catalog.verDemo}
                      </button>
                      <button className="btn-card-order" onClick={() => handleSelectModelForOrder(model.id)}>
                        {t.catalog.personalize}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Carousel navigation controls */}
            <div className="carousel-controls">
              <button className="carousel-control-btn prev" onClick={scrollCarouselLeft} aria-label="Anterior">
                ←
              </button>
              <button className="carousel-control-btn more" onClick={scrollCarouselRight}>
                {lang === 'es' ? 'Ver más' : (lang === 'en' ? 'See more' : 'Ver mais')} <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ¿QUÉ INCLUYEN? FEATURES */}
      <section id="incluyen" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">{t.features.subtitle}</span>
            <h2 className="section-title">{t.features.title}</h2>
            <p className="section-desc">{t.features.desc}</p>
          </div>

          <div className="features-grid">
            {t.features.cards.map((card, idx) => (
              <div className="feature-card" key={idx}>
                <div className="feature-icon-wrapper">
                  {idx === 0 && "⏱"}
                  {idx === 1 && "✉"}
                  {idx === 2 && "🎵"}
                  {idx === 3 && "📍"}
                  {idx === 4 && "🎁"}
                  {idx === 5 && "👗"}
                  {idx === 6 && "📸"}
                  {idx === 7 && "📱"}
                </div>
                <h3 className="feature-title">{card.t}</h3>
                <p className="feature-desc">{card.d}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
            <button 
              className="btn-secondary animate-heartbeat" 
              onClick={() => setShowExtrasModal(true)} 
              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)', gap: '8px', padding: '14px 28px' }}
            >
              {t.extras?.btn || "✨ Ver Extras & Beneficios Incluidos"}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4: HACE TU PEDIDO (PROCESO) */}
      <section id="pedido" className="process-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">{t.process.subtitle}</span>
            <h2 className="section-title">{t.process.title}</h2>
            <p className="section-desc">{t.process.desc}</p>
          </div>

          <div className="process-steps">
            {t.process.steps.map((step, idx) => (
              <div className="process-step" key={idx}>
                <div className="step-num">{idx + 1}</div>
                <h3 className="step-title">{step.t}</h3>
                <p className="step-desc">{step.d}</p>
              </div>
            ))}
          </div>

          <div className="process-cta-box">
            <a href="#crear" className="btn-primary animate-heartbeat" onClick={(e) => handleScrollToSection(e, 'crear')}>
              {t.process.cta}
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ ACCORDION */}
      <section id="preguntas" className="faq-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">{t.faq.subtitle}</span>
            <h2 className="section-title">{t.faq.title}</h2>
            <p className="section-desc">{t.faq.desc}</p>
          </div>

          <div className="faq-container">
            {t.faq.items.map((item, index) => (
              <div className="faq-item" key={index}>
                <button className="faq-question-btn" onClick={() => toggleFaq(index)}>
                  <span>{item.q}</span>
                  <span className={`faq-toggle-icon ${activeFaqIndex === index ? 'open' : ''}`}>+</span>
                </button>
                <div className={`faq-answer ${activeFaqIndex === index ? 'open' : ''}`}>
                  <p style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: item.a }}></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: PORTAL DE CREACIÓN / CARGA DE DATOS */}
      <section id="crear" className="features-section" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">{t.portal.subtitle}</span>
            <h2 className="section-title">{t.portal.title}</h2>
            <p className="section-desc">
              {lang === 'es' 
                ? "Ingresá tu código de validación para comenzar a diseñar tu invitación. Si todavía no tenés un código, podés generarlo en la sección de pago inmediatamente debajo." 
                : (lang === 'en' 
                  ? "Enter your validation code to start designing your invitation. If you don't have a code yet, you can generate one in the payment section immediately below." 
                  : "Insira seu código de validação para começar a desenhar seu convite. Se você ainda não tem um código, pode gerá-lo na seção de pagamento logo abaixo.")}
            </p>
          </div>

          <div className="contact-form-box">
            {/* Wizard Step Indicators */}
            <div className="wizard-steps-header">
              <span className={`wizard-step-indicator ${wizardStep >= 1 ? 'active' : ''}`}>{t.portal.steps.s1}</span>
              <span className={`wizard-step-indicator ${wizardStep >= 2 ? 'active' : ''}`}>{t.portal.steps.s2}</span>
              <span className={`wizard-step-indicator ${wizardStep >= 3 ? 'active' : ''}`}>{t.portal.steps.s3}</span>
              <span className={`wizard-step-indicator ${wizardStep >= 4 ? 'active' : ''}`}>{t.portal.steps.s4}</span>
            </div>

            {wizardSubmitted ? (
              <div className="sim-rsvp-success" style={{ padding: '50px 20px', fontSize: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚙️</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', margin: '0 0 16px 0', color: 'var(--color-mint)' }}>
                  {t.portal.successTitle}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto 24px auto' }}>
                  {t.portal.successDesc}
                </p>
                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'monospace' }}>
                  {t.portal.successTrack}: {validationCode} <br />
                  {t.portal.successSheet}
                </div>
              </div>
            ) : (
              <div>
                {/* STEP 1: Enter Validation Code */}
                {wizardStep === 1 && (
                  <form onSubmit={handleVerifyCode} className="contact-form">
                    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', margin: '0 0 10px 0', color: 'var(--color-accent)' }}>
                        {t.portal.codeTitle}
                      </h4>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        {t.portal.codeDesc}
                      </p>
                      <p style={{ color: 'var(--color-text-light)', fontSize: '12px', fontStyle: 'italic' }}>
                        {t.portal.codeTip}
                      </p>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="vcode">Código</label>
                      <input 
                        className="form-input" 
                        style={{ textTransform: 'uppercase', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px', textAlign: 'center' }}
                        type="text" 
                        id="vcode" 
                        required 
                        placeholder={t.portal.codePlaceholder} 
                        value={validationCode}
                        onChange={(e) => { setValidationCode(e.target.value); setIsCodeValid(null); }}
                      />
                    </div>

                    {isCodeValid === false && (
                      <div className="sim-rsvp-success" style={{ background: '#fef3f4', color: '#e0004d', border: '1px solid #f9d6d9', padding: '12px', borderRadius: '8px', fontSize: '14px', textAlign: 'center', marginTop: '10px' }}>
                        {t.portal.codeInvalid}
                      </div>
                    )}

                    <button className="btn-form-submit" style={{ marginTop: '16px' }} type="submit">{t.portal.codeBtn}</button>
                  </form>
                )}

                {/* STEP 2: Selection of Category and Template */}
                {wizardStep === 2 && (
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', margin: '0 0 12px 0', color: 'var(--color-accent)' }}>
                      {t.portal.categoryTitle}
                    </h4>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                      {t.portal.categoryDesc}
                    </p>

                    <div className="category-select-grid">
                      <button 
                        className={`filter-btn ${wizardCategory === 'wedding' ? 'active' : ''}`}
                        onClick={() => { setWizardCategory('wedding'); setWizardModel('boda-marfil'); }}
                        style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}
                      >
                        <span style={{ fontSize: '24px' }}>💍</span>
                        <strong>{t.portal.catWedding}</strong>
                      </button>
                      <button 
                        className={`filter-btn ${wizardCategory === '15years' ? 'active' : ''}`}
                        onClick={() => { setWizardCategory('15years'); setWizardModel('15-glamour'); }}
                        style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}
                      >
                        <span style={{ fontSize: '24px' }}>👑</span>
                        <strong>{t.portal.cat15}</strong>
                      </button>
                      <button 
                        className={`filter-btn ${wizardCategory === 'other' ? 'active' : ''}`}
                        onClick={() => { setWizardCategory('other'); setWizardModel('otros-baby'); }}
                        style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}
                      >
                        <span style={{ fontSize: '24px' }}>🎈</span>
                        <strong>{t.portal.catOther}</strong>
                      </button>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label className="form-label" htmlFor="wmodel">{t.portal.selectModel}</label>
                      <select 
                        className="form-select" 
                        id="wmodel" 
                        value={wizardModel}
                        onChange={(e) => setWizardModel(e.target.value)}
                      >
                        {wizardCategory === 'wedding' && (
                          <>
                            <option value="boda-marfil">Clásico Marfil</option>
                            <option value="boda-boho">Rústico Boho</option>
                            <option value="boda-eucalipto">Eucalipto Elegante</option>
                          </>
                        )}
                        {wizardCategory === '15years' && (
                          <>
                            <option value="15-glamour">Glamour Rosa</option>
                            <option value="15-estrellas">Noche de Estrellas</option>
                            <option value="15-neon">Neón Party</option>
                          </>
                        )}
                        {wizardCategory === 'other' && (
                          <>
                            <option value="otros-baby">Baby Shower Especial</option>
                            <option value="otros-aniversario">Aniversario de Oro</option>
                            <option value="otros-graduacion">Graduación Premium</option>
                          </>
                        )}
                      </select>
                    </div>

                    <button className="btn-primary" onClick={() => setWizardStep(3)} style={{ width: '100%' }}>{t.portal.btnContinue}</button>
                  </div>
                )}

                {/* STEP 3: Dynamic Data Form based on Category */}
                {wizardStep === 3 && (
                  <form onSubmit={handleWizardSubmit} className="contact-form">
                    {/* A. WEDDING CATEGORY FORM FIELDS */}
                    {wizardCategory === 'wedding' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', margin: '0 0 10px 0', color: 'var(--color-accent)' }}>
                          {t.weddingForm.title}
                        </h4>
                        
                        <div className="form-row-2col">
                          <div className="form-group">
                            <label className="form-label">{t.weddingForm.p1}</label>
                            <input className="form-input" type="text" required placeholder="Ej. Sofía" value={weddingData.partner1Name} onChange={e => setWeddingData({...weddingData, partner1Name: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{t.weddingForm.p1wa}</label>
                            <input className="form-input" type="tel" required placeholder="Ej. 11 1234 5678" value={weddingData.novio1WhatsApp} onChange={e => setWeddingData({...weddingData, novio1WhatsApp: e.target.value})} />
                          </div>
                        </div>

                        <div className="form-row-2col">
                          <div className="form-group">
                            <label className="form-label">{t.weddingForm.p2}</label>
                            <input className="form-input" type="text" required placeholder="Ej. Mateo" value={weddingData.partner2Name} onChange={e => setWeddingData({...weddingData, partner2Name: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">{t.weddingForm.p2wa}</label>
                            <input className="form-input" type="tel" required placeholder="Ej. 11 8765 4321" value={weddingData.novio2WhatsApp} onChange={e => setWeddingData({...weddingData, novio2WhatsApp: e.target.value})} />
                          </div>
                        </div>

                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#fafafa' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.weddingForm.civilTitle}</span>
                          <div className="form-row-2col-mb12">
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.civilDate}</label>
                              <input className="form-input" type="date" value={weddingData.civilDate} onChange={e => setWeddingData({...weddingData, civilDate: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.civilTime}</label>
                              <input className="form-input" type="time" value={weddingData.civilTime} onChange={e => setWeddingData({...weddingData, civilTime: e.target.value})} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.civilPlace}</label>
                            <input className="form-input" type="text" placeholder="Ej. Registro Civil Central" value={weddingData.civilPlace} onChange={e => setWeddingData({...weddingData, civilPlace: e.target.value})} />
                          </div>
                        </div>

                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#fafafa' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.weddingForm.partyTitle}</span>
                          <div className="form-row-2col-mb12">
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.partyDate}</label>
                              <input className="form-input" type="date" required value={weddingData.ceremonyDate} onChange={e => setWeddingData({...weddingData, ceremonyDate: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.partyTime}</label>
                              <input className="form-input" type="time" required value={weddingData.ceremonyTime} onChange={e => setWeddingData({...weddingData, ceremonyTime: e.target.value})} />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.salon}</label>
                            <input className="form-input" type="text" required placeholder="Ej. Estancia La Linda" value={weddingData.ceremonyPlace} onChange={e => setWeddingData({...weddingData, ceremonyPlace: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.gps}</label>
                            <input className="form-input" type="url" required placeholder="Ej. https://maps.google.com/?q=..." value={weddingData.ceremonyGps} onChange={e => setWeddingData({...weddingData, ceremonyGps: e.target.value})} />
                          </div>
                        </div>

                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.weddingForm.giftTitle}</span>
                          <div className="form-row-2col-mb12">
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.alias}</label>
                              <input className="form-input" type="text" placeholder="Ej. boda.sofi.mati" value={weddingData.giftAlias} onChange={e => setWeddingData({...weddingData, giftAlias: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.cbu}</label>
                              <input className="form-input" type="text" placeholder="Ej. 00000031000..." value={weddingData.giftCbu} onChange={e => setWeddingData({...weddingData, giftCbu: e.target.value})} />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.music}</label>
                            <input className="form-input" type="text" placeholder="Ej. Perfect - Ed Sheeran" value={weddingData.backgroundMusic} onChange={e => setWeddingData({...weddingData, backgroundMusic: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.weddingForm.dress}</label>
                            <input className="form-input" type="text" placeholder="Ej. Formal / Elegante" value={weddingData.dressCode} onChange={e => setWeddingData({...weddingData, dressCode: e.target.value})} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">{t.weddingForm.upload}</label>
                          <input className="form-input" type="file" multiple accept="image/*" style={{ padding: '8px' }} />
                          <small style={{ color: 'var(--color-text-light)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{t.weddingForm.uploadTip}</small>
                        </div>
                      </div>
                    )}

                    {/* B. 15 YEARS CATEGORY FORM FIELDS */}
                    {wizardCategory === '15years' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', margin: '0 0 10px 0', color: 'var(--color-accent)' }}>
                          {t.quinceForm.title}
                        </h4>
                        
                        <div className="form-group">
                          <label className="form-label">{t.quinceForm.name}</label>
                          <input className="form-input" type="text" required placeholder="Ej. Martina" value={quinceData.quinceName} onChange={e => setQuinceData({...quinceData, quinceName: e.target.value})} />
                        </div>

                        <div className="form-group">
                          <label className="form-label">{t.quinceForm.parents}</label>
                          <input className="form-input" type="text" placeholder="Ej. Elena y Roberto" value={quinceData.parentNames} onChange={e => setQuinceData({...quinceData, parentNames: e.target.value})} />
                        </div>

                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#fafafa' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.quinceForm.partyTitle}</span>
                          <div className="form-row-2col-mb12">
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.quinceForm.partyDate}</label>
                              <input className="form-input" type="date" required value={quinceData.partyDate} onChange={e => setQuinceData({...quinceData, partyDate: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.quinceForm.partyTime}</label>
                              <input className="form-input" type="time" required value={quinceData.partyTime} onChange={e => setQuinceData({...quinceData, partyTime: e.target.value})} />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.quinceForm.salon}</label>
                            <input className="form-input" type="text" required placeholder="Ej. Palacio Cristal" value={quinceData.partyPlace} onChange={e => setQuinceData({...quinceData, partyPlace: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.quinceForm.gps}</label>
                            <input className="form-input" type="url" required placeholder="Ej. https://maps.google.com/..." value={quinceData.partyGps} onChange={e => setQuinceData({...quinceData, partyGps: e.target.value})} />
                          </div>
                        </div>

                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.quinceForm.styleTitle}</span>
                          <div className="form-row-2col-mb12">
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.quinceForm.alias}</label>
                              <input className="form-input" type="text" placeholder="Ej. mis15.martu" value={quinceData.giftAlias} onChange={e => setQuinceData({...quinceData, giftAlias: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.quinceForm.cbu}</label>
                              <input className="form-input" type="text" placeholder="Ej. 0000021000..." value={quinceData.giftCbu} onChange={e => setQuinceData({...quinceData, giftCbu: e.target.value})} />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.quinceForm.music}</label>
                            <input className="form-input" type="text" placeholder="Ej. Don't Start Now - Dua Lipa" value={quinceData.musicPreference} onChange={e => setQuinceData({...quinceData, musicPreference: e.target.value})} />
                          </div>
                          <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.quinceForm.dress}</label>
                            <input className="form-input" type="text" placeholder="Ej. Formal con toque flúor" value={quinceData.quinceDressCode} onChange={e => setQuinceData({...quinceData, quinceDressCode: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.quinceForm.hashtag}</label>
                            <input className="form-input" type="text" placeholder="Ej. #Los15DeMartu" value={quinceData.instagramHashtag} onChange={e => setQuinceData({...quinceData, instagramHashtag: e.target.value})} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">{t.quinceForm.upload}</label>
                          <input className="form-input" type="file" multiple accept="image/*" style={{ padding: '8px' }} />
                        </div>
                      </div>
                    )}

                    {/* C. OTHER EVENT CATEGORY FORM FIELDS */}
                    {wizardCategory === 'other' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', margin: '0 0 10px 0', color: 'var(--color-accent)' }}>
                          {t.otherForm.title}
                        </h4>
                        
                        <div className="form-row-2col">
                          <div className="form-group">
                            <label className="form-label">{t.otherForm.type}</label>
                            <select className="form-select" value={otherEventData.eventType} onChange={e => setOtherEventData({...otherEventData, eventType: e.target.value})}>
                              <option value="Baby Shower">Baby Shower</option>
                              <option value="Bautismo">Bautismo</option>
                              <option value="Aniversario">Aniversario</option>
                              <option value="Cumpleaños Infantil">Cumpleaños Infantil</option>
                              <option value="Cumpleaños de Adulto">Cumpleaños de Adulto</option>
                              <option value="Fiesta Corporativa">Fiesta de Empresa</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">{t.otherForm.eventTitle}</label>
                            <input className="form-input" type="text" required placeholder="Ej. Baby Shower Especial" value={otherEventData.eventTitle} onChange={e => setOtherEventData({...otherEventData, eventTitle: e.target.value})} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">{t.otherForm.organizer}</label>
                          <input className="form-input" type="text" required placeholder="Ej. Padres de Benjamín" value={otherEventData.organizerName} onChange={e => setOtherEventData({...otherEventData, organizerName: e.target.value})} />
                        </div>

                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#fafafa' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.otherForm.whenTitle}</span>
                          <div className="form-row-2col-mb12">
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.otherForm.date}</label>
                              <input className="form-input" type="date" required value={otherEventData.eventDate} onChange={e => setOtherEventData({...otherEventData, eventDate: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.otherForm.time}</label>
                              <input className="form-input" type="time" required value={otherEventData.eventTime} onChange={e => setOtherEventData({...otherEventData, eventTime: e.target.value})} />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.otherForm.salon}</label>
                            <input className="form-input" type="text" required placeholder="Ej. Casa de Té - Las Lilas" value={otherEventData.eventPlace} onChange={e => setOtherEventData({...otherEventData, eventPlace: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.otherForm.gps}</label>
                            <input className="form-input" type="url" required placeholder="Ej. https://maps.google.com/..." value={otherEventData.eventGps} onChange={e => setOtherEventData({...otherEventData, eventGps: e.target.value})} />
                          </div>
                        </div>

                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.otherForm.giftTitle}</span>
                          <div className="form-row-2col-mb12">
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.otherForm.alias}</label>
                              <input className="form-input" type="text" placeholder="Ej. baby.benja.regalos" value={otherEventData.giftAlias} onChange={e => setOtherEventData({...otherEventData, giftAlias: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '12px' }}>{t.otherForm.cbu}</label>
                              <input className="form-input" type="text" placeholder="Ej. 000031200..." value={otherEventData.giftCbu} onChange={e => setOtherEventData({...otherEventData, giftCbu: e.target.value})} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '12px' }}>{t.otherForm.music}</label>
                            <input className="form-input" type="text" placeholder="Ej. Lullaby - Brahms" value={otherEventData.backgroundMusic} onChange={e => setOtherEventData({...otherEventData, backgroundMusic: e.target.value})} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">{t.otherForm.instructions}</label>
                          <textarea className="form-textarea" placeholder="Ej. 'Por favor traer traje de baño', 'Sugerencias de regalos: pañales talle M'..." value={otherEventData.specialInstructions} onChange={e => setOtherEventData({...otherEventData, specialInstructions: e.target.value})}></textarea>
                        </div>

                        <div className="form-group">
                          <label className="form-label">{t.otherForm.upload}</label>
                          <input className="form-input" type="file" multiple accept="image/*" style={{ padding: '8px' }} />
                        </div>
                      </div>
                    )}

                    <button className="btn-form-submit" style={{ marginTop: '24px' }} type="submit">{t.portal.btnGenerate}</button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6.5: COMPRAR / OBTENER CÓDIGO */}
      <section id="pago" className="features-section" style={{ background: '#ffffff', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">💳 {lang === 'es' ? 'Simulación de Pago' : (lang === 'en' ? 'Payment Simulation' : 'Simulação de Pagamento')}</span>
            <h2 className="section-title">{lang === 'es' ? 'Obtené tu Código de Validación' : (lang === 'en' ? 'Get Your Validation Code' : 'Obtenha seu Código de Validação')}</h2>
            <p className="section-desc">
              {lang === 'es' 
                ? "Elegí el plan que mejor se adapte a tu evento y obtené tu código de validación premium de forma inmediata." 
                : (lang === 'en' 
                  ? "Choose the plan that best suits your event and get your premium validation code immediately." 
                  : "Escolha o plano que melhor se adapta ao seu evento e obtenha seu código de validação premium imediatamente.")}
            </p>
          </div>

          {paymentSuccess ? (
            <div className="contact-form-box" style={{ padding: '40px', border: '2px solid var(--color-mint)', background: 'var(--color-mint-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>💳🎉</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--color-mint)', margin: '0 0 10px 0' }}>
                {t.payment.successTitle}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
                {t.payment.successDesc}
              </p>

              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', display: 'inline-block', border: '2px dashed var(--color-mint)', marginBottom: '32px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-light)', display: 'block', marginBottom: '8px' }}>{t.payment.codeLabel}</span>
                <strong style={{ fontSize: '32px', fontFamily: 'monospace', letterSpacing: '4px', color: 'var(--color-accent)' }}>
                  {newGeneratedCode}
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '8px 0 0 0' }}>
                  {t.payment.destLabel}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button className="btn-primary animate-heartbeat" onClick={handleUseGeneratedCode}>
                  {t.payment.btnStart}
                </button>
              </div>
            </div>
          ) : (
            <div className="checkout-container-grid">
              {/* Left Column: Select Plans & benefits with Country switching */}
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: '0 0 12px 0' }}>{t.payment.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  {t.payment.desc}
                </p>

                {/* Dynamic Country Selector Dropdown */}
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.payment.countryLabel}</span>
                  <select 
                    className="form-select" 
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '14px' }}
                    value={selectedCurrency}
                    onChange={(e) => {
                      const curr = e.target.value as any;
                      setSelectedCurrency(curr);
                    }}
                  >
                    <option value="USD">💵 USD (International - USD)</option>
                    <option value="ARS">🇦🇷 ARS (Argentina)</option>
                    <option value="UYU">🇺🇾 UYU (Uruguay)</option>
                    <option value="MXN">🇲🇽 MXN (México)</option>
                    <option value="CLP">🇨🇱 CLP (Chile)</option>
                    <option value="COP">🇨🇴 COP (Colombia)</option>
                    <option value="PEN">🇵🇪 PEN (Perú)</option>
                    <option value="BRL">🇧🇷 BRL (Brasil)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div 
                    className={`plan-payment-card ${paymentPlan === 'bronze' ? 'active' : ''}`}
                    onClick={() => setPaymentPlan('bronze')}
                    style={{ border: '2px solid ' + (paymentPlan === 'bronze' ? 'var(--color-accent)' : 'var(--color-border)'), borderRadius: '12px', padding: '16px', cursor: 'pointer', background: 'white' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>🥉 {t.payment.bronzeTitle}</span>
                      <span style={{ color: 'var(--color-accent)' }}>
                        {CURRENCY_DATA[selectedCurrency].symbol}{CURRENCY_DATA[selectedCurrency].bronze} {CURRENCY_DATA[selectedCurrency].suffix}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                      {t.payment.bronzeDesc}
                    </p>
                  </div>

                  <div 
                    className={`plan-payment-card ${paymentPlan === 'silver' ? 'active' : ''}`}
                    onClick={() => setPaymentPlan('silver')}
                    style={{ border: '2px solid ' + (paymentPlan === 'silver' ? 'var(--color-accent)' : 'var(--color-border)'), borderRadius: '12px', padding: '16px', cursor: 'pointer', background: 'white' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>🥈 {t.payment.silverTitle}</span>
                      <span style={{ color: 'var(--color-accent)' }}>
                        {CURRENCY_DATA[selectedCurrency].symbol}{CURRENCY_DATA[selectedCurrency].silver} {CURRENCY_DATA[selectedCurrency].suffix}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                      {t.payment.silverDesc}
                    </p>
                  </div>

                  <div 
                    className={`plan-payment-card ${paymentPlan === 'gold' ? 'active' : ''}`}
                    onClick={() => setPaymentPlan('gold')}
                    style={{ border: '2px solid ' + (paymentPlan === 'gold' ? 'var(--color-accent)' : 'var(--color-border)'), borderRadius: '12px', padding: '16px', cursor: 'pointer', background: 'white' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>🥇 {t.payment.goldTitle}</span>
                      <span style={{ color: 'var(--color-accent)' }}>
                        {CURRENCY_DATA[selectedCurrency].symbol}{CURRENCY_DATA[selectedCurrency].gold} {CURRENCY_DATA[selectedCurrency].suffix}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                      {t.payment.goldDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout Simulated Form */}
              <div className="contact-form-box">
                <form onSubmit={handleSimulatedPayment} className="contact-form" style={{ textAlign: 'left' }}>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', margin: '0 0 16px 0', color: 'var(--color-accent)' }}>
                    {t.payment.formTitle}
                  </h4>

                  <div className="form-group">
                    <label className="form-label">{t.payment.name}</label>
                    <input className="form-input" type="text" required placeholder="Ej. Florencia Rodríguez" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.payment.email}</label>
                    <input className="form-input" type="email" required placeholder="Ej. flor@correo.com" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.payment.phone}</label>
                    <input className="form-input" type="tel" required placeholder="Ej. 11 5555 5555" value={buyerWhatsapp} onChange={e => setBuyerWhatsApp(e.target.value)} />
                  </div>

                  {/* Secure Payment Details - Mercado Pago Only */}
                  <div style={{ background: '#fafafa', padding: '14px', borderRadius: '12px', fontSize: '12px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: 'var(--color-accent)', marginBottom: '6px' }}>
                      <span>💳</span>
                      <span>{t.payment.mercadopago}</span>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px' }}>
                      {t.payment.gatewayInstruct} {selectedCurrency !== 'USD' ? selectedCurrency : 'USD (International)'}.
                    </p>
                    {paymentPlan === 'gold' && (
                      <div style={{ marginTop: '10px', borderTop: '1px dashed var(--color-border)', paddingTop: '8px' }}>
                        <strong>Enlace de Pago Oficial:</strong> <br />
                        <a href="https://mpago.la/1W6btGs" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '4px', backgroundColor: '#009EE3', color: 'white', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '11px' }}>
                          Pagar con Mercado Pago ↗
                        </a>
                      </div>
                    )}
                  </div>

                  <button className="btn-form-submit" type="submit" disabled={isPaying}>
                    {isPaying ? t.payment.btnPaying : t.payment.btnPay}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 7: CONTACTO & CONSULTAS */}
      <section id="contacto" className="contact-section">
        <div className="container contact-grid">
          {/* Info Column */}
          <div className="contact-info">
            <h2 className="contact-info-title">{t.contact.title}</h2>
            <p className="contact-info-desc">{t.contact.desc}</p>
          </div>

          {/* Form Column: Standard Simple Contact Form */}
          <div className="contact-form-box">
            {simpleContactSubmitted ? (
              <div className="sim-rsvp-success" style={{ padding: '40px 20px', fontSize: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: '0 0 10px 0', color: 'var(--color-mint)' }}>
                  {t.contact.successTitle}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', margin: '0' }}>
                  {t.contact.successDesc}
                </p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSimpleContactSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sname">{t.contact.formName}</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    id="sname" 
                    required 
                    placeholder="Ej. Florencia Rodríguez" 
                    value={simpleContactData.name}
                    onChange={e => setSimpleContactData({...simpleContactData, name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="swhatsapp">{t.contact.formPhone}</label>
                  <input 
                    className="form-input" 
                    type="tel" 
                    id="swhatsapp" 
                    required 
                    placeholder="Ej. 11 5555 5555" 
                    value={simpleContactData.whatsapp}
                    onChange={e => setSimpleContactData({...simpleContactData, whatsapp: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="smsg">{t.contact.formMsg}</label>
                  <textarea 
                    className="form-textarea" 
                    id="smsg" 
                    required
                    placeholder={t.contact.formPlaceholder}
                    value={simpleContactData.message}
                    onChange={e => setSimpleContactData({...simpleContactData, message: e.target.value})}
                  ></textarea>
                </div>

                <button className="btn-form-submit" type="submit">{t.contact.btnSend}</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <a href="#inicio" className="footer-logo" onClick={(e) => handleScrollToSection(e, 'inicio')}>
            <img src="/logo.svg" alt="Save Your Date" className="footer-logo-img" />
          </a>

          <div className="footer-links">
            <a href="#inicio" className="footer-link" onClick={(e) => handleScrollToSection(e, 'inicio')}>{t.nav.home}</a>
            <a href="#modelos" className="footer-link" onClick={(e) => handleScrollToSection(e, 'modelos')}>{t.nav.models}</a>
            <a href="#incluyen" className="footer-link" onClick={(e) => handleScrollToSection(e, 'incluyen')}>{t.nav.features}</a>
            <a href="#contacto" className="footer-link" onClick={(e) => handleScrollToSection(e, 'contacto')}>{t.nav.contact}</a>
          </div>

          <p className="footer-copy">
            &copy; {new Date().getFullYear()} {t.footer.copy}
          </p>
        </div>
      </footer>

      {/* EXTRAS MODAL */}
      {showExtrasModal && (
        <div className="modal-overlay" onClick={() => setShowExtrasModal(false)}>
          <div className="modal-container extras-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close-btn" onClick={() => setShowExtrasModal(false)} aria-label="Cerrar">×</button>
            
            <div className="modal-content-scroll">
              <div className="extras-modal-header" style={{ 
                backgroundColor: 'var(--color-accent)', 
                color: 'white', 
                padding: '40px 24px', 
                textAlign: 'center',
                position: 'relative'
              }}>
                <img src="/logo.svg" alt="Save Your Date" style={{ height: '70px', width: 'auto', marginBottom: '16px', filter: 'brightness(0) invert(1)' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', margin: '0 0 10px 0', color: 'white' }}>
                  {t.extras?.title || "Beneficios Premium Incluidos"}
                </h3>
                <p style={{ fontSize: '13px', margin: 0, opacity: 0.9, lineHeight: 1.4 }}>
                  {t.extras?.desc || "Además de las funciones interactivas, tu invitación Save Your Date incluye una suite completa de herramientas para facilitar la organización de tu gran día:"}
                </p>
              </div>

              <div className="extras-modal-body" style={{ padding: '30px 24px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                  {(t.extras?.items || []).map((item: string, idx: number) => (
                    <li key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--color-accent)', fontSize: '16px', fontWeight: 'bold', lineHeight: 1 }}>♥</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '0 24px 30px 24px', textAlign: 'center' }}>
                <button className="btn-primary" onClick={() => setShowExtrasModal(false)} style={{ width: '100%', padding: '12px' }}>
                  {lang === 'es' ? "Entendido, ¡espectacular! ♥" : (lang === 'en' ? "Got it, amazing! ♥" : "Entendido, maravilhoso! ♥")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE INVITATION SIMULATOR MODAL */}
      {demoModel && (
        <div className="modal-overlay" onClick={() => setDemoModel(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setDemoModel(null)} aria-label="Cerrar">×</button>
            
            <div className="modal-content-scroll">
              {/* Simulated invitation top header */}
              <div className="sim-cover" style={{ 
                background: `linear-gradient(rgba(0,0,0, 0.25), rgba(0,0,0, 0.45)), linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)`
              }}>
                <span className="sim-cover-sub">{t.modal.invited}</span>
                <h2 className="sim-cover-title">{demoModel.demoName1}</h2>
                {demoModel.demoName2 && <h2 className="sim-cover-title" style={{ marginTop: '2px', fontSize: '24px' }}>{demoModel.demoName2}</h2>}
                <p className="sim-cover-sub" style={{ marginTop: '12px', fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '15px' }}>
                  {demoModel.date}
                </p>
              </div>

              {/* Music Player Widget */}
              {demoModel.musicTitle && (
                <div className="sim-section" style={{ backgroundColor: '#fafafa' }}>
                  <span className="section-subtitle" style={{ fontSize: '11px' }}>{t.modal.musicTitle}</span>
                  <div className="sim-audio-widget">
                    <div className="sim-audio-info">
                      <p className="sim-audio-title">{demoModel.musicTitle}</p>
                      <p className="sim-audio-artist">{demoModel.musicArtist}</p>
                    </div>
                    <button className="sim-audio-playbtn" onClick={() => setIsPlayingMusic(!isPlayingMusic)}>
                      {isPlayingMusic ? '❚❚' : '▶'}
                    </button>
                  </div>
                  {isPlayingMusic && (
                    <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginTop: '10px' }}>
                      <span style={{ width: '4px', height: '15px', backgroundColor: 'var(--color-mint)', animation: 'heartbeat 1s infinite' }}></span>
                      <span style={{ width: '4px', height: '22px', backgroundColor: 'var(--color-mint)', animation: 'heartbeat 0.8s infinite 0.2s' }}></span>
                      <span style={{ width: '4px', height: '12px', backgroundColor: 'var(--color-mint)', animation: 'heartbeat 1.2s infinite 0.4s' }}></span>
                      <span style={{ width: '4px', height: '18px', backgroundColor: 'var(--color-mint)', animation: 'heartbeat 0.9s infinite 0.1s' }}></span>
                    </div>
                  )}
                </div>
              )}

              {/* Countdown Sim */}
              <div className="sim-section">
                <h3 className="sim-sec-title">{t.modal.countdownTitle}</h3>
                <p className="sim-sec-desc">{t.modal.countdownDesc}</p>
                
                <div className="sim-countdown">
                  <div className="sim-cd-item">
                    <span className="sim-cd-num">{timeLeft.days}</span>
                    <span className="sim-cd-label">{t.modal.days}</span>
                  </div>
                  <div className="sim-cd-item">
                    <span className="sim-cd-num">{timeLeft.hours}</span>
                    <span className="sim-cd-label">{t.modal.hours}</span>
                  </div>
                  <div className="sim-cd-item">
                    <span className="sim-cd-num">{timeLeft.minutes}</span>
                    <span className="sim-cd-label">{t.modal.mins}</span>
                  </div>
                  <div className="sim-cd-item">
                    <span className="sim-cd-num">{timeLeft.seconds}</span>
                    <span className="sim-cd-label">{t.modal.segs}</span>
                  </div>
                </div>
              </div>

              {/* Location details */}
              {demoModel.location && (
                <div className="sim-section" style={{ backgroundColor: '#fdfdfd' }}>
                  <h3 className="sim-sec-title">{t.modal.where}</h3>
                  <p className="sim-sec-desc" style={{ fontWeight: 'bold' }}>{demoModel.location}</p>
                  <p className="sim-sec-desc">{t.modal.whereDesc}</p>
                  <button className="sim-map-btn" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(demoModel.location || '')}`, '_blank')}>
                    {t.modal.btnMap}
                  </button>
                </div>
              )}

              {/* RSVP Form */}
              <div className="sim-section" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                <h3 className="sim-sec-title" style={{ color: 'var(--color-accent)' }}>{t.modal.rsvpTitle}</h3>
                <p className="sim-sec-desc">{t.modal.rsvpDesc}</p>
                
                {rsvpSuccess ? (
                  <div className="sim-rsvp-success">
                    {t.modal.rsvpSuccess}
                  </div>
                ) : (
                  <form className="sim-rsvp-form" onSubmit={handleRsvpSubmit}>
                    <input 
                      type="text" 
                      placeholder={t.modal.rsvpName} 
                      className="form-input" 
                      style={{ fontSize: '13px', padding: '10px' }}
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      required 
                    />
                    
                    <select 
                      className="sim-rsvp-select"
                      value={selectedRsvpOption}
                      onChange={(e) => setSelectedRsvpOption(e.target.value)}
                      required
                    >
                      <option value="">{t.modal.rsvpOption}</option>
                      <option value="yes">{t.modal.rsvpYes}</option>
                      <option value="no">{t.modal.rsvpNo}</option>
                    </select>

                    {selectedRsvpOption === 'yes' && (
                      <div style={{ textAlign: 'left', fontSize: '12px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{t.modal.guestLabel}</label>
                        <select 
                          className="sim-rsvp-select" 
                          value={guestCount}
                          onChange={(e) => setGuestCount(e.target.value)}
                        >
                          <option value="1">{t.modal.guestSolo}</option>
                          <option value="2">{t.modal.guestMultiple.replace('{count}', '2')}</option>
                          <option value="3">{t.modal.guestMultiple.replace('{count}', '3')}</option>
                          <option value="4">{t.modal.guestMultiple.replace('{count}', '4')}</option>
                        </select>
                      </div>
                    )}

                    <button type="submit" className="sim-rsvp-submit">{t.modal.btnConfirm}</button>
                  </form>
                )}
              </div>

              {/* Simulated Dress Code & gifts */}
              <div className="sim-section" style={{ fontSize: '13px' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🎁</span>
                <p style={{ fontWeight: 'bold', margin: '0' }}>{t.modal.giftTitle}</p>
                <p style={{ color: '#666', margin: '4px 0 0 0' }}>
                  {t.modal.giftDesc}
                </p>
                <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '8px', marginTop: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
                  ALIAS: boda.sofi.mati.2026 <br />
                  CBU: 000000310009876543210
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

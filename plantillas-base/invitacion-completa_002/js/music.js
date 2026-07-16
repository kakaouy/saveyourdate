/* =========================================================
   MUSIC.JS
   Sistema de música de la invitación
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initMusic();
});


/* =========================================================
   VARIABLES INTERNAS
========================================================= */

let backgroundMusic = null;

let musicButton = null;

let musicIcon = null;


/* =========================================================
   INICIALIZAR MÚSICA
========================================================= */

function initMusic() {

  backgroundMusic =
    document.getElementById(
      "background-music"
    );


  musicButton =
    document.getElementById(
      "music-toggle"
    );


  musicIcon =
    document.getElementById(
      "music-toggle-icon"
    );


  /*
    Si la música está desactivada.
  */

  if (
    typeof EVENT_CONFIG !== "undefined" &&
    EVENT_CONFIG.music?.enabled === false
  ) {

    if (musicButton) {

      musicButton.hidden = true;

    }


    return;

  }


  /*
    Si no existe el elemento audio,
    no podemos continuar.
  */

  if (!backgroundMusic) {

    console.warn(
      "No se encontró #background-music"
    );

    return;

  }


  /*
    Configuramos opciones.
  */

  backgroundMusic.loop =
    EVENT_CONFIG?.music?.loop
    ?? true;


  backgroundMusic.volume =
    clampVolume(
      EVENT_CONFIG?.music?.volume
      ?? 0.5
    );


  /*
    Click en botón flotante.
  */

  musicButton?.addEventListener(
    "click",
    toggleMusic
  );


  /*
    Evento enviado desde main.js
    al entrar a la invitación.
  */

  document.addEventListener(
    "invitation:enter",
    handleInvitationEntry
  );


  /*
    Sincronizamos la interfaz
    con eventos reales del audio.
  */

  backgroundMusic.addEventListener(
    "play",
    () => {

      updateMusicUI(true);

    }
  );


  backgroundMusic.addEventListener(
    "pause",
    () => {

      updateMusicUI(false);

    }
  );


  backgroundMusic.addEventListener(
    "ended",
    () => {

      updateMusicUI(false);

    }
  );


  /*
    Estado inicial.
  */

  updateMusicUI(
    !backgroundMusic.paused
  );

}


/* =========================================================
   ENTRADA A LA INVITACIÓN
========================================================= */

async function handleInvitationEntry(
  event
) {

  const wantsMusic =
    event.detail?.music
    === true;


  if (!wantsMusic) {

    pauseMusic();

    return;

  }


  /*
    Reproducimos música porque este evento
    viene directamente de un click del usuario.

    Esto evita restricciones de autoplay
    en navegadores móviles.
  */

  await playMusic();

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

async function playMusic() {

  if (!backgroundMusic) {
    return false;
  }


  try {

    await backgroundMusic.play();

    updateMusicUI(true);

    return true;

  }
  catch (error) {

    console.warn(
      "El navegador bloqueó la reproducción de audio.",
      error
    );


    updateMusicUI(false);

    return false;

  }

}


function pauseMusic() {

  if (!backgroundMusic) {
    return;
  }


  backgroundMusic.pause();

  updateMusicUI(false);

}


/* =========================================================
   ALTERNAR ESTADO
========================================================= */

async function toggleMusic() {

  if (!backgroundMusic) {
    return;
  }


  if (backgroundMusic.paused) {

    await playMusic();

  }
  else {

    pauseMusic();

  }

}


/* =========================================================
   ACTUALIZAR INTERFAZ
========================================================= */

function updateMusicUI(
  isPlaying
) {

  if (!musicButton) {
    return;
  }


  /*
    Clase visual.
  */

  musicButton.classList.toggle(
    "is-playing",
    isPlaying
  );


  /*
    Estado accesible.
  */

  musicButton.setAttribute(
    "aria-pressed",
    String(isPlaying)
  );


  musicButton.setAttribute(
    "aria-label",
    isPlaying
      ? "Pausar música"
      : "Reproducir música"
  );


  /*
    Cambiar icono.
  */

  if (!musicIcon) {
    return;
  }


  const playingIcon =
    EVENT_CONFIG
      ?.music
      ?.iconPlaying;


  const pausedIcon =
    EVENT_CONFIG
      ?.music
      ?.iconPaused;


  if (
    isPlaying &&
    playingIcon
  ) {

    musicIcon.src =
      playingIcon;

  }


  if (
    !isPlaying &&
    pausedIcon
  ) {

    musicIcon.src =
      pausedIcon;

  }

}


/* =========================================================
   UTILIDAD DE VOLUMEN
========================================================= */

function clampVolume(
  value
) {

  const numericValue =
    Number(value);


  if (
    Number.isNaN(
      numericValue
    )
  ) {

    return 0.5;

  }


  return Math.min(
    1,
    Math.max(
      0,
      numericValue
    )
  );

}
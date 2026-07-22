/* =========================================================
   CONTROL DE MÚSICA
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const audio =
      document.getElementById(
        "background-music"
      );

    const toggleButton =
      document.getElementById(
        "music-toggle"
      );

    const toggleIcon =
      document.getElementById(
        "music-toggle-icon"
      );

    const enterWithMusic =
      document.getElementById(
        "enter-with-music"
      );

    const enterWithoutMusic =
      document.getElementById(
        "enter-without-music"
      );

    const config =
      EVENT_CONFIG.music || {};

    if (!audio) {
      return;
    }

    audio.loop =
      config.loop !== false;

    audio.volume =
      config.volume ?? 0.45;

    updateMusicButton(
      false,
      toggleButton,
      toggleIcon
    );

    toggleButton?.addEventListener(
      "click",
      async () => {
        if (audio.paused) {
          await playBackgroundMusic(
            audio,
            toggleButton,
            toggleIcon
          );
        }
        else {
          pauseBackgroundMusic(
            audio,
            toggleButton,
            toggleIcon
          );
        }
      }
    );

    enterWithMusic?.addEventListener(
      "click",
      async () => {
        closeWelcomeScreen();

        if (config.enabled !== false) {
          await playBackgroundMusic(
            audio,
            toggleButton,
            toggleIcon
          );
        }
      }
    );

    enterWithoutMusic?.addEventListener(
      "click",
      () => {
        pauseBackgroundMusic(
          audio,
          toggleButton,
          toggleIcon
        );

        closeWelcomeScreen();
      }
    );

    audio.addEventListener(
      "play",
      () => {
        updateMusicButton(
          true,
          toggleButton,
          toggleIcon
        );
      }
    );

    audio.addEventListener(
      "pause",
      () => {
        updateMusicButton(
          false,
          toggleButton,
          toggleIcon
        );
      }
    );
  }
);


/* =========================================================
   REPRODUCIR
========================================================= */

async function playBackgroundMusic(
  audio,
  button,
  icon
) {
  if (!audio) {
    return false;
  }

  try {
    await audio.play();

    updateMusicButton(
      true,
      button,
      icon
    );

    return true;
  }
  catch (error) {
    console.warn(
      "El navegador no permitió reproducir la música.",
      error
    );

    updateMusicButton(
      false,
      button,
      icon
    );

    return false;
  }
}


/* =========================================================
   PAUSAR
========================================================= */

function pauseBackgroundMusic(
  audio,
  button,
  icon
) {
  if (!audio) {
    return;
  }

  audio.pause();

  updateMusicButton(
    false,
    button,
    icon
  );
}


/* =========================================================
   ACTUALIZAR BOTÓN
========================================================= */

function updateMusicButton(
  isPlaying,
  button,
  icon
) {
  const config =
    EVENT_CONFIG.music || {};

  if (button) {
    button.setAttribute(
      "aria-label",
      isPlaying
        ? "Pausar música"
        : "Reproducir música"
    );

    button.setAttribute(
      "aria-pressed",
      String(isPlaying)
    );

    button.classList.toggle(
      "is-playing",
      isPlaying
    );
  }

  if (!icon) {
    return;
  }

  const iconSource =
    isPlaying
      ? config.iconPaused
      : config.iconPlaying;

  if (iconSource) {
    icon.src =
      iconSource;
  }

  icon.alt = "";
}


/* =========================================================
   CERRAR PANTALLA DE BIENVENIDA
========================================================= */

function closeWelcomeScreen() {
  const welcome =
    document.getElementById(
      "welcome-screen"
    );

  if (!welcome) {
    return;
  }

  welcome.hidden = true;

  welcome.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "no-scroll"
  );
}
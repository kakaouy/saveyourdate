/* =========================================================
   COUNTDOWN.JS
   Cuenta regresiva del evento
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initCountdown();
});


/* =========================================================
   INICIALIZAR CUENTA REGRESIVA
========================================================= */

function initCountdown() {

  const countdownSection =
    document.getElementById("countdown-section");


  /*
    Si la sección está desactivada,
    no hacemos nada.
  */

  if (
    typeof EVENT_CONFIG !== "undefined" &&
    EVENT_CONFIG.sections?.countdown === false
  ) {
    return;
  }


  /*
    Validamos que exista una fecha.
  */

  const eventDateString =
    EVENT_CONFIG?.event?.date;


  if (!eventDateString) {

    console.warn(
      "No se encontró EVENT_CONFIG.event.date"
    );

    return;

  }


  const eventDate =
    new Date(eventDateString);


  /*
    Validamos que la fecha sea correcta.
  */

  if (
    Number.isNaN(
      eventDate.getTime()
    )
  ) {

    console.error(
      "La fecha del evento no es válida:",
      eventDateString
    );

    return;

  }


  /*
    Ejecutamos inmediatamente
    para evitar ver 00:00:00:00.
  */

  updateCountdown(
    eventDate
  );


  /*
    Actualizamos cada segundo.
  */

  const intervalId =
    window.setInterval(
      () => {

        const finished =
          updateCountdown(
            eventDate
          );


        /*
          Cuando llega el evento,
          detenemos el intervalo.
        */

        if (finished) {

          window.clearInterval(
            intervalId
          );

        }

      },
      1000
    );

}


/* =========================================================
   ACTUALIZAR CUENTA REGRESIVA
========================================================= */

function updateCountdown(
  eventDate
) {

  const now =
    new Date();


  const difference =
    eventDate.getTime()
    -
    now.getTime();


  /*
    Si la fecha ya llegó.
  */

  if (difference <= 0) {

    handleCountdownFinished();

    return true;

  }


  /*
    Conversión del tiempo.
  */

  const totalSeconds =
    Math.floor(
      difference / 1000
    );


  const days =
    Math.floor(
      totalSeconds
      /
      86400
    );


  const hours =
    Math.floor(
      (
        totalSeconds
        % 86400
      )
      /
      3600
    );


  const minutes =
    Math.floor(
      (
        totalSeconds
        % 3600
      )
      /
      60
    );


  const seconds =
    totalSeconds
    % 60;


  /*
    Mostramos los valores.
  */

  setCountdownValue(
    "countdown-days",
    days
  );


  setCountdownValue(
    "countdown-hours",
    hours
  );


  setCountdownValue(
    "countdown-minutes",
    minutes
  );


  setCountdownValue(
    "countdown-seconds",
    seconds
  );


  return false;
}


/* =========================================================
   MOSTRAR VALOR
========================================================= */

function setCountdownValue(
  elementId,
  value
) {

  const element =
    document.getElementById(
      elementId
    );


  if (!element) {
    return;
  }


  /*
    Horas, minutos y segundos
    siempre con dos dígitos.

    Los días pueden superar 99.
  */

  const formattedValue =
    value < 10
      ? `0${value}`
      : String(value);


  element.textContent =
    formattedValue;
}


/* =========================================================
   CUANDO LLEGA LA FECHA
========================================================= */

function handleCountdownFinished() {

  /*
    Dejamos todos los valores en cero.
  */

  setCountdownValue(
    "countdown-days",
    0
  );


  setCountdownValue(
    "countdown-hours",
    0
  );


  setCountdownValue(
    "countdown-minutes",
    0
  );


  setCountdownValue(
    "countdown-seconds",
    0
  );


  /*
    Cambiamos el título por
    el mensaje configurado.
  */

  const message =
    EVENT_CONFIG
      ?.countdown
      ?.expiredMessage
    ||
    "¡Llegó el gran día!";


  const title =
    document.getElementById(
      "countdown-title"
    );


  if (title) {

    title.textContent =
      message;

  }


  /*
    Evento personalizado por si más adelante
    queremos disparar confeti u otra animación.
  */

  document.dispatchEvent(
    new CustomEvent(
      "countdown:finished"
    )
  );

}
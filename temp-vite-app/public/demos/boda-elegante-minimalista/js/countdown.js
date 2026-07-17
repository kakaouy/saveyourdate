/* =========================================================
   CUENTA REGRESIVA
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const countdown =
      document.getElementById(
        "countdown"
      );

    if (!countdown) {
      return;
    }

    const eventDate =
      getEventDate();

    if (!eventDate) {
      resetCountdown();

      return;
    }

    updateCountdown(eventDate);

    const intervalId =
      window.setInterval(
        () => {
          const finished =
            updateCountdown(
              eventDate
            );

          if (finished) {
            window.clearInterval(
              intervalId
            );
          }
        },
        1000
      );
  }
);


/* =========================================================
   ACTUALIZAR CONTADOR
========================================================= */

function updateCountdown(eventDate) {
  const now =
    new Date();

  const difference =
    eventDate.getTime() -
    now.getTime();

  if (difference <= 0) {
    resetCountdown();

    const title =
      document.getElementById(
        "countdown-title"
      );

    const expiredMessage =
      EVENT_CONFIG.countdown
        ?.expiredMessage;

    if (
      title &&
      expiredMessage
    ) {
      title.textContent =
        expiredMessage;
    }

    return true;
  }

  const totalSeconds =
    Math.floor(
      difference / 1000
    );

  const days =
    Math.floor(
      totalSeconds / 86400
    );

  const hours =
    Math.floor(
      (totalSeconds % 86400) /
      3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
      60
    );

  const seconds =
    totalSeconds % 60;

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

  element.textContent =
    String(value).padStart(
      2,
      "0"
    );
}


/* =========================================================
   REINICIAR CONTADOR
========================================================= */

function resetCountdown() {
  [
    "countdown-days",
    "countdown-hours",
    "countdown-minutes",
    "countdown-seconds"
  ].forEach(
    (elementId) => {
      setCountdownValue(
        elementId,
        0
      );
    }
  );
}
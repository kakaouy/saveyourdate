/* =========================================================
   SAVE YOUR DATE
   GOOGLE APPS SCRIPT BASE
========================================================= */

const CONFIG = {
  spreadsheetId: "PEGAR_AQUI_ID_GOOGLE_SHEET",

  sheets: {
    guests: "Invitados",
    playlist: "Playlist"
  }
};


/* =========================================================
   GET
   Obtener invitados
========================================================= */

function doGet(e) {
  try {

    const action =
      e.parameter.action || "";

    if (action === "guests") {
      return getGuests(e);
    }

    return jsonResponse({
      success: false,
      message: "Acción no válida."
    });

  }
  catch (error) {

    return jsonResponse({
      success: false,
      message: error.message
    });

  }
}


/* =========================================================
   POST
   Guardar RSVP o canción
========================================================= */

function doPost(e) {
  try {

    const data =
      JSON.parse(
        e.postData.contents
      );

    const action =
      data.action || "";

    if (action === "confirm") {
      return saveRsvp(data);
    }

    if (action === "song") {
      return saveSong(data);
    }

    return jsonResponse({
      success: false,
      message: "Acción no válida."
    });

  }
  catch (error) {

    return jsonResponse({
      success: false,
      message: error.message
    });

  }
}


/* =========================================================
   OBTENER INVITADOS
========================================================= */

function getGuests(e) {

  const group =
    e.parameter.group || "";

  const eventId =
    e.parameter.eventId || "";

  const sheet =
    getSpreadsheet()
      .getSheetByName(
        CONFIG.sheets.guests
      );

  if (!sheet) {
    throw new Error(
      "No existe la hoja Invitados."
    );
  }

  const values =
    sheet
      .getDataRange()
      .getValues();

  if (values.length < 2) {

    return jsonResponse({
      success: true,
      guests: []
    });

  }

  const headers =
    values[0];

  const rows =
    values.slice(1);

  const index =
    getHeaderIndexes(headers);


  const guests =
    rows
      .map((row, position) => {

        return {
          row: position + 2,

          eventId:
            row[index.eventId],

          group:
            row[index.group],

          id:
            row[index.guestId],

          name:
            row[index.name],

          status:
            row[index.status],

          dietaryRestriction:
            row[index.dietaryRestriction],

          dietaryDetail:
            row[index.dietaryDetail]
        };

      })
      .filter(guest => {

        return (
          String(guest.group)
          ===
          String(group)

          &&

          (
            !eventId
            ||
            String(guest.eventId)
            ===
            String(eventId)
          )
        );

      });


  return jsonResponse({
    success: true,
    guests
  });
}


/* =========================================================
   GUARDAR RSVP
========================================================= */

function saveRsvp(data) {

  const sheet =
    getSpreadsheet()
      .getSheetByName(
        CONFIG.sheets.guests
      );

  if (!sheet) {
    throw new Error(
      "No existe la hoja Invitados."
    );
  }

  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];

  const index =
    getHeaderIndexes(headers);


  data.guests.forEach(guest => {

    const row =
      Number(guest.row);

    if (!row || row < 2) {
      return;
    }


    if (
      index.status >= 0
    ) {

      sheet
        .getRange(
          row,
          index.status + 1
        )
        .setValue(
          guest.status
        );

    }


    if (
      index.dietaryRestriction >= 0
    ) {

      sheet
        .getRange(
          row,
          index.dietaryRestriction + 1
        )
        .setValue(
          guest.dietaryRestriction
          ||
          ""
        );

    }


    if (
      index.dietaryDetail >= 0
    ) {

      sheet
        .getRange(
          row,
          index.dietaryDetail + 1
        )
        .setValue(
          guest.dietaryDetail
          ||
          ""
        );

    }


    if (
      index.comment >= 0
    ) {

      sheet
        .getRange(
          row,
          index.comment + 1
        )
        .setValue(
          data.comment
          ||
          ""
        );

    }


    if (
      index.updatedAt >= 0
    ) {

      sheet
        .getRange(
          row,
          index.updatedAt + 1
        )
        .setValue(
          new Date()
        );

    }

  });


  return jsonResponse({
    success: true,
    message:
      "Confirmación guardada correctamente."
  });
}


/* =========================================================
   GUARDAR CANCIÓN
========================================================= */

function saveSong(data) {

  const sheet =
    getSpreadsheet()
      .getSheetByName(
        CONFIG.sheets.playlist
      );

  if (!sheet) {
    throw new Error(
      "No existe la hoja Playlist."
    );
  }


  sheet.appendRow([
    new Date(),
    data.eventId || "",
    data.group || "",
    data.name || "",
    data.song || "",
    data.link || ""
  ]);


  return jsonResponse({
    success: true,
    message:
      "Canción guardada correctamente."
  });
}


/* =========================================================
   GOOGLE SHEET
========================================================= */

function getSpreadsheet() {

  return SpreadsheetApp.openById(
    CONFIG.spreadsheetId
  );

}


/* =========================================================
   ÍNDICES DE COLUMNAS
========================================================= */

function getHeaderIndexes(headers) {

  return {
    eventId:
      headers.indexOf("event_id"),

    group:
      headers.indexOf("grupo"),

    guestId:
      headers.indexOf("invitado_id"),

    name:
      headers.indexOf("nombre"),

    status:
      headers.indexOf("estado"),

    dietaryRestriction:
      headers.indexOf(
        "restriccion"
      ),

    dietaryDetail:
      headers.indexOf(
        "detalle_restriccion"
      ),

    comment:
      headers.indexOf(
        "comentario"
      ),

    updatedAt:
      headers.indexOf(
        "fecha_confirmacion"
      )
  };

}


/* =========================================================
   RESPUESTA JSON
========================================================= */

function jsonResponse(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui = readFileSync(new URL("../src/components/AdminPrototype.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../api/_lib/admin/guests.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260812100000_guest_check_in.sql", import.meta.url), "utf8");

test("el centro de pendientes conecta cada alerta con una acción", () => {
  for (const copy of ["Centro de pendientes", "Invitaciones sin enviar", "Respuestas pendientes", "Restricciones para revisar", "Preferencias de ubicación"]) assert.match(ui, new RegExp(copy));
  assert.match(ui, /onNavigate\(task\.view\)/);
});

test("el check-in busca datos operativos y muestra mesa y asiento", () => {
  assert.match(ui, /guest\.name, guest\.group, guest\.phone, guest\.identificationNumber/);
  assert.match(ui, /table\.guests\.includes\(guest\.id\)/);
  assert.match(ui, /table\?\.seatAssignments\?\.\[guest\.id\]/);
  assert.match(ui, /Buscar por nombre, grupo, teléfono o documento/);
});

test("las llegadas individuales y masivas persisten y se pueden deshacer", () => {
  for (const action of ["check-in", "undo-check-in", "bulk-check-in", "bulk-undo-check-in"]) assert.match(api, new RegExp(`\\"${action}\\"`));
  assert.match(api, /checked_in_at: checkedInAt/);
  assert.match(migration, /add column if not exists checked_in_at timestamptz/);
  assert.match(ui, /Marcar presentes/);
  assert.match(ui, /Deshacer llegada/);
});

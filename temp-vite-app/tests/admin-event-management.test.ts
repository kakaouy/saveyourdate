import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../src/components/AdminPrototype.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/admin-prototype.css", import.meta.url), "utf8");
const settings = readFileSync(new URL("../api/_lib/admin/settings.ts", import.meta.url), "utf8");

test("event identity opens one editor from the sidebar and top bar", () => {
  assert.match(component, /className="event-switcher-details"/);
  assert.match(component, /className="admin-user" onClick=\{\(\) => setEventManagerOpen\(true\)\}/);
  assert.match(component, /function EventManagerModal/);
  assert.match(component, /events\.length > 1/);
  assert.match(component, /onSwitch\(event\.target\.value\)/);
});

test("event editor persists the management fields", () => {
  for (const field of ["eventName", "eventDate", "eventType", "expirationDate", "eventVenue", "associatedEmails"]) {
    assert.match(settings, new RegExp(field));
  }
  assert.match(settings, /body\.action === 'event-details'/);
  assert.match(settings, /event\.details_updated/);
});

test("communications explain manual WhatsApp and missing numbers", () => {
  assert.match(component, /communications-first-guide/);
  assert.match(component, /WhatsApp Web con el destinatario y el mensaje preparados/);
  assert.match(component, /whatsapp-missing context-tip/);
  assert.match(styles, /\.communications-first-guide/);
  assert.match(styles, /\.whatsapp-missing/);
});

test("sidebar copy is larger while keeping compact navigation", () => {
  assert.match(styles, /admin-shell:is\(\.font-small,\.font-comfortable\) \.sidebar nav button \{[\s\S]*?min-height: 33px;[\s\S]*?font-size: 12px;/);
});

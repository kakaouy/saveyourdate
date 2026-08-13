import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuroraBuilderDocument } from '../src/components/aurora/builder.ts';
import { validateInvitationForReview } from '../src/domain/invitation-validation.ts';

test('Aurora predeterminada tiene los datos necesarios para revisión', () => {
  assert.deepEqual(validateInvitationForReview(createAuroraBuilderDocument()), []);
});

test('detecta secciones activas sin los datos que necesitan', () => {
  const document = createAuroraBuilderDocument();
  document.sections = document.sections.map((section) => section.id === 'gallery' ? { ...section, enabled: true } : section);
  document.content = {
    ...document.content,
    gallery: [],
    links: { ...(document.content.links as object), instagram: '' },
    qrPass: { value: '' }
  };
  const fields = validateInvitationForReview(document).map(({ field }) => field);
  assert.ok(fields.includes('gallery'));
  assert.ok(fields.includes('instagram'));
  assert.ok(fields.includes('qr-pass'));
});

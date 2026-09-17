import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeDiploma} from '../api/_lib/detectives/diploma.mjs';

test('Diploma: PDF A4 horizontal válido con alias acentuado, largo y caracteres no admitidos',async()=>{
 for(const agent of ['Federica','Ángela María de los Ángeles Fernández Rodríguez','🕵️']) {
  const bytes=await makeDiploma({agent,hints:{1:2,2:2},completedAt:'2026-09-18T01:30:00Z'});
  const pdf=await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),1);
  assert.equal(pdf.getPages()[0].getWidth(),841.89);
  assert.equal(pdf.getPages()[0].getHeight(),595.28);
  assert.ok(pdf.getTitle()?.includes(agent==='🕵️'?'Agente F':agent));
  assert.equal(pdf.getAuthor(),'Agencia F');
 }
});

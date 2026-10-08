import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readFile } from 'node:fs/promises';

/** Comunicado final oficial, personalizado con el nombre de la partida. */
export async function makeDiploma(state) {
  const pdf=await PDFDocument.create();
  const page=pdf.addPage([595.28,841.89]);
  const bold=await pdf.embedFont(StandardFonts.CourierBold);
  const artwork=await pdf.embedJpg(await readFile(new URL('../../../public/los-archivos-f/images/diploma-comunicado-final.jpg',import.meta.url)));
  const alias=state.agent.replace(/[^\x20-\x7E\xA0-\xFF]/g,'').trim() || 'Agente F';
  const width=595.28;
  const height=width*artwork.height/artwork.width;
  const y=(841.89-height)/2;
  page.drawImage(artwork,{x:0,y,width,height});
  const maxWidth=315;
  const size=Math.min(19,maxWidth/Math.max(1,bold.widthOfTextAtSize(alias,1)));
  page.drawText(alias,{x:192,y:y+height*.607,size,font:bold,color:rgb(.04,.05,.05)});
  pdf.setTitle(`Diploma de ${alias} - Agencia F`);
  pdf.setAuthor('Agencia F');
  pdf.setSubject('Archivo F-01 resuelto');
  return pdf.save();
}

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { template } from './diploma-background.mjs';
/** @param {{agent:string,hints:Record<number,number>,completedAt:string|null}} state */
export async function makeDiploma(state) {
  const pdf=await PDFDocument.load(template);
  const page=pdf.getPages()[0], width=page.getWidth();
  const serif=await pdf.embedFont(StandardFonts.TimesRoman);
  const sans=await pdf.embedFont(StandardFonts.Helvetica);
  const hints=Object.values(state.hints).reduce((a,b)=>a+b,0);
  const rank=hints<=1?'Detective del Faro':hints<=3?'Especialista en Evidencias':'Agente de Investigación';
  const center=(text,y,size,font,color=rgb(.06,.17,.22))=>page.drawText(text,{x:(width-font.widthOfTextAtSize(text,size))/2,y,size,font,color});
  const alias=state.agent.replace(/[^\x20-\x7E\xA0-\xFF]/g,'').trim() || 'Agente F';
  const nameSize=Math.min(38,540/Math.max(1,serif.widthOfTextAtSize(alias,1)));
  center(alias,350,nameSize,serif);
  center(rank,198,22,serif,rgb(.63,.18,.24));
  center(`${hints} ${hints===1?'pista utilizada':'pistas utilizadas'} · Investigación completada`,177,10,sans);
  const date=new Date(state.completedAt||new Date()).toLocaleDateString('es-UY',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'America/Montevideo'});
  page.drawText(date,{x:198-sans.widthOfTextAtSize(date,12)/2,y:134,size:12,font:sans,color:rgb(.06,.17,.22)});
  pdf.setTitle(`Diploma de ${alias} - Agencia F`);pdf.setAuthor('Agencia F');pdf.setSubject('Archivo F-01 resuelto');
  return pdf.save();
}

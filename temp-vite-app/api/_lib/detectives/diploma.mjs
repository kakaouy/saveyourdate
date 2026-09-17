import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

/** Diploma vectorial: texto personalizable y sellos originales, sin imágenes de stock. */
export async function makeDiploma(state) {
  const pdf=await PDFDocument.create();
  const page=pdf.addPage([841.89,595.28]);
  const serif=await pdf.embedFont(StandardFonts.TimesRoman);
  const bold=await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic=await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const mono=await pdf.embedFont(StandardFonts.Courier);
  const monoBold=await pdf.embedFont(StandardFonts.CourierBold);
  const paper=rgb(.95,.91,.81), ink=rgb(.08,.18,.20), gold=rgb(.62,.48,.27), red=rgb(.59,.13,.16);
  const hints=Object.values(state.hints).reduce((a,b)=>a+b,0);
  const rank=hints<=1?'Detective del Faro':hints<=3?'Especialista en Evidencias':'Agente de Investigación';
  const alias=state.agent.replace(/[^\x20-\x7E\xA0-\xFF]/g,'').trim() || 'Agente F';
  const text=(s,x,y,size=10,font=mono,color=ink)=>page.drawText(s,{x,y,size,font,color});
  const center=(s,cx,y,size,font=serif,color=ink)=>text(s,cx-font.widthOfTextAtSize(s,size)/2,y,size,font,color);
  const line=(x,y,x2,y2,color=gold,thickness=.7)=>page.drawLine({start:{x,y},end:{x:x2,y:y2},color,thickness});
  const rect=(x,y,width,height,color,borderColor,borderWidth=0)=>page.drawRectangle({x,y,width,height,color,borderColor,borderWidth});
  let seed=1101;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  rect(0,0,841.89,595.28,paper);
  // Subtle grain and inset frame retain contrast on a home printer.
  for(let i=0;i<1000;i++) page.drawCircle({x:random()*842,y:random()*595,size:.15+random()*.7,color:gold,opacity:.08});
  rect(22,22,797.89,551.28,undefined,gold,1.5);
  rect(28,28,785.89,539.28,undefined,ink,.55);
  for(const x of [34,807.89]) for(const y of [34,561.28]) {
    page.drawCircle({x,y,size:3,color:gold});line(x-2,y,x+2,y,ink,.5);
  }
  text('EXPEDIENTE F-01',49,537,9,monoBold);
  text('ESTADO: RESUELTO',49,522,8,mono,red);
  text('EDICIÓN ESPECIAL',642,537,8,monoBold);
  text('11 AÑOS DE FEDE',642,522,8,mono);
  center('LOS ARCHIVOS F',421,519,28,bold);
  center('A G E N C I A   D E   I N V E S T I G A C I Ó N',421,500,8,mono);
  line(49,484,793,484);
  center('DIPLOMA DE RECONOCIMIENTO',351,450,12,monoBold);
  center('Se reconoce la labor del agente o equipo',351,422,13,italic);
  const nameSize=Math.min(36,530/Math.max(1,bold.widthOfTextAtSize(alias,1)));
  center(alias,351,377,nameSize,bold);
  line(83,365,619,365);
  center('Por observar con atención, comparar las pruebas y seguir',351,342,13,serif);
  center('cada pista hasta reconstruir y resolver el caso',351,323,13,serif);
  center('EL ROBO DEL RUBÍ DEL FARO',351,291,18,bold,red);
  center(rank,351,259,18,italic);
  center(`${hints} ${hints===1?'pista consultada':'pistas consultadas'} · Investigación completada`,351,241,9,mono);
  // A worn circular ink stamp, drawn specifically for this game.
  const sx=715, sy=378, radius=67;
  for(let i=0;i<48;i++) {
    const a=i*Math.PI*2/48;
    line(sx+Math.cos(a)*radius,sy+Math.sin(a)*radius,sx+Math.cos(a)*(radius+5),sy+Math.sin(a)*(radius+5),red,3);
  }
  for(const r of [65,59,38]) page.drawCircle({x:sx,y:sy,size:r,borderColor:red,borderWidth:r===59?1.1:2.5});
  const arc=(label,start,end,r)=>{
    for(let i=0;i<label.length;i++) {
      const angle=(start+(end-start)*i/(label.length-1))*Math.PI/180;
      const ch=label[i],size=10;
      const x=sx+r*Math.cos(angle),y=sy+r*Math.sin(angle);
      page.drawText(ch,{x:x-monoBold.widthOfTextAtSize(ch,size)/2,y:y-3,size,font:monoBold,color:red,rotate:degrees(angle*180/Math.PI-90)});
    }
  };
  arc('CASO CERRADO',155,25,49);
  center('AGENCIA F',sx,sy-51,8,monoBold,red);
  const points=Array.from({length:10},(_,i)=>{
    const a=Math.PI/2+i*Math.PI/5,r=i%2===0?22:10;
    return [Math.cos(a)*r,-Math.sin(a)*r];
  });
  page.drawSvgPath(points.map(([x,y],i)=>`${i?'L':'M'} ${x} ${y}`).join(' ')+' Z',{x:sx,y:sy,color:red});
  for(let i=0;i<110;i++) {
    const a=random()*Math.PI*2,r=34+random()*33;
    page.drawCircle({x:sx+Math.cos(a)*r,y:sy+Math.sin(a)*r,size:.3+random()*.8,color:paper});
  }
  // Evidence ledger uses only objects and findings that exist in the game.
  rect(49,137,744,77,rgb(.91,.86,.75),gold,.7);
  text('REGISTRO DE LA INVESTIGACIÓN',64,194,9,monoBold);
  text('HORA Y RECORRIDO',64,175,8,monoBold);text('Apagón reconstruido y corredor identificado',223,175,8,mono);
  text('MÉTODO',64,160,8,monoBold);text('Sustitución por una réplica comprobada',223,160,8,mono);
  text('ESTADO DEL RUBÍ',64,145,8,monoBold);text('Original recuperado del compartimento LF-04',223,145,8,mono);
  page.drawRectangle({x:620,y:151,width:156,height:40,borderColor:ink,borderWidth:1.8,rotate:degrees(5)});
  page.drawText('RESOLUCIÓN',{x:637,y:172,size:10,font:monoBold,color:ink,rotate:degrees(5)});
  page.drawText('VALIDADA',{x:646,y:157,size:10,font:monoBold,color:ink,rotate:degrees(5)});
  const date=new Date(state.completedAt||new Date()).toLocaleDateString('es-UY',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'America/Montevideo'});
  line(65,83,235,83);line(337,83,507,83);line(610,83,777,83);
  center(date,150,93,12,monoBold);
  center('Federica',422,93,20,italic);
  center('ARCHIVO F-01',693,93,11,monoBold);
  center('FECHA DE CIERRE',150,68,8,mono);
  center('AGENTE A CARGO · AGENCIA F',422,68,8,mono);
  center('MISIÓN COMPLETADA',693,68,8,mono);
  center('Una aventura especial por los 11 años de Fede.',421,44,10,italic);
  pdf.setTitle(`Diploma de ${alias} - Agencia F`);pdf.setAuthor('Agencia F');pdf.setSubject('Archivo F-01 resuelto');
  return pdf.save();
}

from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor,white
from reportlab.lib.units import mm
from generar_senales_y_plano import page,text,lines,TEAL,INK,RED,MUTED
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'output/evidencias-para-imprimir/08-acusacion-y-cierre';OUT.mkdir(parents=True,exist_ok=True)
W,H=A4

def start(c,title,code):page(c,title,code,W,H)
def writing(c,y,title,prompt,height=121):
 c.setStrokeColor(HexColor('#b9ae97'));c.setLineWidth(.7);c.rect(42,y-height,511,height)
 text(c,55,y-22,title,13,'Courier-Bold',TEAL)
 text(c,55,y-43,prompt,9)
 for dy in [66,88,110]:c.line(55,y-dy,540,y-dy)
 return y-height-17

def make():
 c=canvas.Canvas(str(OUT/'acusacion-final-y-premio-v1.pdf'));c.setTitle('Los Archivos F - Acusación final y premio')
 start(c,'RECONSTRUCCIÓN DEL CASO','K-01 / ACUSACIÓN FINAL')
 text(c,42,H-126,'Agente o equipo: ______________________________________',11)
 lines(c,42,H-154,'Reuní tus conclusiones. Explicá cada respuesta con una prueba del expediente antes de presentar la acusación en el sitio.',511,10,lead=15)
 y=H-206
 y=writing(c,y,'01 / ¿QUIÉN RETIRÓ EL RUBÍ?','Nombre y evidencias que apoyan tu conclusión.')
 y=writing(c,y,'02 / ¿CÓMO LO HIZO?','Reconstruí los pasos y vinculalos con los documentos.')
 y=writing(c,y,'03 / ¿DÓNDE ESTÁ EL ORIGINAL?','Lugar preciso y pistas que te llevaron hasta él.')
 text(c,42,y-9,'ANTES DE PRESENTAR',10,'Courier-Bold',TEAL)
 for i,t in enumerate(['Distinguimos lo que alguien dijo de lo que las pruebas demuestran.','La explicación conecta quién, cómo y dónde.','Revisamos las dudas antes de acusar.']):
  yy=y-32-i*22;c.setStrokeColor(INK);c.rect(42,yy-1,9,9);text(c,59,yy,t,9)
 text(c,42,78,'Presentá tus respuestas en el sitio cuando el nivel esté habilitado.',9)
 c.showPage()
 start(c,'PAQUETE DE CIERRE','ETIQUETA Y TARJETA')
 x,y,w,h=70,480,160*mm,75*mm
 c.setFillColor(TEAL);c.rect(x,y,w,h,fill=1,stroke=0);c.setStrokeColor(HexColor('#d2b471'));c.rect(x+9,y+9,w-18,h-18)
 text(c,x+w/2,y+h-34,'LOS ARCHIVOS F',20,'Courier-Bold',white,'center')
 text(c,x+w/2,y+h-62,'MISIÓN ESPECIAL / 11 AÑOS DE FEDE',10,'Courier-Bold',HexColor('#d2b471'),'center')
 text(c,x+w/2,y+98,'RÉPLICA CONMEMORATIVA',16,'Courier-Bold',white,'center')
 text(c,x+w/2,y+70,'ARCHIVO F-01',11,'Courier-Bold',white,'center')
 text(c,x+w/2,y+39,'ABRIR ÚNICAMENTE DESPUÉS',12,'Courier-Bold',white,'center')
 text(c,x+w/2,y+22,'DE CERRAR EL CASO EN EL SITIO',12,'Courier-Bold',white,'center')
 text(c,x,455,'Recortar y pegar en el paquete de la gema de recuerdo.',9)
 x,y,w,h=70,175,160*mm,78*mm
 c.setStrokeColor(TEAL);c.setLineWidth(1);c.rect(x,y,w,h);c.rect(x+6,y+6,w-12,h-12)
 text(c,x+w/2,y+h-34,'MISIÓN CUMPLIDA',22,'Courier-Bold',TEAL,'center')
 text(c,x+18,y+h-64,'Evidencia recuperada por el agente o equipo:',10)
 c.setStrokeColor(MUTED);c.line(x+18,y+h-94,x+w-18,y+h-94)
 lines(c,x+18,y+h-123,'Esta gema de recuerdo celebra tu investigación. Observaste, comparaste y seguiste las pistas hasta reconstruir el caso.',w-36,11,lead=17)
 text(c,x+18,y+24,'Gracias por ser parte de la Agencia F. - Fede',10,'Courier-Bold',TEAL)
 text(c,x,148,'Guardar esta tarjeta dentro del paquete, junto a la gema.',9)
 c.showPage();c.save()
 g=canvas.Canvas(str(OUT/'guia-privada-acusacion-y-cierre.pdf'));start(g,'CIERRE DE LA INVESTIGACIÓN','SOLO ORGANIZACIÓN')
 y=H-128
 for title,body in [
 ('HOJA K-01','Entregar después de resolver el compartimento. Sirve para ordenar la reconstrucción; no incorpora un candado nuevo ni reemplaza el formulario del sitio.'),
 ('RESPUESTA COMPLETA','Quién: Martina Ríos. Cómo: aprovechó el apagón, utilizó el corredor de servicio y dejó una réplica. Dónde: en la base de la lente de Fresnel del taller.'),
 ('CADENA DE PRUEBAS','El reloj y el registro sitúan el apagón. La tarjeta de Martina contradice su declaración. El plano y el acetato muestran el corredor. El inventario y el informe confirman la copia. Las banderas conducen a la lente; el mecanismo permite abrir el compartimento.'),
 ('SI SE EQUIVOCAN','Volver a comparar declaraciones y documentos. Una contradicción por sí sola no demuestra el robo: la acusación debe conectar persona, método y escondite. Presentar las tres respuestas en el sitio para validar el cierre.'),
 ('PREMIO FÍSICO','Preparar una gema de recuerdo por familia, en una bolsita o caja separada del sobre negro. Pegar la etiqueta exterior y guardar dentro la tarjeta de misión cumplida. Abrir solo cuando la pantalla indique CASO CERRADO.'),
 ('DIPLOMA','Al completar la acusación, el sitio permite descargar el diploma con el nombre o alias de la partida. La tarjeta impresa acompaña la gema; no reemplaza ese diploma.'),
 ('IMPRESIÓN','Una hoja K-01 y una página de etiqueta y tarjeta por familia. Para veinte familias: veinte copias de cada página, veinte gemas y veinte paquetes. Papel común para K-01; cartulina para la tarjeta si se desea.'),
 ('ESTADO','Primera versión guardada localmente. No se modificó el sitio ni se publicó en GitHub. Revisar una impresión antes de preparar la tirada completa.')]:
  text(g,42,y,title,11,'Courier-Bold',TEAL);y=lines(g,42,y-20,body,511,10,lead=15)-21
 g.showPage();g.save()
 print(OUT)
if __name__=='__main__':make()

from pathlib import Path
import random,math
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor,Color,white
from reportlab.lib.units import mm
from generar_senales_y_plano import page,text,lines,INK,TEAL,RED,MUTED,PAPER
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'output/evidencias-para-imprimir/05-el-taller';OUT.mkdir(parents=True,exist_ok=True)
W,H=A4
SECRET=['PRUEBA R-17 TERMINADA.','LA COPIA PESA 12 G MENOS','QUE EL ORIGINAL.','AJUSTAR PIGMENTO ANTES','DE LA EXHIBICIÓN.']
def start(c,title,code):page(c,title,code,W,H)
def mask(c,x,y,w,h,variant=1,test=False):
 # White substrate: red-light transmission suppresses the red layer.
 c.setFillColor(white);c.rect(x,y,w,h,fill=1,stroke=0)
 c.saveState();p=c.beginPath();p.rect(x,y,w,h);c.clipPath(p,stroke=0)
 cyan=['#b4e0df','#91cfd8','#70bdcc'][variant]
 textlines=['PRUEBA DE LECTURA','CÓDIGO 27'] if test else SECRET
 size=15 if test else 17;step=32 if test else 39
 first=y+h-42 if test else y+h-57
 for i,s in enumerate(textlines):text(c,x+18,first-i*step,s,size,'Courier-Bold',HexColor(cyan))
 rng=random.Random(55)
 # Dense red letterforms reduce direct recognition of the cyan message.
 c.setFillAlpha(.65)
 for yy in range(int(y+8),int(y+h),18):
  letters=''.join(rng.choice('RCMTHX028654') for _ in range(48))
  text(c,x+4,yy,letters,16,'Courier',HexColor('#ff685c'))
 c.setFillAlpha(1)
 # Red rosettes and broken loops cover the block consistently without adding false clues.
 c.setStrokeColor(HexColor('#ff6655'));c.setLineWidth(.65)
 for yy in range(int(y+4),int(y+h),8):
  p=c.beginPath();p.moveTo(x,yy)
  for xx in range(int(x),int(x+w)+1,3):p.lineTo(xx,yy+6*math.sin((xx-x)/10+yy))
  c.drawPath(p)
 for i in range(int(w*h/700)):
  c.circle(rng.uniform(x,x+w),rng.uniform(y,y+h),rng.uniform(4,12),fill=0,stroke=1)
 scraps=['20.4 C / HUMEDAD 47 %','CONTROL DE SUPERFICIE','LIMPIEZA / MESA 3','VITRINA SELLADA / 430 LUX']
 for i,yy in enumerate(range(int(y+12),int(y+h),26)):
  text(c,x+8,yy,(scraps[i%4]+' / ')*3,10,'Courier',HexColor('#ff8470'))
 c.restoreState()
def make():
 c=canvas.Canvas(str(OUT/'evidencias-taller-v1.pdf'));c.setTitle('Los Archivos F - Evidencias del taller')
 start(c,'MOVIMIENTOS DE MATERIAL','F-01')
 text(c,42,H-125,'TALLER DE RESTAURACIÓN',13,'Courier-Bold',TEAL)
 text(c,42,H-151,'Responsable del sector: M. Ríos',10)
 text(c,42,H-171,'Registro interno / Jornada de la exhibición',9,col=MUTED)
 cols=[42,103,343,404,553];top=H-209
 c.setFillColor(TEAL);c.rect(42,top-28,511,28,fill=1,stroke=0)
 for x,t in zip(cols,['CÓD.','DESCRIPCIÓN DECLARADA','CANT.','ESTADO']):text(c,x+7,top-18,t,9,'Courier-Bold',white)
 rows=[('R-15','Resina óptica transparente','240 g','Utilizada'),('R-16','Pigmento mineral rojo','18 g','Utilizado'),('R-17','Molde de conservación temporal','1','Devuelto'),('R-18','Base acrílica de exhibición','1','En depósito'),('L-04','Adhesivo reversible','60 ml','Disponible')]
 for i,row in enumerate(rows):
  y=top-28-(i+1)*58;c.setStrokeColor(HexColor('#c6baa0'));c.setLineWidth(.5);c.rect(42,y,511,58)
  for x,val,width in zip(cols,row,[61,240,61,149]):lines(c,x+7,y+35,val,width-14,9,'Courier',13)
  if i<3:
   c.setStrokeColor(HexColor('#c09143'));c.setLineWidth(1.5);c.line(48,y+10,51,y+7);c.line(51,y+7,57,y+15)
 text(c,63,235,'Revisar luz de la mesa 3.',16,'Times-Italic',HexColor('#304e65'))
 c.setStrokeColor(TEAL);c.line(42,190,553,190)
 lines(c,42,166,'Control de existencias. Conservar junto a los informes de conservación del taller.',511,10)
 text(c,42,78,'Archivo técnico / Copia de consulta',9);c.showPage()
 start(c,'INFORME DE CONSERVACIÓN','H-01')
 text(c,42,H-126,'CONTROL DE SUPERFICIES Y MATERIALES',12,'Courier-Bold',TEAL)
 text(c,42,H-150,'Temperatura: 20,4 °C     Humedad relativa: 47 %',10)
 text(c,42,H-172,'Sector: taller / Vitrina de exhibición',10)
 text(c,42,H-202,'REGISTRO DE TRABAJO',10,'Courier-Bold')
 mask(c,42,295,511,325)
 c.setStrokeColor(TEAL);c.setLineWidth(.7);c.rect(42,295,511,325)
 text(c,42,266,'M. R.',12,'Times-Italic')
 lines(c,42,216,'La hoja conserva anotaciones superpuestas del control técnico. Mantener en el expediente del taller.',511,10)
 text(c,42,78,'H-01 / Documento recuperado',9);c.showPage()
 start(c,'INSTRUMENTO Y MUESTRA','FILTRO / M-12')
 text(c,42,H-126,'VISOR DE INSPECCIÓN',12,'Courier-Bold',TEAL)
 # 160 x 115 mm frame, with 136 x 87 mm aperture; permits moving across message.
 x,y,w,h=65,365,160*mm,115*mm
 c.setStrokeColor(INK);c.setLineWidth(1);c.rect(x,y,w,h)
 text(c,x+w/2,y+h-21,'AGENCIA F / FILTRO ÓPTICO',13,'Courier-Bold',TEAL,'center')
 c.setDash(3,3);c.rect(x+12*mm,y+14*mm,136*mm,87*mm);c.setDash()
 text(c,x+w/2,y+h/2,'VENTANA PARA FILTRO ROJO',11,'Courier-Bold',RED,'center')
 text(c,x+w/2,y+h/2-20,'Recortar y cubrir con lámina roja transparente',9,align='center')
 text(c,x+w/2,y+15,'Deslizá el visor sobre el registro de trabajo.',9,align='center')
 text(c,65,337,'Cortar el borde exterior y la ventana punteada.',9)
 text(c,65,318,'Pegar la lámina por detrás, cubriendo toda la abertura.',9)
 x,y,w,h=65,150,100*mm,42*mm;c.setStrokeColor(INK);c.rect(x,y,w,h)
 text(c,x+12,y+h-23,'EVIDENCIA M-12',16,'Courier-Bold',TEAL)
 text(c,x+12,y+h-44,'Origen: mesa de trabajo del taller.',9)
 text(c,x+12,y+h-65,'RESINA DE UTILERÍA',11,'Courier-Bold')
 text(c,x+12,y+27,'CONSERVAR SELLADA / NO ABRIR',10,'Courier-Bold',RED)
 text(c,x+12,y+12,'Material de ambientación.',8)
 text(c,65,122,'Recortar la etiqueta y pegar en la bolsita de muestra.',9)
 c.showPage();c.save()
 g=canvas.Canvas(str(OUT/'guia-privada-taller-y-calibracion.pdf'));start(g,'ARMADO DEL TALLER','SOLO ORGANIZACIÓN')
 y=H-130
 paragraphs=[
 ('SECUENCIA','Tras descubrir el corredor, entregar F-01, H-01, el visor rojo y la bolsita M-12. La web ya solicita estas cuatro piezas.'),
 ('DEDUCCIÓN ESPERADA','R-15 aporta resina, R-16 pigmento y R-17 un molde. La anotación oculta confirma una copia 12 g más liviana: fabricaron una réplica del rubí. No revela el escondite.'),
 ('PREPARAR EL VISOR','Imprimir la página 3 en cartulina. Recortar el marco y la ventana. Pegar detrás una lámina roja transparente. El visor se puede deslizar para leer todo el bloque.'),
 ('LA MUESTRA','Colocar cuentas pequeñas de color ámbar o arena decorativa de grano grueso en una bolsita cerrada. Pegar M-12. Es utilería: no hace falta abrirla ni pesarla. Los 12 g corresponden a la copia, no a la bolsa.'),
 ('CONTROL ANTES DE ARMAR 20 CARPETAS','Imprimir en color, calidad normal o alta, sin modo de ahorro. Probar la tira de la segunda página con el filtro real y luz blanca. El rojo debe aclararse y el texto cian oscurecerse. Si no funciona, ajustar el material del filtro o los colores antes de imprimir H-01.'),
 ('ESTADO','Prototipo local. Textos y composición revisados digitalmente. El efecto óptico aún requiere una prueba física con tu impresora y tu lámina roja.')]
 for title,body in paragraphs:
  text(g,42,y,title,10,'Courier-Bold',TEAL);y-=21;y=lines(g,42,y,body,511,10,lead=15)-24
 g.showPage();start(g,'PRUEBA DEL FILTRO ROJO','NO ENTREGAR')
 text(g,42,H-128,'Imprimir esta página antes del informe H-01.',10)
 for i,label in enumerate(['A / CIAN CLARO','B / VERSIÓN DEL INFORME','C / CIAN MÁS OSCURO']):
  y=H-190-i*175;text(g,42,y,label,10,'Courier-Bold',TEAL);mask(g,42,y-135,511,120,i,True)
 lines(g,42,95,'A través del filtro debe leerse: PRUEBA DE LECTURA / CÓDIGO 27. Compará también sin filtro: el mensaje no debería resultar evidente.',511,10)
 g.showPage();g.save();print(OUT)
if __name__=='__main__':make()

from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor,white
from reportlab.lib.units import mm
from generar_senales_y_plano import page,text,lines,TEAL,INK,RED,MUTED,PAPER
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'output/evidencias-para-imprimir/07-el-compartimento';OUT.mkdir(parents=True,exist_ok=True)
W,H=A4;X=65;Y=190;WIDTH=465;HALF=250;FOLD=Y+HALF;TOP=FOLD+HALF
COLS=[155,298,440];ROWS=[500,560,620]
GRID=[['7','3','8'],['2','6','4'],['9','0','5']]
TARGETS=[(155,500,'7'),(298,620,'0'),(440,560,'4')];WW,WH=38,42

def start(c,title,code):page(c,title,code,W,H)
def ruler(c,y=83):
 c.setStrokeColor(INK);c.setLineWidth(.7);c.line(65,y,65+50*mm,y)
 for x in [65,65+50*mm]:c.line(x,y-3,x,y+3)
 text(c,65+25*mm,y+10,'CONTROL: 50 mm',8,align='center')
 text(c,W-65,y,'Imprimir al 100 % / Una cara',9,align='right')
def digits(c):
 for i,y in enumerate(ROWS):
  for j,x in enumerate(COLS):text(c,x,y-9,GRID[i][j],28,'Courier-Bold',INK,'center')
def draw_mechanism(c):
 c.setFillColor(white);c.rect(X,Y,WIDTH,2*HALF,fill=1,stroke=0)
 c.setStrokeColor(INK);c.setLineWidth(1.2);c.rect(X,Y,WIDTH,2*HALF)
 text(c,X+WIDTH/2,TOP-22,'LF-04 / BASE DEL COMPARTIMENTO',12,'Courier-Bold',TEAL,'center')
 digits(c)
 c.setStrokeColor(TEAL);c.setLineWidth(1);c.setDash(5,4);c.line(X,FOLD,X+WIDTH,FOLD);c.setDash()
 text(c,X+WIDTH/2,FOLD+12,'PLEGAR SOLO POR ESTA LÍNEA',8,'Courier-Bold',TEAL,'center')
 for x,yt,n in TARGETS:
  y=2*FOLD-yt;c.setStrokeColor(INK);c.setLineWidth(1);c.rect(x-WW/2,y-WH/2,WW,WH)
  text(c,x,y-3,'CORTAR',7,'Courier-Bold',MUTED,'center')
 text(c,X+WIDTH/2,Y+18,'SOLAPA / DOBLAR HACIA ARRIBA',10,'Courier-Bold',TEAL,'center')

def folded(c):
 # Geometrically reflect the real flap and its apertures across the fold.
 c.setFillColor(white);c.rect(X,FOLD,WIDTH,HALF,fill=1,stroke=0)
 c.setStrokeColor(INK);c.rect(X,FOLD,WIDTH,HALF)
 for x,yt,n in TARGETS:
  original=2*FOLD-yt;actual=2*FOLD-original
  c.rect(x-WW/2,actual-WH/2,WW,WH);text(c,x,actual-9,n,28,'Courier-Bold',INK,'center')
 text(c,298,FOLD-25,'LEER DE IZQUIERDA A DERECHA',11,'Courier-Bold',TEAL,'center')
def make():
 c=canvas.Canvas(str(OUT/'sobre-negro-y-mecanismo-v1.pdf'));c.setTitle('Los Archivos F - Sobre negro y compartimento LF-04')
 start(c,'EL COMPARTIMENTO','J-01 / LF-04')
 lines(c,42,H-124,'Con la pieza recortada, doblá la solapa hacia arriba. Alineá los bordes y leé las ventanas de izquierda a derecha.',511,10,lead=15)
 draw_mechanism(c)
 text(c,65,163,'Línea continua: corte. Línea punteada: pliegue.',10)
 text(c,65,143,'Ingresá la combinación en el nivel 7 del sitio.',10)
 ruler(c);c.showPage()
 start(c,'ETIQUETA DEL SOBRE','J-00 / ACCESO RESTRINGIDO')
 x,y,w,h=90,415,145*mm,78*mm
 c.setFillColor(TEAL);c.rect(x,y,w,h,fill=1,stroke=0)
 c.setStrokeColor(HexColor('#d6bd83'));c.setLineWidth(1);c.rect(x+10,y+10,w-20,h-20)
 text(c,x+w/2,y+h-37,'AGENCIA F / ARCHIVO F-01',12,'Courier-Bold',white,'center')
 text(c,x+w/2,y+h-76,'EVIDENCIA RESTRINGIDA',20,'Courier-Bold',white,'center')
 text(c,x+w/2,y+h-107,'COMPARTIMENTO LF-04',13,'Courier-Bold',HexColor('#d6bd83'),'center')
 text(c,x+w/2,y+71,'NO ABRIR HASTA RECIBIR',13,'Courier-Bold',white,'center')
 text(c,x+w/2,y+49,'AUTORIZACIÓN DE FEDE',13,'Courier-Bold',white,'center')
 text(c,x+w/2,y+23,'J-00 / CUSTODIA DEL MUSEO',9,'Courier',white,'center')
 text(c,90,389,'Recortar y pegar en el frente de un sobre negro.',9)
 text(c,90,349,'SELLO PARA LA SOLAPA DEL SOBRE',10,'Courier-Bold',TEAL)
 c.setFillColor(RED);c.circle(164,280,37,fill=1,stroke=0);c.setStrokeColor(white);c.circle(164,280,31)
 text(c,164,291,'AGENCIA',10,'Courier-Bold',white,'center');text(c,164,266,'F',27,'Courier-Bold',white,'center')
 lines(c,235,300,'Recortar el sello y fijarlo sobre el cierre con cinta o adhesivo.',270,10)
 text(c,90,190,'Contenido: una pieza plegable, ya recortada.',10)
 text(c,90,168,'Conservar el sobre cerrado durante la investigación.',9)
 c.showPage();c.save()
 g=canvas.Canvas(str(OUT/'guia-privada-compartimento.pdf'));start(g,'ARMADO DEL SOBRE NEGRO','SOLO ORGANIZACIÓN')
 y=H-130
 for title,body in [
 ('IMPRIMIR','Imprimir J-01 en papel opaco de 120 a 160 g/m², a una cara y al 100 %. La barra de control debe medir 50 mm. No usar impresión dúplex.'),
 ('RECORTAR','Recortar el rectángulo exterior y retirar por completo los tres rectángulos marcados CORTAR. No cortar la línea punteada. Entregar la pieza ya recortada.'),
 ('PROBAR','Doblar la mitad inferior hacia arriba por la línea punteada. Los laterales deben coincidir y el borde inferior original debe alcanzar el borde superior de la base. Queda visible el reverso blanco de la solapa, con tres ventanas.'),
 ('SOLUCIÓN','Leer de izquierda a derecha, aunque las ventanas estén a distintas alturas: 7, 0, 4. La web acepta 704. Esta prueba habilita la acusación final, no cierra el caso por sí sola.'),
 ('ENSOBRAR','Una vez comprobada, desdoblar la pieza y guardarla abierta en un sobre negro C4, para no entregar la combinación ya visible. Pegar J-00 en el frente y el sello F sobre el cierre.'),
 ('ENTREGA','Una pieza, una etiqueta y un sello por familia. Abrir únicamente cuando el nivel 6 conceda la autorización. No incluir esta guía en el sobre.'),
 ('CONTROL','La reflexión matemática de las ventanas sobre el pliegue coincide con los centros de 7, 0 y 4. Revisar el montaje con una copia real antes de preparar las veinte carpetas.')]:
  text(g,42,y,title,11,'Courier-Bold',TEAL);y=lines(g,42,y-22,body,511,10,lead=15)-24
 g.showPage();start(g,'COMPROBACIÓN DEL PLIEGUE','SOLUCIÓN / NO ENTREGAR')
 lines(g,42,H-128,'Así debe verse la pieza cerrada. Esta es una simulación geométrica; falta verificar el corte y el pliegue en papel.',511,10)
 folded(g)
 text(g,298,320,'7  -  0  -  4',25,'Courier-Bold',TEAL,'center')
 lines(g,65,253,'Si una cifra queda cortada, revisar la escala de impresión, el recorte de las ventanas y la posición del pliegue. No corregir la combinación escrita: corregir el encaje.',465,11)
 ruler(g);g.showPage();g.save()
 visible=[]
 for x,y,n in TARGETS:
  sy=2*FOLD-y;assert Y+WH/2<sy<FOLD-WH/2
  hits=[GRID[i][j] for i,yy in enumerate(ROWS) for j,xx in enumerate(COLS) if abs(xx-x)<WW/2 and abs(yy-(2*FOLD-sy))<WH/2]
  assert hits==[n];visible+=hits
 assert ''.join(visible)=='704';assert 2*FOLD-Y==TOP
 print('Validación geométrica: 3 ventanas, una cifra por ventana, lectura 704; bordes coincidentes.')
if __name__=='__main__':make()

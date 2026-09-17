from pathlib import Path
from math import hypot
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor,white
from generar_senales_y_plano import page,text,lines,TEAL,INK,MUTED
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'output/evidencias-para-imprimir/06-el-escondite';W,H=A4
BLUE=HexColor('#193b60');GOLD=HexColor('#e6bb4e');RED=HexColor('#b33838')
LETTERS=['A','E','I','L','M','N','O','R','S','T','U','V']
def flag(c,x,y,w,h,letter):
 c.saveState();c.translate(x,y);c.scale(w,h)
 def rect(x,y,w,h,col):c.setFillColor(col);c.rect(x,y,w,h,stroke=0,fill=1)
 def poly(points,col):
  c.setFillColor(col);p=c.beginPath();p.moveTo(*points[0])
  for a,b in points[1:]:p.lineTo(a,b)
  p.close();c.drawPath(p,stroke=0,fill=1)
 rect(0,0,1,1,white)
 if letter=='A':
  rect(0,0,1,1,BLUE);rect(.4,0,.2,1,white);rect(0,.4,1,.2,white)
 elif letter=='E':
  rect(0,0,1,1,TEAL);c.setFillColor(white);c.ellipse(.32,.23,.68,.77,stroke=0,fill=1)
 elif letter=='I':
  rect(0,0,.5,.5,BLUE);rect(.5,.5,.5,.5,BLUE)
 elif letter=='L':rect(0,0,.5,1,RED);rect(.5,0,.5,1,GOLD)
 elif letter=='M':rect(0,0,1,1,BLUE);poly([(0,0),(1,1),(1,0)],GOLD)
 elif letter=='N':rect(0,0,1,1,GOLD);rect(0,.38,1,.24,BLUE)
 elif letter=='O':poly([(.5,.85),(.16,.15),(.84,.15)],RED)
 elif letter=='R':rect(0,0,1,1,TEAL);poly([(0,0),(0,1),(1,0)],GOLD)
 elif letter=='S':rect(0,0,1,.33,BLUE);rect(0,.67,1,.33,BLUE)
 elif letter=='T':
  c.setFillColor(RED);c.ellipse(.32,.23,.68,.77,stroke=0,fill=1)
 elif letter=='U':rect(.15,.15,.7,.7,BLUE);rect(.3,.3,.4,.4,white)
 elif letter=='V':rect(0,0,1,1,RED);poly([(.5,.87),(.86,.5),(.5,.13),(.14,.5)],white)
 c.restoreState();c.setStrokeColor(INK);c.setLineWidth(.7);c.rect(x,y,w,h)
def start(c,t,code):page(c,t,code,W,H)
def arrow(c,a,b,col):
 dx,dy=b[0]-a[0],b[1]-a[1];length=hypot(dx,dy);ux,uy=dx/length,dy/length
 c.setStrokeColor(col);c.setLineWidth(.9);c.line(a[0],a[1],b[0],b[1]);p=c.beginPath();p.moveTo(*b);p.lineTo(b[0]-7*ux-3*uy,b[1]-7*uy+3*ux);p.lineTo(b[0]-7*ux+3*uy,b[1]-7*uy-3*ux);p.close();c.setFillColor(col);c.drawPath(p,stroke=0,fill=1)
def make():
 c=canvas.Canvas(str(OUT/'evidencias-escondite-v1.pdf'));c.setTitle('Los Archivos F - Banderas y objeto LF-04')
 start(c,'GUÍA DE BANDERAS','G-02 / DORSO DE G-01')
 text(c,42,H-128,'SEÑALES INTERNAS DEL MUSEO',12,'Courier-Bold',TEAL)
 lines(c,42,H-154,'Cada bandera representa una letra. Compará colores, formas y posición de los elementos.',511,11)
 for i,letter in enumerate(LETTERS):
  col,row=i%3,i//3;x=42+col*175;y=H-275-row*116
  flag(c,x+9,y,94,57,letter);text(c,x+132,y+17,letter,25,'Courier-Bold',TEAL,'center')
  c.setStrokeColor(HexColor('#c6baa0'));c.line(x,y-18,x+156,y-18)
 lines(c,42,137,'Una misma bandera siempre conserva su letra, aunque aparezca más de una vez.',511,10)
 text(c,42,80,'Conservar junto a la guía de señales luminosas.',9);c.showPage()
 start(c,'REGISTRO FOTOGRÁFICO','I-01 / OBJETO LF-04')
 text(c,42,H-112,'Taller de restauración / Pieza de demostración',10)
 centers=[(298,662),(506,512),(426,302),(170,302),(90,512)]
 # Documentary photograph and exact printed symbols are separate PDF elements.
 c.drawImage(str(OUT/'objeto-lf-04.png'),180,361,width=235,height=270,preserveAspectRatio=True,anchor='c',mask='auto')
 text(c,298,342,'OBJETO EDUCATIVO LF-04',9,'Courier-Bold',TEAL,'center')
 for (x,y),letter in zip(centers,'LENTE'):flag(c,x-32,y-20,64,40,letter)
 for a,b in zip(centers,centers[1:]+centers[:1]):
  dx,dy=b[0]-a[0],b[1]-a[1];ll=hypot(dx,dy);ux,uy=dx/ll,dy/ll
  arrow(c,(a[0]+48*ux,a[1]+48*uy),(b[0]-48*ux,b[1]-48*uy),MUTED)
 # White start arrow is external so the L symbol remains identical to the key.
 c.setFillColor(TEAL);c.roundRect(238,697,120,25,3,fill=1,stroke=0)
 text(c,252,705,'INICIO',10,'Courier-Bold',white);arrow(c,(333,715),(333,701),white)
 lines(c,42,211,'Empezá en la flecha blanca. Seguí las banderas en sentido horario y traducilas con la evidencia G-02.',511,11)
 for i in range(5):
  c.setStrokeColor(TEAL);c.rect(183+i*47,111,36,35)
 text(c,298,88,'Anotá las letras en el orden del recorrido.',9,align='center')
 c.showPage();c.save()
 g=canvas.Canvas(str(OUT/'guia-privada-escondite.pdf'));start(g,'ARMADO DEL ESCONDITE','SOLO ORGANIZACIÓN')
 y=H-130
 for title,body in [
 ('MATERIALES','G-02: clave con doce banderas. I-01: fotografía del objeto LF-04 con cinco banderas alrededor. Imprimir ambas páginas en color, a una cara.'),
 ('CÓMO ENTREGAR','Agregar G-02 detrás de la guía luminosa G-01 como dorso o segunda hoja. Incorporar I-01 al expediente cuando el sitio solicite investigar el escondite, tras la prueba del taller.'),
 ('LECTURA','La flecha blanca marca la bandera superior. Desde allí, seguir en sentido horario: L, E, N, T, E. La bandera de E se repite intencionalmente.'),
 ('RESOLUCIÓN','La palabra es LENTE. Se acepta en el nivel 6 del sitio y habilita el acceso al sobre negro. En esta etapa no se entrega la combinación del compartimento.'),
 ('CONTROL','Los símbolos se dibujan desde una única función: cada bandera de I-01 coincide con la de G-02. Verificar que círculos, franjas y colores se distingan en una copia impresa antes de armar veinte juegos.'),
 ('CONTINUIDAD','El objeto LF-04 tiene una base cerrada. La próxima evidencia será el mecanismo plegable de esa base, dentro del sobre negro. Su diseño deberá conservar esta identificación.'),
 ('ESTADO','Primera versión para revisión. Fotografía ilustrativa generada para el caso. Material local, sin publicar en GitHub ni modificar el sitio.')]:
  text(g,42,y,title,11,'Courier-Bold',TEAL);y=lines(g,42,y-22,body,511,10,lead=16)-25
 g.showPage();g.save()
 assert len(set(LETTERS))==12 and all(x in LETTERS for x in 'LENTE')
 assert 'LENTE'[1]=='LENTE'[4];print('Cinco banderas: L-E-N-T-E. Doce símbolos distintos en clave.')
if __name__=='__main__':make()

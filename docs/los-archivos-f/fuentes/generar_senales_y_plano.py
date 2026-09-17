from pathlib import Path
from math import atan2,cos,sin,pi
import random
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4,landscape
from reportlab.lib.colors import HexColor,Color,white
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/evidencias-para-imprimir/03-04-senales-y-plano';OUT.mkdir(parents=True,exist_ok=True)
INK=HexColor('#292b29');TEAL=HexColor('#254c50');RED=HexColor('#8c3530');PAPER=HexColor('#f4edda');MUTED=HexColor('#787a71')
W,H=landscape(A4)
def text(c,x,y,s,size=10,font='Courier',col=INK,align='left'):
 c.setFillColor(col);c.setFont(font,size)
 getattr(c,{'left':'drawString','center':'drawCentredString','right':'drawRightString'}[align])(x,y,s)
def lines(c,x,y,s,width,size=11,font='Courier',lead=17):
 line=''
 for word in s.split():
  trial=(line+' '+word).strip()
  if stringWidth(trial,font,size)>width:text(c,x,y,line,size,font);y-=lead;line=word
  else:line=trial
 if line:text(c,x,y,line,size,font);y-=lead
 return y
def page(c,title,code,w=W,h=H,transparent=False):
 c.setPageSize((w,h))
 if not transparent:
  c.setFillColor(PAPER);c.rect(0,0,w,h,fill=1,stroke=0)
  rng=random.Random(11)
  for _ in range(170):
   c.setFillColor(Color(.65,.55,.36,alpha=.055));c.circle(rng.uniform(18,w-18),rng.uniform(18,h-18),rng.uniform(.3,1.8),fill=1,stroke=0)
 c.setStrokeColor(INK);c.setLineWidth(.65);c.rect(22,22,w-44,h-44);c.rect(26,26,w-52,h-52)
 text(c,42,h-51,'AGENCIA F / ARCHIVO F-01',11,'Courier-Bold',TEAL)
 text(c,w-42,h-51,code,10,'Courier-Bold',TEAL,'right')
 text(c,42,h-82,title,23,'Courier-Bold')
 c.line(42,h-96,w-42,h-96)
 text(c,42,39,'MUSEO DEL FARO / DOCUMENTACIÓN RECUPERADA',8)
def ruler(c,y=69):
 c.setStrokeColor(INK);c.setLineWidth(.8);c.line(65,y,65+50*mm,y)
 for x in [65,65+50*mm]:c.line(x,y-3,x,y+3)
 text(c,65+25*mm,y+8,'CONTROL: 50 mm',8,align='center')
 text(c,W-65,y,'Imprimir al 100 % / Tamaño real',9,align='right')
def compass(c,x,y):
 c.setStrokeColor(TEAL);c.setLineWidth(1);c.circle(x,y,14);c.line(x,y-18,x,y+18);c.line(x-18,y,x+18,y)
 text(c,x,y+24,'N',10,'Courier-Bold',TEAL,'center')
def buoy(c,x,y):
 c.setStrokeColor(TEAL);c.setLineWidth(1.3);c.circle(x,y,5);c.line(x,y-9,x,y+9);c.line(x-8,y-7,x+8,y-7)
BUOYS=[(115,160),(450,220),(720,430)]
DIGITS=[(220,260,'4'),(380,300,'1'),(350,380,'8'),(170,390,'6'),(270,400,'2'),(420,400,'9'),(550,400,'3'),(650,400,'5'),(620,245,'7'),(515,200,'2'),(290,185,'9'),(190,165,'0')]
ROUTE=[(150,210),(220,260),(380,300),(350,380),(210,440)]
FRAG=(315,200,150,140)
def plan(c):
 rooms=[(65,355,235,115,['SALA DEL RUBÍ']),(300,355,190,115,['CAFETERÍA']),(490,355,285,115,['TERRAZA']), (65,130,190,150,['TALLER DE','RESTAURACIÓN']),(255,130,150,150,['DEPÓSITO']),(405,130,160,150,['SALA DEL','GENERADOR']),(565,130,210,150,['ESTUDIO DE','ENTREVISTAS']),(645,295,130,45,['BAÑOS'])]
 for x,y,w,h,labels in rooms:
  c.setStrokeColor(INK);c.setLineWidth(1.4);c.rect(x,y,w,h)
  for i,label in enumerate(labels):text(c,x+w/2,y+h-19-i*13,label,10,'Courier-Bold',INK,'center')
 # Public hallway doors; white-paper colored breaks are deliberately local to doors.
 for x,y in [(180,355),(390,355),(560,355),(145,280),(335,280),(475,280),(675,280)]:
  c.setStrokeColor(PAPER);c.setLineWidth(3);c.line(x-11,y,x+11,y)
  c.setStrokeColor(INK);c.setLineWidth(.6);c.line(x-11,y,x-11,y+20);c.arc(x-31,y-20,x+11,y+22,0,90)
 text(c,290,317,'GALERÍA PÚBLICA',10,'Courier-Bold',MUTED,'center')
 text(c,80,313,'ENTRADA >',9,'Courier-Bold')
 compass(c,735,385)
 for x,y in BUOYS:buoy(c,x,y)
 for x,y,n in DIGITS:text(c,x,y-5,n,16,'Courier-Bold',MUTED,'center')
def route(c):
 c.setStrokeColor(RED);c.setLineWidth(2)
 for a,b in zip(ROUTE,ROUTE[1:]):
  dx,dy=b[0]-a[0],b[1]-a[1];l=(dx*dx+dy*dy)**.5;ux,uy=dx/l,dy/l
  c.line(a[0]+15*ux,a[1]+15*uy,b[0]-15*ux,b[1]-15*uy)
  mx,my=(a[0]+b[0])/2,(a[1]+b[1])/2
  p=c.beginPath();p.moveTo(mx+5*ux,my+5*uy);p.lineTo(mx-4*ux-3*uy,my-4*uy+3*ux);p.lineTo(mx-4*ux+3*uy,my-4*uy-3*ux);p.close();c.setFillColor(RED);c.drawPath(p,fill=1,stroke=0)
 for x,y in ROUTE[1:-1]:c.circle(x,y,14,fill=0,stroke=1)
 text(c,ROUTE[0][0],ROUTE[0][1]-5,'INICIO',8,'Courier-Bold',RED,'center');text(c,ROUTE[-1][0],ROUTE[-1][1]-4,'FIN',8,'Courier-Bold',RED,'center')
 compass(c,735,385)
 for x,y in BUOYS:c.setStrokeColor(TEAL);c.circle(x,y,9,fill=0,stroke=1)

def card(c):
 w,h=A4;page(c,'GUÍA DE SEÑALES','EVIDENCIA G-01',w,h)
 text(c,42,h-120,'CÓDIGO LUMINOSO DEL MUSEO',12,'Courier-Bold',TEAL)
 lines(c,42,h-145,'Convención interna del faro. Cada grupo representa una letra. La pausa entre grupos se indica con una barra /.',w-84,11)
 codes={'A':'o-','E':'oo-','I':'oo','L':'-o-','M':'--','N':'-o','O':'---','R':'o-o','S':'ooo','T':'-','U':'oo--','V':'ooo-'}
 for i,(letter,code) in enumerate(codes.items()):
  col,row=i%2,i//2;x=42+col*263;y=560-row*62
  c.setStrokeColor(HexColor('#c6baa0'));c.line(x,y-21,x+245,y-21)
  text(c,x+10,y,letter,26,'Courier-Bold',TEAL)
  for j,s in enumerate(code):
   xx=x+80+j*35;c.setStrokeColor(INK);c.setLineWidth(2)
   if s=='o':c.circle(xx,y+8,5,fill=0,stroke=1)
   else:c.line(xx-10,y+8,xx+10,y+8)
 text(c,42,642,'o  Destello corto     -  Destello largo',11,'Courier-Bold')
 c.setStrokeColor(TEAL);c.line(42,170,w-42,170)
 lines(c,42,148,'Separá los grupos. Anotá una letra por grupo y leé el mensaje de izquierda a derecha.',w-84,11)
 text(c,42,78,'Conservá esta guía junto a los archivos del faro.',9)
 c.showPage()
def napkin(c):
 w,h=A4;page(c,'NOTA ENCONTRADA','S-01 / CAFETERÍA',w,h)
 x,y,side=70,255,455;c.setFillColor(HexColor('#fffdf5'));c.setStrokeColor(HexColor('#d2cbb8'));c.rect(x,y,side,side,fill=1,stroke=1)
 c.setDash(1,3);c.rect(x+12,y+12,side-24,side-24);c.setDash()
 c.setStrokeColor(HexColor('#ece8db'));c.line(x+side/2,y+14,x+side/2,y+side-14);c.line(x+14,y+side/2,x+side-14,y+side/2)
 for i,s in enumerate(['Los destellos no son una falla.','Separá las señales por sus pausas.','Buscá la vieja guía del faro.']):text(c,x+32,y+side-115-i*68,s,17,'Times-Italic',HexColor('#25425d'))
 text(c,x+32,y+54,'No pierdas este papel.',15,'Times-Italic',HexColor('#25425d'))
 lines(c,70,205,'Documento recuperado entre los papeles del museo.',455,10)
 c.showPage()

def main():
 c=canvas.Canvas(str(OUT/'evidencias-03-04-senales-plano-v1.pdf'));c.setTitle('Los Archivos F - Señales y corredor oculto')
 card(c);napkin(c)
 page(c,'PLANO PÚBLICO DEL MUSEO','C-01 / REVISIÓN 3');plan(c)
 x,y,w,h=FRAG;c.setFillColor(PAPER);c.rect(x,y,w,h,fill=1,stroke=0);c.setStrokeColor(MUTED);c.setDash(3,3);c.rect(x,y,w,h);c.setDash();text(c,x+w/2,y+h/2,'FRAGMENTO FALTANTE',8,'Courier',MUTED,'center');ruler(c);c.showPage()
 page(c,'FRAGMENTO RECUPERADO','C-02 / ARCHIVO DE OBRAS')
 c.saveState();clip=c.beginPath();clip.rect(*FRAG);c.clipPath(clip,stroke=0);plan(c);c.restoreState();c.setStrokeColor(INK);c.setDash(3,3);c.rect(*FRAG);c.setDash()
 text(c,W/2,165,'Recortá por el contorno y completá el plano.',11,align='center');ruler(c);c.showPage()
 c.setPageSize((W,H));route(c)
 text(c,65,105,'Hacé coincidir el norte y las tres boyas. Seguí las flechas desde INICIO.',10)
 ruler(c);c.showPage();c.save()
 # Independent assembly guide, spoilers never mixed with player sheets.
 g=canvas.Canvas(str(OUT/'guia-privada-armado-03-04.pdf'));page(g,'GUÍA DE ARMADO','SOLO ORGANIZACIÓN')
 y=H-127
 for s in ['1. Imprimir las páginas 1 a 4 del cuadernillo en papel, a una cara.','2. Página 1: guía de señales. Página 2: modelo de la servilleta.','   Podés reemplazar la página 2 por una servilleta real y copiar la nota a mano.','3. Plano y fragmento: tamaño real, 100 %, sin ajustar ni reducir.','   Recortar C-02 y guardarlo en un sobre: DOCUMENTACIÓN RECUPERADA.','4. Página 5: imprimir en transparencia compatible con tu impresora.','   Alternativa: calcar sobre acetato limpio con marcador permanente fino.','5. Las barras de control del plano, fragmento y acetato deben medir 50 mm.','6. Reunir G-01 y la servilleta con las evidencias. Reservar C-01, C-02 y C-03','   para cuando el sitio indique investigar el corredor.','7. Control: la señal digital se traduce T-A-L-L-E-R. El acetato, correctamente','   alineado sobre el plano completo, enmarca 4, 1 y 8 en ese orden.','8. G-01 es el frente luminoso de la guía. El dorso de banderas para el nivel 6','   se diseñará junto con la evidencia de la lente para que ambos coincidan.','9. Es un prototipo: probar una copia física antes de armar las 20 carpetas.']:
  text(g,45,y,s,10);y-=22
 text(g,45,86,'VERIFICADO DIGITALMENTE: símbolos únicos y geometría compartida.',9,'Courier-Bold',TEAL)
 g.showPage();g.save()
 # QA combined alignment, not for players.
 q=canvas.Canvas(str(ROOT/'tmp/pdfs/comprobacion-superposicion.pdf'),pagesize=(W,H));page(q,'COMPROBACIÓN DE ENCAJE','SOLO CONTROL');plan(q);route(q);q.showPage();q.save()
 codes={'A':'o-','E':'oo-','I':'oo','L':'-o-','M':'--','N':'-o','O':'---','R':'o-o','S':'ooo','T':'-','U':'oo--','V':'ooo-'}
 inv={v:k for k,v in codes.items()};assert len(inv)==12
 assert ''.join(inv[s] for s in ['-','o-','-o-','-o-','oo-','o-o'])=='TALLER'
 assert [n for x,y,n in DIGITS if (x,y) in ROUTE]==['4','1','8']
 assert all(sum((x-a)**2+(y-b)**2<14**2 for x,y,n in DIGITS)==1 for a,b in ROUTE[1:-1])
 print('Cifrados y ventanas: OK');print(OUT)
if __name__=='__main__':main()

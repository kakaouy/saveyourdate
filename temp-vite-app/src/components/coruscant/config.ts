import type { AuroraConfig, AuroraPaletteTokens } from '../aurora/config';

export type CoruscantPalette = 'rosa-salvia' | 'verde-dorado';
export const CORUSCANT_PALETTES:Record<CoruscantPalette,AuroraPaletteTokens>={
  'rosa-salvia':{fondo:'#fff9f7',alterno:'#eadfda',titulos:'#8f6670',secundario:'#f3e8df',acento:'#c19ca3',acentoOscuro:'#5f7667',texto:'#66585a',claro:'#fff',botones:'#9f6f7b',bordes:'#d7c0b7',ornamentos:'#90a18e',foco:'#69444d'},
  'verde-dorado':{fondo:'#f7f7f1',alterno:'#dfe7dc',titulos:'#2f5d50',secundario:'#f4ead2',acento:'#b9964a',acentoOscuro:'#264a40',texto:'#3f514b',claro:'#fff',botones:'#8b6c2d',bordes:'#d8c79e',ornamentos:'#78917f',foco:'#684f18'}
};

export const DEFAULT_CORUSCANT_CONFIG:AuroraConfig={
  event:{name:'Paz',dateTime:'2027-06-12T21:00:00-03:00',endDateTime:'2027-06-13T05:00:00-03:00',timezone:'America/Montevideo',venue:'Salón Eventos Premium',address:'Av. Principal 1234, Montevideo',calendarTitle:'Mis 15 años de Paz'},
  links:{maps:'https://maps.google.com/?q=Montevideo',photoUpload:'https://drive.google.com/',instagram:'https://instagram.com/'},content:{hashtag:'#Paz15Años'},
  gifts:{bank:'Banco de demostración',holder:'Familia de Paz',currency:'UYU',account:'0000000000',alias:'PAZ.QUINCE',visible:true},schedule:[],
  gallery:[1,2,4,5,6].map(n=>({src:`/coruscant/images/foto-0${n}.png`,alt:`Fotografía ${n} de Paz`})),hotels:[{name:'Hotel Central Plaza',address:'Centro, Montevideo',distance:'A 10 minutos del salón'}],qrPass:{value:'CORUSCANT-DEMO-GUEST'},
  assets:{hero:'/coruscant/images/lador_derecho_sup.png',heroPositionMobile:'right top',heroPositionDesktop:'right top',heroOverlay:0,parallax:'/coruscant/images/foto-03.png',ornamentTop:'/coruscant/images/lador_derecho_sup.png',ornamentBottom:'/coruscant/images/lado-izq-bottom.png',ornamentLeft:'/coruscant/images/separador_derecha.png',ornamentRight:'/coruscant/images/separador_derecha.png',navigationIcon:'/coruscant/images/navegar.png'},
  sections:{hero:true,dateStack:false,countdown:true,location:true,quote:true,dressCode:true,schedule:false,parallax:true,gallery:true,hotels:true,gifts:true,photoUpload:true,social:true,songSuggestions:true,qrPass:true,rsvp:true},
  tones:{countdown:'light',location:'accent',quote:'light',dressCode:'accent',parallax:'light',gallery:'light',hotels:'accentDark',gifts:'light',photoUpload:'accent',social:'accentDark',songSuggestions:'light',qrPass:'accent',rsvp:'light'},metadata:{private:true}
};


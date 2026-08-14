import type { AuroraConfig, AuroraPaletteTokens } from '../aurora/config';

export type CoruscantPalette = 'rosa-salvia' | 'lavanda-ciruela' | 'azul-polvo-champagne' | 'rosa-viejo-borgona' | 'petroleo-champagne';
export const CORUSCANT_PALETTES:Record<CoruscantPalette,AuroraPaletteTokens>={
  'rosa-salvia':{fondo:'#fff9f7',alterno:'#eadfda',titulos:'#8f6670',secundario:'#f3e8df',acento:'#c19ca3',acentoOscuro:'#5f7667',texto:'#66585a',claro:'#fff',botones:'#9f6f7b',bordes:'#d7c0b7',ornamentos:'#90a18e',foco:'#69444d'},
  'lavanda-ciruela':{fondo:'#fbf8fc',alterno:'#e8deec',titulos:'#674c6d',secundario:'#f0e8f2',acento:'#a98caf',acentoOscuro:'#543d59',texto:'#51474f',claro:'#fff',botones:'#806087',bordes:'#d4c3d8',ornamentos:'#b694bd',foco:'#624568'},
  'azul-polvo-champagne':{fondo:'#fbfaf6',alterno:'#dfe8ec',titulos:'#4f6c79',secundario:'#f0e8d7',acento:'#b69b68',acentoOscuro:'#3d5967',texto:'#48575d',claro:'#fff',botones:'#927747',bordes:'#d7c8aa',ornamentos:'#c0a56f',foco:'#725b34'},
  'rosa-viejo-borgona':{fondo:'#fcf8f7',alterno:'#eadbd9',titulos:'#7b4a53',secundario:'#f3e5df',acento:'#b78385',acentoOscuro:'#653c45',texto:'#5d4a4d',claro:'#fff',botones:'#936069',bordes:'#dcc1bc',ornamentos:'#c79891',foco:'#70424a'},
  'petroleo-champagne':{fondo:'#faf8f2',alterno:'#dce6e4',titulos:'#32666a',secundario:'#f1e7d3',acento:'#c3a46d',acentoOscuro:'#244f52',texto:'#465b5a',claro:'#fff',botones:'#a88850',bordes:'#d8c7a5',ornamentos:'#b99b61',foco:'#7f663c'}
};

export const DEFAULT_CORUSCANT_CONFIG:AuroraConfig={
  event:{name:'Paz',dateTime:'2027-06-12T21:00:00-03:00',endDateTime:'2027-06-13T05:00:00-03:00',timezone:'America/Montevideo',venue:'Salón Eventos Premium',address:'Av. Principal 1234, Montevideo',calendarTitle:'Mis 15 años de Paz'},
  links:{maps:'https://maps.google.com/?q=Montevideo',photoUpload:'https://drive.google.com/',instagram:'https://instagram.com/'},content:{hashtag:'#Paz15Años'},
  gifts:{bank:'Banco de demostración',holder:'Familia de Paz',currency:'UYU',account:'0000000000',alias:'PAZ.QUINCE',visible:true},schedule:[],
  gallery:[1,2,4,5,6].map(n=>({src:`/coruscant/images/foto-0${n}.png`,alt:`Fotografía ${n} de Paz`})),hotels:[{name:'Hotel Central Plaza',address:'Centro, Montevideo',distance:'A 10 minutos del salón'}],qrPass:{value:'CORUSCANT-DEMO-GUEST'},
  assets:{hero:'/coruscant/images/lador_derecho_sup.png',heroPositionMobile:'right top',heroPositionDesktop:'right top',heroOverlay:0,parallax:'/coruscant/images/foto-03.png',ornamentTop:'/coruscant/images/lador_derecho_sup.png',ornamentBottom:'/coruscant/images/lado-izq-bottom.png',ornamentLeft:'/coruscant/images/lado-izquierdo.png',ornamentRight:'/coruscant/images/separador_derecha.png',navigationIcon:'/coruscant/images/navegar.png'},
  sections:{hero:true,dateStack:false,countdown:true,location:true,quote:true,dressCode:true,schedule:false,parallax:true,gallery:true,hotels:true,gifts:true,photoUpload:true,social:true,songSuggestions:true,qrPass:true,rsvp:true},
  tones:{countdown:'light',location:'accent',quote:'light',dressCode:'accent',parallax:'light',gallery:'light',hotels:'accentDark',gifts:'light',photoUpload:'accent',social:'accentDark',songSuggestions:'light',qrPass:'accent',rsvp:'light'},metadata:{private:true}
};

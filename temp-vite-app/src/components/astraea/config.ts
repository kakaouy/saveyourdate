import type { AuroraConfig, AuroraPaletteTokens } from '../aurora/config';

export type AstraeaPalette = 'lavanda-ciruela' | 'azul-polvo-champagne' | 'rosa-viejo-borgona' | 'rosa-salvia' | 'petroleo-champagne' | 'marron-arena' | 'azul-champagne' | 'oliva-marfil' | 'borgona-rosa' | 'ciruela-lavanda';
export const ASTRAEA_PALETTES: Record<AstraeaPalette, AuroraPaletteTokens> = {
  'lavanda-ciruela': { fondo:'#fbf8fc',alterno:'#e8deec',acento:'#a98caf',acentoOscuro:'#543d59',titulos:'#674c6d',secundario:'#f0e8f2',texto:'#51474f',claro:'#ffffff',botones:'#806087',bordes:'#d4c3d8',ornamentos:'#b694bd',foco:'#624568' },
  'azul-polvo-champagne': { fondo:'#fbfaf6',alterno:'#dfe8ec',acento:'#b69b68',acentoOscuro:'#3d5967',titulos:'#4f6c79',secundario:'#f0e8d7',texto:'#48575d',claro:'#ffffff',botones:'#927747',bordes:'#d7c8aa',ornamentos:'#c0a56f',foco:'#725b34' },
  'rosa-viejo-borgona': { fondo:'#fcf8f7',alterno:'#eadbd9',acento:'#b78385',acentoOscuro:'#653c45',titulos:'#7b4a53',secundario:'#f3e5df',texto:'#5d4a4d',claro:'#ffffff',botones:'#936069',bordes:'#dcc1bc',ornamentos:'#c79891',foco:'#70424a' },
  'rosa-salvia': { fondo:'#fbf7f3',alterno:'#eadedb',acento:'#bd8b91',acentoOscuro:'#566b5f',titulos:'#8f6269',secundario:'#f3e8df',texto:'#655a57',claro:'#ffffff',botones:'#a8757d',bordes:'#dbc4bd',ornamentos:'#879b83',foco:'#785158' },
  'petroleo-champagne': { fondo:'#faf8f2',alterno:'#dce6e4',acento:'#c3a46d',acentoOscuro:'#244f52',titulos:'#32666a',secundario:'#f1e7d3',texto:'#465b5a',claro:'#ffffff',botones:'#a88850',bordes:'#d8c7a5',ornamentos:'#b99b61',foco:'#7f663c' },
  'marron-arena': { fondo:'#fffdf8',alterno:'#d6b986',acento:'#c6a267',acentoOscuro:'#76584c',titulos:'#76584c',secundario:'#ead7b2',texto:'#76584c',claro:'#fffdf8',botones:'#76584c',bordes:'#d8c29a',ornamentos:'#c6a267',foco:'#9e7c46' },
  'azul-champagne': { fondo:'#fffdf8',alterno:'#d7c39a',acento:'#c5a567',acentoOscuro:'#27384a',titulos:'#27384a',secundario:'#eadfc7',texto:'#27384a',claro:'#ffffff',botones:'#27384a',bordes:'#d9c69f',ornamentos:'#c5a567',foco:'#8d7040' },
  'oliva-marfil': { fondo:'#fffef8',alterno:'#cdbf91',acento:'#b59b59',acentoOscuro:'#4f5942',titulos:'#4f5942',secundario:'#e7dfc4',texto:'#4f5942',claro:'#ffffff',botones:'#4f5942',bordes:'#d3c79e',ornamentos:'#b59b59',foco:'#80703f' },
  'borgona-rosa': { fondo:'#fffafa',alterno:'#d9b0aa',acento:'#c99586',acentoOscuro:'#6f303b',titulos:'#6f303b',secundario:'#efd8d3',texto:'#6f303b',claro:'#ffffff',botones:'#6f303b',bordes:'#dbb8b1',ornamentos:'#c99586',foco:'#8f5360' },
  'ciruela-lavanda': { fondo:'#fdfafe',alterno:'#c9afd0',acento:'#b18bb9',acentoOscuro:'#59405f',titulos:'#59405f',secundario:'#e7d9ea',texto:'#59405f',claro:'#ffffff',botones:'#59405f',bordes:'#d1bdd6',ornamentos:'#b18bb9',foco:'#74547b' }
};

export const DEFAULT_ASTRAEA_CONFIG: AuroraConfig = {
  event:{name:'Romina',dateTime:'2027-04-02T21:00:00-03:00',endDateTime:'2027-04-03T05:00:00-03:00',timezone:'America/Montevideo',venue:'Salón Eventos Premium',address:'Av. Principal 1234, Montevideo',calendarTitle:'Mis 15 años de Romina'},
  links:{maps:'https://maps.google.com/?q=Montevideo',photoUpload:'https://drive.google.com/',instagram:'https://instagram.com/'},
  content:{hashtag:'#Romina15Años',heroQuote:'“Los momentos más felices de la vida se vuelven maravillosos cuando los compartimos con quienes queremos.”',quote:'“Los momentos más felices de la vida se vuelven maravillosos cuando los compartimos con quienes queremos. Vos estás entre ellos, ¡te espero!”'},
  gifts:{bank:'Banco de demostración',holder:'Familia de Romina',currency:'UYU',account:'0000000000',alias:'ROMINA.QUINCE',visible:true},
  schedule:[],gallery:[1,2,4,5,6].map(n=>({src:`/astraea/images/foto-0${n}.png`,alt:`Fotografía ${n} de Romina`})),hotels:[],qrPass:{value:'ASTRAEA-DEMO-GUEST'},
  assets:{hero:'/astraea/images/lador_derecho_sup.png',heroPositionMobile:'right top',heroPositionDesktop:'right top',heroOverlay:0,parallax:'/astraea/images/foto-03.png',ornamentTop:'/astraea/images/lador_derecho_sup.png',ornamentBottom:'/astraea/images/lado-izq-bottom.png',ornamentLeft:'/astraea/images/separador_derecha.png',ornamentRight:'/astraea/images/separador_derecha.png',navigationIcon:'/astraea/images/navegar.png'},
  sections:{hero:true,dateStack:false,countdown:true,location:true,quote:true,dressCode:true,schedule:false,parallax:true,gallery:true,hotels:false,gifts:true,photoUpload:true,social:true,songSuggestions:true,qrPass:true,rsvp:true},
  tones:{dateStack:'accentDark',countdown:'alternate',location:'light',quote:'accentDark',dressCode:'alternate',parallax:'light',gallery:'accentDark',gifts:'light',photoUpload:'accentDark',social:'alternate',songSuggestions:'light',qrPass:'accentDark',rsvp:'alternate'},metadata:{private:true}
};

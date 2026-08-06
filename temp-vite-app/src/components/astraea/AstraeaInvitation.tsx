import type { AuroraConfig, AuroraLocale } from '../aurora/config';
import { AuroraInvitation } from '../aurora/AuroraInvitation';
import { ASTRAEA_PALETTES, DEFAULT_ASTRAEA_CONFIG } from './config';
import type { AstraeaPalette } from './config';
import './astraea.css';

type Props={locale:AuroraLocale;palette:AstraeaPalette;embedded?:boolean;onClose?:()=>void;config?:Partial<AuroraConfig>};
export function AstraeaInvitation(props:Props){
  const localized = {
    es: {
      calendarTitle:'Mis 15 años de Romina',
      heroQuote:'“Los momentos más felices de la vida se vuelven maravillosos cuando los compartimos con quienes queremos.”',
      quote:'“Los momentos más felices de la vida se vuelven maravillosos cuando los compartimos con quienes queremos. Vos estás entre ellos, ¡te espero!”',
      photo:'Fotografía'
    },
    en: {
      calendarTitle:"Romina's 15th birthday",
      heroQuote:'“Life’s happiest moments become wonderful when we share them with the people we love.”',
      quote:'“Life’s happiest moments become wonderful when we share them with the people we love. You are one of them—I can’t wait to celebrate with you!”',
      photo:'Photo'
    },
    pt: {
      calendarTitle:'Festa de 15 anos da Romina',
      heroQuote:'“Os momentos mais felizes da vida se tornam maravilhosos quando os compartilhamos com quem amamos.”',
      quote:'“Os momentos mais felizes da vida se tornam maravilhosos quando os compartilhamos com quem amamos. Você é uma dessas pessoas. Espero você!”',
      photo:'Fotografia'
    }
  }[props.locale];
  const localizedConfig: AuroraConfig = {
    ...DEFAULT_ASTRAEA_CONFIG,
    ...props.config,
    event:{...DEFAULT_ASTRAEA_CONFIG.event,...props.config?.event,calendarTitle:props.config?.event?.calendarTitle || localized.calendarTitle},
    content:{...DEFAULT_ASTRAEA_CONFIG.content,...props.config?.content,heroQuote:props.config?.content?.heroQuote || localized.heroQuote,quote:props.config?.content?.quote || localized.quote},
    gallery:(props.config?.gallery || DEFAULT_ASTRAEA_CONFIG.gallery).map((image,index)=>({...image,alt:image.alt?.replace(/^Fotografía/,localized.photo) || `${localized.photo} ${index+1} de Romina`}))
  };
  return <AuroraInvitation {...props} palette="verde-dorado" paletteTokens={ASTRAEA_PALETTES[props.palette]} modelClass="astraea-model" astraeaHero globalPetals carouselGallery config={localizedConfig} />;
}

export { ASTRAEA_PALETTES };

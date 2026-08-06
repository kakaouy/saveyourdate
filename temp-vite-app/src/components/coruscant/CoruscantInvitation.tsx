import type { AuroraConfig, AuroraLocale } from '../aurora/config';
import { AuroraInvitation } from '../aurora/AuroraInvitation';
import { CORUSCANT_PALETTES, DEFAULT_CORUSCANT_CONFIG } from './config';
import type { CoruscantPalette } from './config';
import './coruscant.css';

type Props={locale:AuroraLocale;palette:CoruscantPalette;embedded?:boolean;onClose?:()=>void;config?:Partial<AuroraConfig>};
export function CoruscantInvitation(props:Props){
  const localized = {
    es:{calendarTitle:'Mis 15 años de Paz',photo:'Fotografía',distance:'A 10 minutos del salón'},
    en:{calendarTitle:"Paz's 15th birthday",photo:'Photo',distance:'10 minutes from the venue'},
    pt:{calendarTitle:'Festa de 15 anos da Paz',photo:'Fotografia',distance:'A 10 minutos do salão'}
  }[props.locale];
  const localizedConfig: AuroraConfig = {
    ...DEFAULT_CORUSCANT_CONFIG,
    ...props.config,
    event:{...DEFAULT_CORUSCANT_CONFIG.event,...props.config?.event,calendarTitle:props.config?.event?.calendarTitle || localized.calendarTitle},
    gallery:(props.config?.gallery || DEFAULT_CORUSCANT_CONFIG.gallery).map((image,index)=>({...image,alt:image.alt?.replace(/^Fotografía/,localized.photo) || `${localized.photo} ${index+1} de Paz`})),
    hotels:(props.config?.hotels || DEFAULT_CORUSCANT_CONFIG.hotels).map((hotel)=>({...hotel,distance:hotel.distance === 'A 10 minutos del salón' ? localized.distance : hotel.distance}))
  };
  return <AuroraInvitation {...props} palette="rosa-champagne" paletteTokens={CORUSCANT_PALETTES[props.palette]} modelClass="coruscant-model" editorialHero config={localizedConfig} />;
}

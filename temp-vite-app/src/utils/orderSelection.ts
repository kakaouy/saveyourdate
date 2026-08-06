export interface OrderSelectionInput {
  language: 'es' | 'en' | 'pt';
  modelId: string;
  modelName: string;
  paletteId: string;
  paletteName: string;
  paletteColor: string;
}

export function buildOrderSelectionFields(input: OrderSelectionInput) {
  return {
    'Idioma de la invitación': input.language === 'es' ? 'Español' : input.language === 'en' ? 'English' : 'Português',
    'Código de idioma': input.language,
    'ID del modelo': input.modelId,
    Modelo: input.modelName,
    'ID de paleta': input.paletteId,
    'Paleta elegida': input.paletteName,
    'Color elegido': input.paletteColor
  };
}

export const alibiFeedback = {
  'Bruno Vidal': { id: 'bruno', text: 'Revisá las fotografías de Bruno y compará sus horarios con el apagón. ¿Cubren todo el intervalo?' },
  'Vera Salas': { id: 'vera', text: 'Revisá la entrada y la salida de Vera. ¿Esos registros demuestran dónde estuvo durante todo el apagón?' },
  'León Costa': { id: 'leon', text: 'Compará los dos tramos de la entrevista de León con su paso por la cafetería. ¿Queda algún momento sin cubrir?' },
} as const;
export type AlibiName = keyof typeof alibiFeedback;
export function isAlibiName(value: unknown): value is AlibiName {
  return typeof value === 'string' && Object.hasOwn(alibiFeedback, value);
}

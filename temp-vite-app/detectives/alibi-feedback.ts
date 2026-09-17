export const alibiFeedback = {
  'Bruno Vidal': { id: 'bruno', text: 'Agente, antes de cerrar esa hipótesis, revisá la fotografía automática de la terraza. Compará su hora con el momento del apagón. ¿Qué parte de la declaración de Bruno respalda esa imagen?' },
  'Vera Salas': { id: 'vera', text: 'Sigamos el rastro, agente. Buscá la entrada y la salida de Vera en el registro del generador. Compará esos horarios con su declaración. ¿Hay una contradicción o los datos coinciden?' },
  'León Costa': { id: 'leon', text: 'Todavía nos falta contrastar una prueba, agente. Revisá cuándo empezó y cuándo terminó la entrevista grabada de León. ¿Ese intervalo incluye el momento del apagón? Volvé a comparar su declaración con ese registro.' },
} as const;
export type AlibiName = keyof typeof alibiFeedback;
export function isAlibiName(value: unknown): value is AlibiName {
  return typeof value === 'string' && Object.hasOwn(alibiFeedback, value);
}

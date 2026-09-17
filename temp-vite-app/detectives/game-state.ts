export type GameState = {
  agent: string;
  highestLevel: number;
  hints: Record<number, number>;
  checkProgress: Record<number, number>;
  completedAt: string | null;
};
export function rankFor(hints: number) {
  return hints <= 1 ? 'Detective del Faro' : hints <= 3 ? 'Especialista en Evidencias' : 'Agente de Investigación';
}

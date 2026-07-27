export type CommercialPlan = 'basic' | 'premium';

export const PLAN_PRICES: Record<CommercialPlan, string> = {
  basic: 'USD 60',
  premium: 'USD 90'
};

export const PAYMENT_LINKS: Record<CommercialPlan, string> = {
  basic: 'https://mpago.la/2nxTnqV',
  premium: 'https://mpago.la/1njFruh'
};

export const commercialPlanFromLabel = (plan: string): CommercialPlan =>
  plan.toLowerCase().includes('premium') ? 'premium' : 'basic';

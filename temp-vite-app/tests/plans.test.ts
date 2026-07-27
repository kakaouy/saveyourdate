import assert from 'node:assert/strict';
import test from 'node:test';
import { PAYMENT_LINKS, PLAN_PRICES, commercialPlanFromLabel } from '../src/config/plans.ts';

test('mantiene precio y enlace propios para cada plan', () => {
  assert.deepEqual(PLAN_PRICES, {
    basic: 'USD 60',
    premium: 'USD 90'
  });
  assert.deepEqual(PAYMENT_LINKS, {
    basic: 'https://mpago.la/2nxTnqV',
    premium: 'https://mpago.la/1njFruh'
  });
});

test('resuelve el enlace correcto desde el nombre localizado del plan', () => {
  assert.equal(commercialPlanFromLabel('Básico'), 'basic');
  assert.equal(commercialPlanFromLabel('Basic'), 'basic');
  assert.equal(commercialPlanFromLabel('Premium'), 'premium');
});

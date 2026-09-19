import { describe, expect, it } from 'vitest';
import { buildPaydayPlan, PaydayDebt } from './payday-plan';

const visa: PaydayDebt = { nombre: 'Visa', minimumPayment: 75_000, paymentDay: 15 };
const prestamo: PaydayDebt = { nombre: 'Préstamo', minimumPayment: 40_000, paymentDay: 5 };
const hipoteca: PaydayDebt = { nombre: 'Hipoteca', minimumPayment: 300_000, paymentDay: 20 };

describe('buildPaydayPlan', () => {
  it('parte el salario a la mitad entre las dos quincenas', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [], 0);

    expect(primera.income).toBe(1_500_000);
    expect(segunda.income).toBe(1_500_000);
  });

  it('el día 15 pertenece a la primera quincena', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [visa], 0);

    expect(primera.commitments.map(c => c.nombre)).toContain('Visa');
    expect(segunda.commitments).toHaveLength(0);
  });

  it('el día 16 ya pertenece a la segunda', () => {
    const dia16: PaydayDebt = { nombre: 'Justo', minimumPayment: 10_000, paymentDay: 16 };
    const [primera, segunda] = buildPaydayPlan(3_000_000, [dia16], 0);

    expect(primera.commitments).toHaveLength(0);
    expect(segunda.commitments.map(c => c.nombre)).toContain('Justo');
  });

  it('coloca cada cuota en su quincena y suma los compromisos', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [visa, prestamo, hipoteca], 0);

    expect(primera.committed).toBe(115_000);
    expect(segunda.committed).toBe(300_000);
  });

  it('reparte el gasto presupuestado a partes iguales', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [], 1_000_000);

    expect(primera.committed).toBe(500_000);
    expect(segunda.committed).toBe(500_000);
  });

  it('descuenta los compromisos del ingreso de cada quincena', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [visa, prestamo], 1_000_000);

    // 1.500.000 - (75.000 + 40.000 + 500.000)
    expect(primera.available).toBe(885_000);
    // 1.500.000 - 500.000
    expect(segunda.available).toBe(1_000_000);
  });

  it('marca en negativo la quincena en la que no llega el dinero', () => {
    const cara: PaydayDebt = { nombre: 'Cuota enorme', minimumPayment: 900_000, paymentDay: 3 };
    const [primera] = buildPaydayPlan(1_000_000, [cara], 0);

    expect(primera.available).toBeLessThan(0);
    expect(primera.available).toBe(-400_000);
  });

  it('el porcentaje comprometido no pasa del 100 aunque se exceda', () => {
    const cara: PaydayDebt = { nombre: 'Cuota enorme', minimumPayment: 5_000_000, paymentDay: 3 };
    const [primera] = buildPaydayPlan(1_000_000, [cara], 0);

    expect(primera.usedPercentage).toBe(100);
  });

  it('sin salario el porcentaje es cero en vez de dividir por cero', () => {
    const [primera] = buildPaydayPlan(0, [visa], 0);

    expect(primera.usedPercentage).toBe(0);
    expect(Number.isNaN(primera.usedPercentage)).toBe(false);
  });

  it('no añade la línea de presupuesto cuando no hay presupuestos', () => {
    const [primera] = buildPaydayPlan(3_000_000, [visa], 0);

    expect(primera.commitments.every(c => c.tipo === 'deuda')).toBe(true);
  });
});

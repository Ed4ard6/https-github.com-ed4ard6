import { describe, expect, it } from 'vitest';
import { DebtInput, simulateDebtPayoff } from './debt-strategy';

const tarjeta: DebtInput = {
  nombre: 'Tarjeta',
  balance: 2_000_000,
  annualRate: 24,
  minimumPayment: 100_000
};

const prestamo: DebtInput = {
  nombre: 'Préstamo',
  balance: 500_000,
  annualRate: 8,
  minimumPayment: 50_000
};

describe('simulateDebtPayoff', () => {
  it('sin deudas no hay nada que simular', () => {
    const result = simulateDebtPayoff([], 'snowball', 0);

    expect(result).toEqual({ months: 0, totalInterest: 0, order: [], finished: true });
  });

  it('la bola de nieve empieza por el saldo más pequeño', () => {
    const result = simulateDebtPayoff([tarjeta, prestamo], 'snowball', 100_000);

    expect(result.order).toEqual(['Préstamo', 'Tarjeta']);
  });

  it('la avalancha empieza por la tasa más alta', () => {
    const result = simulateDebtPayoff([prestamo, tarjeta], 'avalanche', 100_000);

    expect(result.order).toEqual(['Tarjeta', 'Préstamo']);
  });

  it('la avalancha cuesta menos intereses que la bola de nieve', () => {
    const snowball = simulateDebtPayoff([tarjeta, prestamo], 'snowball', 100_000);
    const avalanche = simulateDebtPayoff([tarjeta, prestamo], 'avalanche', 100_000);

    expect(avalanche.totalInterest).toBeLessThan(snowball.totalInterest);
  });

  it('una deuda sin intereses se salda en los meses que dicen las cuotas', () => {
    const sinInteres: DebtInput = {
      nombre: 'Familiar',
      balance: 1_000_000,
      annualRate: 0,
      minimumPayment: 250_000
    };

    const result = simulateDebtPayoff([sinInteres], 'snowball', 0);

    expect(result.months).toBe(4);
    expect(result.totalInterest).toBe(0);
    expect(result.finished).toBe(true);
  });

  it('el pago extra acorta el plazo', () => {
    const sinExtra = simulateDebtPayoff([tarjeta], 'avalanche', 0);
    const conExtra = simulateDebtPayoff([tarjeta], 'avalanche', 200_000);

    expect(conExtra.months).toBeLessThan(sinExtra.months);
    expect(conExtra.totalInterest).toBeLessThan(sinExtra.totalInterest);
  });

  it('avisa cuando la cuota no cubre ni los intereses', () => {
    const impagable: DebtInput = {
      nombre: 'Ahogada',
      balance: 10_000_000,
      annualRate: 60,
      minimumPayment: 10_000
    };

    const result = simulateDebtPayoff([impagable], 'avalanche', 0);

    expect(result.finished).toBe(false);
  });

  it('no modifica las deudas que recibe', () => {
    const original = { ...tarjeta };

    simulateDebtPayoff([tarjeta], 'avalanche', 50_000);

    expect(tarjeta).toEqual(original);
  });

  it('un pago extra negativo se trata como cero', () => {
    const normal = simulateDebtPayoff([tarjeta], 'avalanche', 0);
    const negativo = simulateDebtPayoff([tarjeta], 'avalanche', -500_000);

    expect(negativo.months).toBe(normal.months);
  });

  it('el interés del primer mes es el esperado', () => {
    // 2.000.000 al 24% anual = 2% mensual = 40.000 el primer mes
    const unMes: DebtInput = {
      nombre: 'Tarjeta',
      balance: 2_000_000,
      annualRate: 24,
      minimumPayment: 2_040_000
    };

    const result = simulateDebtPayoff([unMes], 'avalanche', 0);

    expect(result.months).toBe(1);
    expect(result.totalInterest).toBeCloseTo(40_000, 2);
  });
});

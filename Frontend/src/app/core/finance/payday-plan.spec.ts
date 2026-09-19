import { describe, expect, it } from 'vitest';
import { buildPaydayPlan, PaydayDebt, PaydayFixedExpense } from './payday-plan';

const visa: PaydayDebt = { nombre: 'Visa', minimumPayment: 75_000, paymentDay: 15 };
const prestamo: PaydayDebt = { nombre: 'Préstamo', minimumPayment: 40_000, paymentDay: 5 };
const hipoteca: PaydayDebt = { nombre: 'Hipoteca', minimumPayment: 300_000, paymentDay: 20 };

const alquiler: PaydayFixedExpense = { nombre: 'Alquiler', amount: 800_000, paymentDay: 5 };
const internet: PaydayFixedExpense = { nombre: 'Internet', amount: 120_000, paymentDay: 22 };

describe('buildPaydayPlan', () => {
  it('parte el salario a la mitad entre las dos quincenas', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [], 0).paydays;

    expect(primera.income).toBe(1_500_000);
    expect(segunda.income).toBe(1_500_000);
  });

  it('el día 15 pertenece a la primera quincena', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [visa], 0).paydays;

    expect(primera.commitments.map(c => c.nombre)).toContain('Visa');
    expect(segunda.commitments).toHaveLength(0);
  });

  it('el día 16 ya pertenece a la segunda', () => {
    const dia16: PaydayDebt = { nombre: 'Justo', minimumPayment: 10_000, paymentDay: 16 };
    const [primera, segunda] = buildPaydayPlan(3_000_000, [dia16], 0).paydays;

    expect(primera.commitments).toHaveLength(0);
    expect(segunda.commitments.map(c => c.nombre)).toContain('Justo');
  });

  it('coloca cada cuota en su quincena y suma los compromisos', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [visa, prestamo, hipoteca], 0).paydays;

    expect(primera.committed).toBe(115_000);
    expect(segunda.committed).toBe(300_000);
  });

  it('reparte el gasto presupuestado a partes iguales', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [], 1_000_000).paydays;

    expect(primera.committed).toBe(500_000);
    expect(segunda.committed).toBe(500_000);
  });

  it('descuenta los compromisos del ingreso de cada quincena', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [visa, prestamo], 1_000_000).paydays;

    expect(primera.available).toBe(885_000);
    expect(segunda.available).toBe(1_000_000);
  });

  it('marca en negativo la quincena en la que no llega el dinero', () => {
    const cara: PaydayDebt = { nombre: 'Cuota enorme', minimumPayment: 900_000, paymentDay: 3 };
    const [primera] = buildPaydayPlan(1_000_000, [cara], 0).paydays;

    expect(primera.available).toBe(-400_000);
  });

  it('el porcentaje comprometido no pasa del 100 aunque se exceda', () => {
    const cara: PaydayDebt = { nombre: 'Cuota enorme', minimumPayment: 5_000_000, paymentDay: 3 };
    const [primera] = buildPaydayPlan(1_000_000, [cara], 0).paydays;

    expect(primera.usedPercentage).toBe(100);
  });

  it('sin salario el porcentaje es cero en vez de dividir por cero', () => {
    const [primera] = buildPaydayPlan(0, [visa], 0).paydays;

    expect(primera.usedPercentage).toBe(0);
    expect(Number.isNaN(primera.usedPercentage)).toBe(false);
  });

  it('no añade la línea de presupuesto cuando no hay presupuestos', () => {
    const [primera] = buildPaydayPlan(3_000_000, [visa], 0).paydays;

    expect(primera.commitments.every(c => c.tipo === 'deuda')).toBe(true);
  });

  it('coloca cada gasto fijo en la quincena de su día de pago', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [], 0, [alquiler, internet]).paydays;

    expect(primera.commitments.map(c => c.nombre)).toEqual(['Alquiler']);
    expect(segunda.commitments.map(c => c.nombre)).toEqual(['Internet']);
  });

  it('suma deudas y gastos fijos que caen en la misma quincena', () => {
    const [primera] = buildPaydayPlan(3_000_000, [visa, prestamo], 0, [alquiler]).paydays;

    expect(primera.committed).toBe(915_000);
  });

  it('distingue el tipo de cada compromiso', () => {
    const [primera] = buildPaydayPlan(3_000_000, [prestamo], 1_000_000, [alquiler]).paydays;
    const tipos = primera.commitments.map(c => c.tipo);

    expect(tipos).toContain('deuda');
    expect(tipos).toContain('fijo');
    expect(tipos).toContain('presupuesto');
  });
});

describe('gastos fijos repartidos entre quincenas', () => {
  const alquilerDividido: PaydayFixedExpense = { ...alquiler, splitBetweenPaydays: true };

  it('aparta la mitad en cada quincena', () => {
    const [primera, segunda] = buildPaydayPlan(3_000_000, [], 0, [alquilerDividido]).paydays;

    expect(primera.committed).toBe(400_000);
    expect(segunda.committed).toBe(400_000);
  });

  it('la mitad aparece en la quincena que no es la del pago', () => {
    const [, segunda] = buildPaydayPlan(3_000_000, [], 0, [alquilerDividido]).paydays;

    // El alquiler vence el día 5, pero media cuota se aparta en la segunda
    expect(segunda.commitments.map(c => c.nombre)).toContain('Alquiler (mitad)');
  });

  it('marca esas mitades como provisión', () => {
    const [primera] = buildPaydayPlan(3_000_000, [], 0, [alquilerDividido]).paydays;
    const mitad = primera.commitments.find(c => c.nombre.includes('Alquiler'));

    expect(mitad?.esProvision).toBe(true);
  });

  it('repartir evita el descubierto que causaba cargarlo entero', () => {
    // 750.000 por quincena: el alquiler entero no cabe, la mitad sí
    const entero = buildPaydayPlan(1_500_000, [], 0, [alquiler]).paydays;
    const dividido = buildPaydayPlan(1_500_000, [], 0, [alquilerDividido]).paydays;

    expect(entero[0].available).toBe(-50_000);
    expect(dividido[0].available).toBe(350_000);
    expect(dividido[1].available).toBe(350_000);
  });

  it('el total del mes no cambia por repartirlo', () => {
    const entero = buildPaydayPlan(3_000_000, [], 0, [alquiler]).paydays;
    const dividido = buildPaydayPlan(3_000_000, [], 0, [alquilerDividido]).paydays;

    const sumar = (p: typeof entero) => p[0].committed + p[1].committed;
    expect(sumar(dividido)).toBe(sumar(entero));
  });
});

describe('propuesta de ahorro entre quincenas', () => {
  it('no propone nada cuando las dos quincenas cuadran', () => {
    const { suggestion } = buildPaydayPlan(3_000_000, [visa], 0);

    expect(suggestion).toBeNull();
  });

  it('propone apartar en la quincena con holgura para cubrir la corta', () => {
    // 750.000 por quincena; el alquiler del día 5 deja la primera en −50.000
    const { suggestion } = buildPaydayPlan(1_500_000, [], 0, [alquiler, internet]);

    expect(suggestion).not.toBeNull();
    expect(suggestion!.toPayday).toBe('Primera quincena');
    expect(suggestion!.fromPayday).toBe('Segunda quincena');
  });

  it('el importe propuesto cubre exactamente el hueco', () => {
    const { paydays, suggestion } = buildPaydayPlan(1_500_000, [], 0, [alquiler, internet]);

    expect(suggestion!.amount).toBe(Math.abs(paydays[0].available));
    expect(suggestion!.amount).toBe(50_000);
    expect(suggestion!.covered).toBe(true);
    expect(suggestion!.uncovered).toBe(0);
  });

  it('avisa de lo que queda sin cubrir si la otra quincena tampoco da', () => {
    const enorme: PaydayFixedExpense = { nombre: 'Enorme', amount: 5_000_000, paymentDay: 3 };
    const { suggestion } = buildPaydayPlan(1_000_000, [], 0, [enorme]);

    expect(suggestion!.covered).toBe(false);
    expect(suggestion!.uncovered).toBeGreaterThan(0);
    // Solo puede aportar lo que le sobra a la segunda quincena
    expect(suggestion!.amount).toBe(500_000);
  });
});

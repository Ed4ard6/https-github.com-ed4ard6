export type PayoffStrategy = 'snowball' | 'avalanche';

export interface DebtInput {
  nombre: string;
  balance: number;
  /** Tasa anual en porcentaje: 24.5 significa 24,5% */
  annualRate: number;
  minimumPayment: number;
}

export interface PayoffResult {
  months: number;
  totalInterest: number;
  /** Orden en que se atacan las deudas según la estrategia */
  order: string[];
  /** false si con ese pago las deudas no llegan a saldarse */
  finished: boolean;
}

/** Tope de la simulación: 50 años. Más allá, la deuda no se salda. */
const MAX_MONTHS = 600;

/**
 * Simula el pago mes a mes: se aplica el interés, se abonan los mínimos y el
 * pago extra va íntegro a la deuda prioritaria. Lo que se libera al saldar una
 * deuda queda disponible para la siguiente.
 */
export function simulateDebtPayoff(
  debts: DebtInput[],
  strategy: PayoffStrategy,
  extraPerMonth: number
): PayoffResult {
  if (debts.length === 0) {
    return { months: 0, totalInterest: 0, order: [], finished: true };
  }

  const saldos = debts.map(d => ({
    nombre: d.nombre,
    balance: d.balance,
    monthlyRate: d.annualRate / 100 / 12,
    minimum: d.minimumPayment
  }));

  const prioridad = [...saldos].sort((a, b) =>
    strategy === 'snowball' ? a.balance - b.balance : b.monthlyRate - a.monthlyRate
  );

  const order = prioridad.map(d => d.nombre);
  const extra = Math.max(0, extraPerMonth);
  let months = 0;
  let totalInterest = 0;

  while (saldos.some(d => d.balance > 0.01) && months < MAX_MONTHS) {
    months++;

    for (const deuda of saldos) {
      if (deuda.balance <= 0) continue;
      const interes = deuda.balance * deuda.monthlyRate;
      deuda.balance += interes;
      totalInterest += interes;
    }

    for (const deuda of saldos) {
      if (deuda.balance <= 0) continue;
      deuda.balance -= Math.min(deuda.minimum, deuda.balance);
    }

    let disponible = extra;
    for (const objetivo of prioridad) {
      if (disponible <= 0) break;
      if (objetivo.balance <= 0) continue;

      const abono = Math.min(disponible, objetivo.balance);
      objetivo.balance -= abono;
      disponible -= abono;
    }
  }

  return {
    months,
    totalInterest,
    order,
    finished: months < MAX_MONTHS
  };
}

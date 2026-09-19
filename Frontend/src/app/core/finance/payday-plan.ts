export interface PaydayDebt {
  nombre: string;
  minimumPayment: number;
  /** Día del mes en que vence la cuota */
  paymentDay: number;
}

export interface Commitment {
  nombre: string;
  amount: number;
  tipo: 'deuda' | 'presupuesto';
  day?: number;
}

export interface Payday {
  titulo: string;
  rango: string;
  income: number;
  committed: number;
  available: number;
  usedPercentage: number;
  commitments: Commitment[];
}

/** Las cuotas hasta el día 15 caen en la primera quincena. */
const FIRST_PAYDAY_LAST_DAY = 15;

/**
 * Reparte el salario entre las dos quincenas del mes. Cada cuota de deuda va a
 * la quincena que le toca por su día de pago; el gasto presupuestado se divide
 * a partes iguales, porque el día a día no tiene fecha fija.
 */
export function buildPaydayPlan(
  monthlySalary: number,
  debts: PaydayDebt[],
  totalBudgeted: number
): Payday[] {
  const half = monthlySalary / 2;
  const budgetShare = totalBudgeted / 2;

  return [
    buildPayday(
      'Primera quincena',
      'Del 1 al 15',
      half,
      debts.filter(d => d.paymentDay <= FIRST_PAYDAY_LAST_DAY),
      budgetShare
    ),
    buildPayday(
      'Segunda quincena',
      'Del 16 a fin de mes',
      half,
      debts.filter(d => d.paymentDay > FIRST_PAYDAY_LAST_DAY),
      budgetShare
    )
  ];
}

function buildPayday(
  titulo: string,
  rango: string,
  income: number,
  debts: PaydayDebt[],
  budgetShare: number
): Payday {
  const commitments: Commitment[] = debts.map(d => ({
    nombre: d.nombre,
    amount: d.minimumPayment,
    tipo: 'deuda',
    day: d.paymentDay
  }));

  if (budgetShare > 0) {
    commitments.push({
      nombre: 'Gasto presupuestado',
      amount: budgetShare,
      tipo: 'presupuesto'
    });
  }

  const committed = commitments.reduce((sum, c) => sum + c.amount, 0);

  return {
    titulo,
    rango,
    income,
    committed,
    available: income - committed,
    usedPercentage: income > 0 ? Math.min(100, (committed / income) * 100) : 0,
    commitments
  };
}

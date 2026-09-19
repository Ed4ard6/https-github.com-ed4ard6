export interface PaydayDebt {
  nombre: string;
  minimumPayment: number;
  /** Día del mes en que vence la cuota */
  paymentDay: number;
}

export interface PaydayFixedExpense {
  nombre: string;
  amount: number;
  /** Día del mes en que se paga el recibo */
  paymentDay: number;
}

export interface Commitment {
  nombre: string;
  amount: number;
  tipo: 'deuda' | 'presupuesto' | 'fijo';
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
 * Reparte el salario entre las dos quincenas del mes. Las cuotas de deuda y los
 * gastos fijos van a la quincena que les toca por su día de pago; el gasto
 * presupuestado se divide a partes iguales, porque el día a día no tiene fecha.
 */
export function buildPaydayPlan(
  monthlySalary: number,
  debts: PaydayDebt[],
  totalBudgeted: number,
  fixedExpenses: PaydayFixedExpense[] = []
): Payday[] {
  const half = monthlySalary / 2;
  const budgetShare = totalBudgeted / 2;
  const isFirstHalf = (day: number) => day <= FIRST_PAYDAY_LAST_DAY;

  return [
    buildPayday(
      'Primera quincena',
      'Del 1 al 15',
      half,
      debts.filter(d => isFirstHalf(d.paymentDay)),
      budgetShare,
      fixedExpenses.filter(f => isFirstHalf(f.paymentDay))
    ),
    buildPayday(
      'Segunda quincena',
      'Del 16 a fin de mes',
      half,
      debts.filter(d => !isFirstHalf(d.paymentDay)),
      budgetShare,
      fixedExpenses.filter(f => !isFirstHalf(f.paymentDay))
    )
  ];
}

function buildPayday(
  titulo: string,
  rango: string,
  income: number,
  debts: PaydayDebt[],
  budgetShare: number,
  fixedExpenses: PaydayFixedExpense[]
): Payday {
  const commitments: Commitment[] = [
    ...debts.map(d => ({
      nombre: d.nombre,
      amount: d.minimumPayment,
      tipo: 'deuda' as const,
      day: d.paymentDay
    })),
    ...fixedExpenses.map(f => ({
      nombre: f.nombre,
      amount: f.amount,
      tipo: 'fijo' as const,
      day: f.paymentDay
    }))
  ];

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

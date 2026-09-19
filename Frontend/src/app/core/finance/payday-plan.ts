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
  /**
   * Si está activo, se aparta la mitad en cada quincena en vez de cargar el
   * importe entero en la del día de pago. Útil con recibos grandes.
   */
  splitBetweenPaydays?: boolean;
}

export interface Commitment {
  nombre: string;
  amount: number;
  tipo: 'deuda' | 'presupuesto' | 'fijo';
  day?: number;
  /** Mitad de un recibo que se aparta antes de su fecha */
  esProvision?: boolean;
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

export interface PaydaySuggestion {
  /** Cuánto habría que apartar */
  amount: number;
  /** Quincena que tiene holgura y puede apartarlo */
  fromPayday: string;
  /** Quincena que se queda corta */
  toPayday: string;
  /** Si la holgura de la otra quincena da para cubrir el hueco entero */
  covered: boolean;
  /** Lo que falta por cubrir aun apartando todo lo disponible */
  uncovered: number;
}

export interface PaydayPlan {
  paydays: Payday[];
  /** Propuesta de provisión cuando una quincena no llega; null si ambas cuadran */
  suggestion: PaydaySuggestion | null;
}

/** Las cuotas hasta el día 15 caen en la primera quincena. */
const FIRST_PAYDAY_LAST_DAY = 15;

const isFirstHalf = (day: number) => day <= FIRST_PAYDAY_LAST_DAY;

/**
 * Reparte el salario entre las dos quincenas. Las cuotas de deuda y los recibos
 * van a la quincena de su día de pago, salvo los marcados para repartir, que se
 * apartan a medias. El presupuesto se divide entre las dos, porque el gasto del
 * día a día no tiene fecha fija.
 *
 * Si una quincena no llega, propone cuánto apartar en la otra para cubrirla.
 */
export function buildPaydayPlan(
  monthlySalary: number,
  debts: PaydayDebt[],
  totalBudgeted: number,
  fixedExpenses: PaydayFixedExpense[] = []
): PaydayPlan {
  const half = monthlySalary / 2;
  const budgetShare = totalBudgeted / 2;

  const split = fixedExpenses.filter(f => f.splitBetweenPaydays);
  const whole = fixedExpenses.filter(f => !f.splitBetweenPaydays);

  const paydays = [
    buildPayday(
      'Primera quincena',
      'Del 1 al 15',
      half,
      debts.filter(d => isFirstHalf(d.paymentDay)),
      budgetShare,
      whole.filter(f => isFirstHalf(f.paymentDay)),
      split
    ),
    buildPayday(
      'Segunda quincena',
      'Del 16 a fin de mes',
      half,
      debts.filter(d => !isFirstHalf(d.paymentDay)),
      budgetShare,
      whole.filter(f => !isFirstHalf(f.paymentDay)),
      split
    )
  ];

  return { paydays, suggestion: buildSuggestion(paydays) };
}

function buildPayday(
  titulo: string,
  rango: string,
  income: number,
  debts: PaydayDebt[],
  budgetShare: number,
  fixedExpenses: PaydayFixedExpense[],
  splitExpenses: PaydayFixedExpense[]
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
    })),
    ...splitExpenses.map(f => ({
      nombre: `${f.nombre} (mitad)`,
      amount: f.amount / 2,
      tipo: 'fijo' as const,
      day: f.paymentDay,
      esProvision: true
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

/**
 * Busca la quincena que se queda corta y mira si la otra tiene holgura para
 * taparlo. El consejo es apartar ese dinero por adelantado en vez de llegar
 * a la fecha sin cubrir el recibo.
 */
function buildSuggestion(paydays: Payday[]): PaydaySuggestion | null {
  const short = paydays.find(p => p.available < 0);
  if (!short) return null;

  const other = paydays.find(p => p !== short);
  if (!other) return null;

  const needed = Math.abs(short.available);
  const spare = Math.max(0, other.available);

  return {
    amount: Math.min(needed, spare),
    fromPayday: other.titulo,
    toPayday: short.titulo,
    covered: spare >= needed,
    uncovered: Math.max(0, needed - spare)
  };
}

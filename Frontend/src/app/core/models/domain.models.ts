// ============================================================================
// DOMAIN MODELS - Interfaces TypeScript para los modelos de negocio
// Estas interfaces definen la estructura de datos de toda la aplicación
// ============================================================================

/** Tipos de transacciones que soporta la aplicación */
export type TransactionKind = 'income' | 'expense' | 'debt' | 'saving';

/** Enum para tipos de categorías */
export enum CategoryKind {
  INCOME = 'income',
  EXPENSE = 'expense',
  DEBT = 'debt',
  SAVING = 'saving'
}

/**
 * Usuario autenticado en el sistema
 * Contiene información básica del perfil
 */
export interface User {
  id: string;
  nombre: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Categoría de transacciones
 * Las categorías pueden tener subcategorías (parent_id)
 * Ejemplos: Alimentación, Transporte, Salario, Deuda, etc.
 */
export interface Category {
  id: string;
  userId: string;
  nombre: string;
  kind: CategoryKind;
  color: string;          // Formato: #RRGGBB
  parentId?: string;      // Para jerarquía de categorías
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transacción financiera
 * Representa ingresos, gastos, deudas o ahorros
 * El amount es positivo para ingresos y negativo para egresos
 */
export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  category?: Category;    // Relación cargada
  amount: number;         // Positivo para ingresos, negativo para gastos
  description: string;
  date: Date;
  kind: TransactionKind;  // Tipo de transacción
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Historial de salarios
 * Registra los salarios mensuales del usuario
 */
export interface Salary {
  id: string;
  userId: string;
  amount: number;
  date: Date;             // Mes/Año del salario
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Deuda individual
 * Seguimiento de deudas específicas con tasas de interés
 */
export interface Debt {
  id: string;
  userId: string;
  categoryId: string;
  nombre: string;
  balance: number;        // Saldo actual
  originalAmount: number; // Monto original
  annualRate: number;     // Tasa de interés anual (EA%)
  minimumPayment: number; // Pago mínimo mensual
  paymentDay: number;     // Día del mes para pago
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Presupuesto mensual
 * Límite de gastos por categoría cada mes
 */
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: Date;            // Mes y año del presupuesto
  amount: number;         // Límite presupuestado
  spent: number;          // Cantidad gastada (calculado)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Meta de ahorro
 * Objetivos de ahorro con fecha límite
 */
export interface SavingsGoal {
  id: string;
  userId: string;
  nombre: string;
  targetAmount: number;   // Cantidad objetivo
  currentAmount: number;  // Cantidad ahorrada hasta ahora
  targetDate: Date;       // Fecha límite para alcanzar la meta
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Token JWT decodificado
 * Información almacenada en el token
 */
export interface JwtToken {
  sub: string;            // User ID
  email: string;
  nombre: string;
  exp: number;            // Timestamp de expiración
  iat: number;            // Timestamp de emisión
}

/**
 * Respuesta de autenticación del servidor
 * Contiene el token y datos del usuario
 */
export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Datos resumidos del dashboard
 * Cálculos y agregaciones para la página principal
 */
export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentMonth: string;
  expensesByCategory: {
    category: Category;
    amount: number;
    percentage: number;
  }[];
  recentTransactions: Transaction[];
  totalSavings: number;
  savingsProgress: number;  // Porcentaje
}

/**
 * Comparación de estrategias de deuda
 * Calcula payoff con snowball vs avalanche
 */
export interface DebtComparison {
  snowball: {
    strategy: 'snowball';
    totalInterest: number;
    monthsToPayOff: number;
    paymentSchedule: DebtPayment[];
  };
  avalanche: {
    strategy: 'avalanche';
    totalInterest: number;
    monthsToPayOff: number;
    paymentSchedule: DebtPayment[];
  };
}

/**
 * Pago individual en plan de deuda
 */
export interface DebtPayment {
  month: number;
  debtId: string;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  remainingBalance: number;
}

/**
 * Agregación mensual de transacciones
 * Para reportes y análisis
 */
export interface MonthlyAggregate {
  month: Date;
  income: number;
  expense: number;
  balance: number;
  categoryBreakdown: {
    [categoryId: string]: number;
  };
}

export interface CategoryCreateRequest {
  nombre: string;
  kind: CategoryKind;
  color: string;
  parentId?: string;
}

export interface TransactionCreateRequest {
  categoryId: string;
  amount: number;
  description: string;
  date: Date;
  kind: TransactionKind;
}

import { Injectable } from '@angular/core';
import {
  User,
  Category,
  Transaction,
  Salary,
  Debt,
  Budget,
  SavingsGoal,
  DashboardData,
  CategoryKind,
  TransactionKind,
  DebtComparison,
  MonthlyAggregate
} from '../models/domain.models';

/**
 * MockDataService
 * Genera datos ficticios para desarrollo y testing
 * Simula respuestas del backend API
 */
@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private mockUser: User = {
    id: '1',
    nombre: 'Eduardo',
    email: 'ed4ard60achac6n@gmail.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  };

  private mockCategories: Category[] = [
    // DEBE COINCIDIR CON BACKEND DataSeeder.cs
    // Categorías de Ingresos
    {
      id: 'cat-001',
      userId: '1',
      nombre: 'Salario',
      kind: CategoryKind.INCOME,
      color: '#10b981',
      activo: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    // Categorías de Gastos
    {
      id: 'cat-002',
      userId: '1',
      nombre: 'Alimentación',
      kind: CategoryKind.EXPENSE,
      color: '#f59e0b',
      activo: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'cat-003',
      userId: '1',
      nombre: 'Transporte',
      kind: CategoryKind.EXPENSE,
      color: '#3b82f6',
      activo: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'cat-004',
      userId: '1',
      nombre: 'Entretenimiento',
      kind: CategoryKind.EXPENSE,
      color: '#8b5cf6',
      activo: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    // Categorías de Ahorro
    {
      id: 'cat-005',
      userId: '1',
      nombre: 'Ahorros',
      kind: CategoryKind.SAVING,
      color: '#06b6d4',
      activo: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    // Categorías adicionales de Deuda (para mock)
    {
      id: 'cat-006',
      userId: '1',
      nombre: 'Fondo de Emergencia',
      kind: CategoryKind.SAVING,
      color: '#06b6d4',
      activo: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ];

  private mockTransactions: Transaction[] = [
    // Ingresos
    {
      id: 'txn-001',
      userId: '1',
      categoryId: 'cat-001',
      category: this.mockCategories[0],
      amount: 3000000,
      description: 'Salario mensual',
      date: new Date(2026, 8, 1),
      kind: 'income',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Gastos
    {
      id: 'txn-002',
      userId: '1',
      categoryId: 'cat-002',
      category: this.mockCategories[1],
      amount: -450000,
      description: 'Compras supermercado',
      date: new Date(2026, 8, 5),
      kind: 'expense',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'txn-003',
      userId: '1',
      categoryId: 'cat-003',
      category: this.mockCategories[2],
      amount: -80000,
      description: 'Gasolina',
      date: new Date(2026, 8, 6),
      kind: 'expense',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'txn-004',
      userId: '1',
      categoryId: 'cat-004',
      category: this.mockCategories[3],
      amount: -80000,
      description: 'Cine',
      date: new Date(2026, 8, 7),
      kind: 'expense',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'txn-005',
      userId: '1',
      categoryId: 'cat-005',
      category: this.mockCategories[4],
      amount: 500000,
      description: 'Ahorro mensual',
      date: new Date(2026, 8, 8),
      kind: 'saving',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private mockDebts: Debt[] = [
    {
      id: 'debt-1',
      userId: '1',
      categoryId: 'cat-6',
      nombre: 'Tarjeta Crédito Visa',
      balance: 2500000,
      originalAmount: 3000000,
      annualRate: 24.5,
      minimumPayment: 75000,
      paymentDay: 15,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'debt-2',
      userId: '1',
      categoryId: 'cat-6',
      nombre: 'Crédito Personal',
      balance: 5000000,
      originalAmount: 6000000,
      annualRate: 18.0,
      minimumPayment: 150000,
      paymentDay: 20,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ];

  private mockSavingsGoals: SavingsGoal[] = [
    {
      id: 'goal-1',
      userId: '1',
      nombre: 'Fondo de Emergencia',
      targetAmount: 10000000,
      currentAmount: 3500000,
      targetDate: new Date(2026, 11, 31),
      description: '6 meses de gastos básicos',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'goal-2',
      userId: '1',
      nombre: 'Vacaciones',
      targetAmount: 3000000,
      currentAmount: 750000,
      targetDate: new Date(2026, 6, 31),
      description: 'Viaje familiar',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ];

  constructor() {}

  /**
   * Obtiene el usuario mock autenticado
   */
  getUser(): User {
    return { ...this.mockUser };
  }

  /**
   * Obtiene todas las categorías
   */
  getCategories(): Category[] {
    return JSON.parse(JSON.stringify(this.mockCategories));
  }

  /**
   * Obtiene categorías por tipo
   */
  getCategoriesByKind(kind: CategoryKind): Category[] {
    return this.getCategories().filter(cat => cat.kind === kind);
  }

  /**
   * Obtiene todas las transacciones
   */
  getTransactions(): Transaction[] {
    return JSON.parse(JSON.stringify(this.mockTransactions));
  }

  /**
   * Obtiene transacciones con filtros
   */
  getTransactionFiltered(filters?: {
    kind?: TransactionKind;
    categoryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Transaction[] {
    let transactions = this.getTransactions();

    if (filters?.kind) {
      transactions = transactions.filter(t => t.kind === filters.kind);
    }
    if (filters?.categoryId) {
      transactions = transactions.filter(t => t.categoryId === filters.categoryId);
    }
    if (filters?.dateFrom) {
      transactions = transactions.filter(t => new Date(t.date) >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      transactions = transactions.filter(t => new Date(t.date) <= filters.dateTo!);
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Obtiene datos del dashboard
   */
  getDashboardData(): DashboardData {
    const transactions = this.getTransactions();
    const totalIncome = transactions
      .filter(t => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.kind === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expensesByCategory = this.mockCategories
      .filter(cat => cat.kind === CategoryKind.EXPENSE)
      .map(cat => {
        const amount = transactions
          .filter(t => t.categoryId === cat.id && t.kind === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return {
          category: cat,
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
        };
      })
      .filter(item => item.amount > 0);

    const savingsAmount = this.mockSavingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

    return {
      totalBalance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      currentMonth: new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
      expensesByCategory,
      recentTransactions: transactions.slice(0, 5),
      totalSavings: savingsAmount,
      savingsProgress: (savingsAmount / 10000000) * 100
    };
  }

  /**
   * Obtiene todas las deudas
   */
  getDebts(): Debt[] {
    return JSON.parse(JSON.stringify(this.mockDebts));
  }

  /**
   * Obtiene todas las metas de ahorro
   */
  getSavingsGoals(): SavingsGoal[] {
    return JSON.parse(JSON.stringify(this.mockSavingsGoals));
  }

  /**
   * Calcula comparación de estrategias de deuda (snowball vs avalanche)
   */
  calculateDebtComparison(): DebtComparison {
    // Cálculo simplificado para mock
    return {
      snowball: {
        strategy: 'snowball',
        totalInterest: 2500000,
        monthsToPayOff: 48,
        paymentSchedule: []
      },
      avalanche: {
        strategy: 'avalanche',
        totalInterest: 2200000,
        monthsToPayOff: 45,
        paymentSchedule: []
      }
    };
  }

  /**
   * Genera agregaciones mensuales para reportes
   */
  getMonthlyAggregates(): MonthlyAggregate[] {
    const aggregates: MonthlyAggregate[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);

      const monthTransactions = this.getTransactions().filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.kind === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions
        .filter(t => t.kind === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      aggregates.push({
        month: date,
        income,
        expense,
        balance: income - expense,
        categoryBreakdown: {}
      });
    }
    return aggregates;
  }
}

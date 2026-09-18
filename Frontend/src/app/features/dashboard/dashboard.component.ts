import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TransactionService } from '../../core/services/transaction.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { DashboardData, Transaction, CategoryKind } from '../../core/models/domain.models';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * DashboardComponent
 * Página principal con resumen de finanzas
 * Muestra KPIs, gastos por categoría, transacciones recientes
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Spinner de carga -->
      <div *ngIf="isLoading" class="loading-overlay">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando datos...</p>
      </div>

      <!-- Título -->
      <div class="dashboard-header">
        <h1>Dashboard Financiero</h1>
        <p class="subtitle">Resumen de tu situación financiera</p>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <!-- Balance Total -->
        <mat-card class="kpi-card balance">
          <mat-card-content>
            <div class="kpi-icon">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Balance Total</span>
              <span class="kpi-value">{{ formatCurrency(dashboardData.totalBalance) }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Ingresos -->
        <mat-card class="kpi-card income">
          <mat-card-content>
            <div class="kpi-icon">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Ingresos</span>
              <span class="kpi-value">{{ formatCurrency(dashboardData.totalIncome) }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Gastos -->
        <mat-card class="kpi-card expense">
          <mat-card-content>
            <div class="kpi-icon">
              <mat-icon>trending_down</mat-icon>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Gastos</span>
              <span class="kpi-value">{{ formatCurrency(dashboardData.totalExpense) }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Ahorros -->
        <mat-card class="kpi-card savings">
          <mat-card-content>
            <div class="kpi-icon">
              <mat-icon>savings</mat-icon>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Total Ahorrado</span>
              <span class="kpi-value">{{ formatCurrency(dashboardData.totalSavings) }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Gastos por Categoría -->
      <mat-card class="chart-card">
        <mat-card-header>
          <mat-card-title>Gastos por Categoría</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="category-list">
            <div *ngIf="dashboardData.expensesByCategory.length === 0" class="empty-state">
              <mat-icon>category</mat-icon>
              <p>No hay gastos registrados</p>
            </div>

            <div *ngFor="let category of dashboardData.expensesByCategory" class="category-item">
              <div class="category-header">
                <span class="category-name">{{ category.category.nombre }}</span>
                <span class="category-amount">{{ formatCurrency(category.amount) }}</span>
              </div>
              <mat-progress-bar
                [value]="category.percentage"
                color="accent"
                mode="determinate"
              ></mat-progress-bar>
              <span class="category-percentage">{{ category.percentage.toFixed(1) }}%</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Transacciones Recientes -->
      <mat-card class="transactions-card">
        <mat-card-header>
          <mat-card-title>Transacciones Recientes</mat-card-title>
          <button
            mat-icon-button
            matTooltip="Ver todas"
            (click)="navigateTo('/transactions')"
            class="view-all-btn"
          >
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div class="transactions-list">
            <div *ngIf="dashboardData.recentTransactions.length === 0" class="empty-state">
              <mat-icon>receipt</mat-icon>
              <p>No hay transacciones</p>
            </div>

            <div *ngFor="let transaction of dashboardData.recentTransactions" class="transaction-item">
              <div class="transaction-left">
                <div class="transaction-icon" [ngClass]="transaction.kind">
                  <mat-icon>{{ getTransactionIcon(transaction.kind) }}</mat-icon>
                </div>
                <div class="transaction-info">
                  <span class="transaction-category">{{ transaction.category?.nombre }}</span>
                  <span class="transaction-description">{{ transaction.description }}</span>
                </div>
              </div>
              <div class="transaction-right">
                <span class="transaction-amount" [ngClass]="transaction.kind">
                  {{ formatCurrency(transaction.amount) }}
                </span>
                <span class="transaction-date">{{ formatDate(transaction.date) }}</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: var(--spacing-lg);
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
        position: relative;
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(11, 18, 32, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-lg);
        z-index: 1000;

        p {
          color: var(--color-text-secondary);
          margin: 0;
        }
      }

      .dashboard-header {
        margin-bottom: var(--spacing-2xl);

        h1 {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }

        .subtitle {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-2xl);
      }

      .kpi-card {
        background-color: var(--color-bg-card) !important;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: all var(--transition-base);

        &:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        mat-card-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
        }

        .kpi-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-lg);
          font-size: 32px;
        }

        &.balance .kpi-icon {
          background: rgba(16, 185, 129, 0.15);
          color: var(--color-success);
        }

        &.income .kpi-icon {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        &.expense .kpi-icon {
          background: rgba(239, 68, 68, 0.15);
          color: var(--color-danger);
        }

        &.savings .kpi-icon {
          background: rgba(59, 130, 246, 0.15);
          color: var(--color-info);
        }

        .kpi-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .kpi-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .kpi-value {
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-text-primary);
        }
      }

      .chart-card,
      .transactions-card {
        background-color: var(--color-bg-card) !important;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        margin-bottom: var(--spacing-lg);
      }

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--color-border);
      }

      mat-card-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
      }

      .view-all-btn {
        color: var(--color-primary);
      }

      .category-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .category-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category-name {
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .category-amount {
          color: var(--color-text-secondary);
          font-weight: 600;
        }

        .category-percentage {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }
      }

      .transactions-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .transaction-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        background-color: var(--color-bg-input);
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);

        &:hover {
          background-color: var(--color-bg-darker);
        }
      }

      .transaction-left {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        flex: 1;
      }

      .transaction-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 20px;

        &.income {
          background: rgba(16, 185, 129, 0.15);
          color: var(--color-success);
        }

        &.expense {
          background: rgba(239, 68, 68, 0.15);
          color: var(--color-danger);
        }

        &.debt {
          background: rgba(249, 115, 22, 0.15);
          color: var(--color-warning);
        }

        &.saving {
          background: rgba(59, 130, 246, 0.15);
          color: var(--color-info);
        }
      }

      .transaction-info {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .transaction-category {
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .transaction-description {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .transaction-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--spacing-xs);
      }

      .transaction-amount {
        font-weight: 700;
        font-size: var(--font-size-base);

        &.income {
          color: var(--color-success);
        }

        &.expense,
        &.debt {
          color: var(--color-danger);
        }

        &.saving {
          color: var(--color-info);
        }
      }

      .transaction-date {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-2xl);
        color: var(--color-text-muted);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          opacity: 0.5;
          margin-bottom: var(--spacing-md);
        }

        p {
          margin: 0;
        }
      }
    `
  ]
})
export class DashboardComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private mockDataService = inject(MockDataService);
  private router = inject(Router);

  isLoading = true;
  dashboardData: DashboardData = {
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    currentMonth: '',
    expensesByCategory: [],
    recentTransactions: [],
    totalSavings: 0,
    savingsProgress: 0
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.transactionService.getTransactions().pipe(
      timeout(10000),
      catchError((error) => {
        console.warn('Error loading transactions:', error);
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (transactions) => {
        if (transactions && transactions.length > 0) {
          console.log('Loaded transactions from API:', transactions.length);
          this.processDashboardData(transactions);
        } else {
          console.log('No transactions or empty response, using mock data');
          this.dashboardData = this.mockDataService.getDashboardData();
        }
      },
      error: (error) => {
        console.error('Dashboard error:', error);
        this.dashboardData = this.mockDataService.getDashboardData();
      }
    });
  }

  private processDashboardData(transactions: Transaction[]): void {
    const now = new Date();
    const currentMonth = new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric'
    }).format(now);

    const income = transactions
      .filter(t => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.kind === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categoryMap = new Map<string, { amount: number; category: any }>();
    transactions
      .filter(t => t.kind === 'expense' && t.category)
      .forEach(t => {
        const key = t.category!.id;
        if (!categoryMap.has(key)) {
          categoryMap.set(key, { amount: 0, category: t.category });
        }
        categoryMap.get(key)!.amount += Math.abs(t.amount);
      });

    const totalExpense = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.amount, 0);
    const expensesByCategory = Array.from(categoryMap.values()).map(c => ({
      category: c.category,
      amount: c.amount,
      percentage: totalExpense > 0 ? (c.amount / totalExpense) * 100 : 0
    }));

    this.dashboardData = {
      totalBalance: income - expense,
      totalIncome: income,
      totalExpense: expense,
      currentMonth,
      expensesByCategory,
      recentTransactions: transactions.slice(0, 5),
      totalSavings: transactions
        .filter(t => t.kind === 'saving')
        .reduce((sum, t) => sum + t.amount, 0),
      savingsProgress: 65
    };
  }

  /**
   * Formatea un número como moneda COP
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formatea una fecha a formato legible
   */
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  }

  /**
   * Retorna el ícono para cada tipo de transacción
   */
  getTransactionIcon(kind: string): string {
    const icons: { [key: string]: string } = {
      income: 'trending_up',
      expense: 'trending_down',
      debt: 'credit_card',
      saving: 'savings'
    };
    return icons[kind] || 'receipt';
  }

  /**
   * Navega a una ruta
   */
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../../core/services/transaction.service';
import { Transaction } from '../../../core/models/domain.models';

interface MonthSummary {
  index: number;
  nombre: string;
  corto: string;
  income: number;
  expense: number;
  balance: number;
}

@Component({
  selector: 'app-monthly',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <div class="report-container">
      <div class="report-header">
        <div>
          <h1>Reporte Mensual</h1>
          <p class="subtitle">Ingresos y gastos mes a mes</p>
        </div>

        <mat-form-field appearance="outline" class="year-select">
          <mat-label>Año</mat-label>
          <mat-select [value]="selectedYear()" (selectionChange)="selectedYear.set($event.value)">
            <mat-option *ngFor="let year of availableYears()" [value]="year">{{ year }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="totals-grid">
        <mat-card class="total-card income">
          <span class="total-label">Ingresos del año</span>
          <span class="total-value">{{ formatCurrency(yearTotals().income) }}</span>
        </mat-card>
        <mat-card class="total-card expense">
          <span class="total-label">Gastos del año</span>
          <span class="total-value">{{ formatCurrency(yearTotals().expense) }}</span>
        </mat-card>
        <mat-card class="total-card balance">
          <span class="total-label">Balance</span>
          <span class="total-value" [class.negative]="yearTotals().balance < 0">
            {{ formatCurrency(yearTotals().balance) }}
          </span>
        </mat-card>
        <mat-card class="total-card average">
          <span class="total-label">Gasto medio mensual</span>
          <span class="total-value">{{ formatCurrency(yearTotals().averageExpense) }}</span>
        </mat-card>
      </div>

      <mat-card class="chart-card">
        <h2>Evolución mensual</h2>

        <div class="legend">
          <span class="legend-item"><i class="swatch income"></i> Ingresos</span>
          <span class="legend-item"><i class="swatch expense"></i> Gastos</span>
        </div>

        <div class="chart" *ngIf="chartMax() > 0; else sinDatos">
          <div class="chart-month" *ngFor="let month of monthlyData()">
            <div class="bars" [title]="month.nombre">
              <div
                class="bar income"
                [style.height.%]="barHeight(month.income)"
                [attr.aria-label]="month.nombre + ': ingresos ' + formatCurrency(month.income)"
              ></div>
              <div
                class="bar expense"
                [style.height.%]="barHeight(month.expense)"
                [attr.aria-label]="month.nombre + ': gastos ' + formatCurrency(month.expense)"
              ></div>
            </div>
            <span class="month-label">{{ month.corto }}</span>
          </div>
        </div>

        <ng-template #sinDatos>
          <div class="empty-state">
            <mat-icon>bar_chart</mat-icon>
            <p>No hay movimientos registrados en {{ selectedYear() }}</p>
          </div>
        </ng-template>
      </mat-card>

      <mat-card class="detail-card" *ngIf="chartMax() > 0">
        <h2>Detalle por mes</h2>
        <table class="detail-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Ingresos</th>
              <th>Gastos</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let month of monthsWithActivity()">
              <td>{{ month.nombre }}</td>
              <td class="income">{{ formatCurrency(month.income) }}</td>
              <td class="expense">{{ formatCurrency(month.expense) }}</td>
              <td [class.negative]="month.balance < 0" [class.positive]="month.balance >= 0">
                {{ formatCurrency(month.balance) }}
              </td>
            </tr>
          </tbody>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .report-container {
      padding: var(--spacing-lg);
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-lg);
      flex-wrap: wrap;
    }

    h1 {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-2xl);
    }

    .subtitle {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .year-select {
      width: 140px;
    }

    .totals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .total-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      padding: var(--spacing-lg);
      border-left: 3px solid var(--color-border);
    }

    .total-card.income { border-left-color: var(--color-success); }
    .total-card.expense { border-left-color: var(--color-danger); }
    .total-card.balance { border-left-color: var(--color-primary); }
    .total-card.average { border-left-color: var(--color-info); }

    .total-label {
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted);
    }

    .total-value {
      font-size: var(--font-size-xl);
      font-weight: 700;
    }

    .total-value.negative { color: var(--color-danger); }

    .chart-card, .detail-card {
      padding: var(--spacing-lg);
    }

    h2 {
      margin: 0 0 var(--spacing-md);
      font-size: var(--font-size-lg);
    }

    .legend {
      display: flex;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .swatch {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      display: inline-block;
    }

    .swatch.income { background-color: var(--color-success); }
    .swatch.expense { background-color: var(--color-danger); }

    .chart {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--spacing-xs);
      height: 240px;
      align-items: end;
    }

    .chart-month {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      height: 100%;
      justify-content: flex-end;
    }

    .bars {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 3px;
      height: 100%;
      width: 100%;
    }

    .bar {
      width: 45%;
      min-height: 2px;
      border-radius: 4px 4px 0 0;
      transition: height var(--transition-base), opacity var(--transition-fast);
    }

    .bar:hover { opacity: 0.75; }
    .bar.income { background-color: var(--color-success); }
    .bar.expense { background-color: var(--color-danger); }

    .month-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .detail-table {
      width: 100%;
      border-collapse: collapse;
    }

    .detail-table th {
      text-align: left;
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .detail-table td {
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
    }

    .detail-table th:not(:first-child),
    .detail-table td:not(:first-child) {
      text-align: right;
    }

    .detail-table .income { color: var(--color-success); }
    .detail-table .expense { color: var(--color-danger); }
    .detail-table .negative { color: var(--color-danger); font-weight: 600; }
    .detail-table .positive { color: var(--color-success); font-weight: 600; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-2xl);
      color: var(--color-text-muted);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
      margin-bottom: var(--spacing-md);
    }

    .empty-state p { margin: 0; }
  `]
})
export class MonthlyComponent implements OnInit {
  private transactionService = inject(TransactionService);

  private static readonly MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  transactions = signal<Transaction[]>([]);
  selectedYear = signal<number>(new Date().getFullYear());

  availableYears = computed(() => {
    const years = new Set(this.transactions().map(t => new Date(t.date).getFullYear()));
    years.add(this.selectedYear());
    return [...years].sort((a, b) => b - a);
  });

  monthlyData = computed<MonthSummary[]>(() => {
    const year = this.selectedYear();
    const meses: MonthSummary[] = MonthlyComponent.MESES.map((nombre, index) => ({
      index,
      nombre,
      corto: nombre.slice(0, 3),
      income: 0,
      expense: 0,
      balance: 0
    }));

    for (const transaction of this.transactions()) {
      const date = new Date(transaction.date);
      if (date.getFullYear() !== year) continue;

      const mes = meses[date.getMonth()];
      if (transaction.kind === 'income') {
        mes.income += Math.abs(transaction.amount);
      } else if (transaction.kind === 'expense' || transaction.kind === 'debt') {
        mes.expense += Math.abs(transaction.amount);
      }
    }

    for (const mes of meses) {
      mes.balance = mes.income - mes.expense;
    }

    return meses;
  });

  monthsWithActivity = computed(() =>
    this.monthlyData().filter(m => m.income > 0 || m.expense > 0)
  );

  chartMax = computed(() =>
    Math.max(0, ...this.monthlyData().flatMap(m => [m.income, m.expense]))
  );

  yearTotals = computed(() => {
    const meses = this.monthlyData();
    const income = meses.reduce((sum, m) => sum + m.income, 0);
    const expense = meses.reduce((sum, m) => sum + m.expense, 0);
    const activos = this.monthsWithActivity().length;

    return {
      income,
      expense,
      balance: income - expense,
      averageExpense: activos > 0 ? expense / activos : 0
    };
  });

  ngOnInit() {
    this.transactionService.getTransactions().subscribe({
      next: (data) => this.transactions.set(data ?? []),
      error: () => this.transactions.set([])
    });
  }

  barHeight(value: number): number {
    const max = this.chartMax();
    return max > 0 ? (value / max) * 100 : 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

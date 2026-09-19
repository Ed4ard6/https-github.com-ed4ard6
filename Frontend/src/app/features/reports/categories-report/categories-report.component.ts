import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../../core/services/transaction.service';
import { Transaction } from '../../../core/models/domain.models';

interface CategoryRow {
  nombre: string;
  total: number;
  count: number;
  percentage: number;
  average: number;
}

@Component({
  selector: 'app-categories-report',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <div class="report-container">
      <div class="report-header">
        <div>
          <h1>Gasto por categoría</h1>
          <p class="subtitle">En qué se reparte lo que gastas</p>
        </div>

        <mat-form-field appearance="outline" class="year-select">
          <mat-label>Año</mat-label>
          <mat-select [value]="selectedYear()" (selectionChange)="selectedYear.set($event.value)">
            <mat-option value="all">Todos</mat-option>
            <mat-option *ngFor="let year of availableYears()" [value]="year">{{ year }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <mat-card class="chart-card" *ngIf="rows().length > 0; else sinDatos">
        <div class="total-line">
          <span>Total del periodo</span>
          <strong>{{ formatCurrency(total()) }}</strong>
        </div>

        <div class="category-row" *ngFor="let row of rows(); let i = index">
          <div class="row-head">
            <span class="row-name">
              <i class="dot" [style.background-color]="colorFor(i)"></i>
              {{ row.nombre }}
            </span>
            <span class="row-total">{{ formatCurrency(row.total) }}</span>
          </div>

          <div class="row-track">
            <div class="row-bar" [style.width.%]="row.percentage" [style.background-color]="colorFor(i)"></div>
          </div>

          <div class="row-meta">
            <span>{{ row.percentage | number: '1.0-1' }}% del total</span>
            <span>{{ row.count }} {{ row.count === 1 ? 'movimiento' : 'movimientos' }}</span>
            <span>media {{ formatCurrency(row.average) }}</span>
          </div>
        </div>
      </mat-card>

      <ng-template #sinDatos>
        <mat-card class="chart-card">
          <div class="empty-state">
            <mat-icon>donut_large</mat-icon>
            <p>No hay gastos registrados en este periodo</p>
          </div>
        </mat-card>
      </ng-template>
    </div>
  `,
  styles: [`
    .report-container {
      padding: var(--spacing-lg);
      max-width: 900px;
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

    .year-select { width: 140px; }

    .chart-card {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .total-line strong {
      font-size: var(--font-size-xl);
      color: var(--color-text-primary);
    }

    .category-row {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .row-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
    }

    .row-name {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-weight: 600;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .row-total {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .row-track {
      height: 10px;
      background: rgba(148, 163, 184, 0.12);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .row-bar {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width var(--transition-base);
    }

    .row-meta {
      display: flex;
      gap: var(--spacing-lg);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      flex-wrap: wrap;
    }

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
export class CategoriesReportComponent implements OnInit {
  private transactionService = inject(TransactionService);

  private static readonly COLORS = [
    '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6'
  ];

  private transactions = signal<Transaction[]>([]);
  selectedYear = signal<string | number>('all');

  availableYears = computed(() => {
    const years = new Set(this.transactions().map(t => new Date(t.date).getFullYear()));
    return [...years].sort((a, b) => b - a);
  });

  rows = computed<CategoryRow[]>(() => {
    const year = this.selectedYear();

    const gastos = this.transactions().filter(t => {
      if (t.kind !== 'expense' && t.kind !== 'debt') return false;
      if (year === 'all') return true;
      return new Date(t.date).getFullYear() === Number(year);
    });

    const porCategoria = new Map<string, { total: number; count: number }>();
    for (const t of gastos) {
      const nombre = t.categoryName || t.category?.nombre || 'Sin categoría';
      const actual = porCategoria.get(nombre) ?? { total: 0, count: 0 };
      porCategoria.set(nombre, {
        total: actual.total + Math.abs(t.amount),
        count: actual.count + 1
      });
    }

    const total = [...porCategoria.values()].reduce((sum, v) => sum + v.total, 0);

    return [...porCategoria.entries()]
      .map(([nombre, v]) => ({
        nombre,
        total: v.total,
        count: v.count,
        percentage: total > 0 ? (v.total / total) * 100 : 0,
        average: v.count > 0 ? v.total / v.count : 0
      }))
      .sort((a, b) => b.total - a.total);
  });

  total = computed(() => this.rows().reduce((sum, r) => sum + r.total, 0));

  ngOnInit() {
    this.transactionService.getTransactions().subscribe({
      next: (data) => this.transactions.set(data ?? []),
      error: () => this.transactions.set([])
    });
  }

  colorFor(index: number): string {
    return CategoriesReportComponent.COLORS[index % CategoriesReportComponent.COLORS.length];
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

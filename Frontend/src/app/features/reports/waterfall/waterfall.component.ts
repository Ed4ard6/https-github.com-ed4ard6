import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../../core/services/transaction.service';
import { Transaction } from '../../../core/models/domain.models';

interface WaterfallStep {
  label: string;
  amount: number;
  start: number;
  end: number;
  type: 'income' | 'expense' | 'total';
}

@Component({
  selector: 'app-waterfall',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <div class="report-container">
      <div class="report-header">
        <div>
          <h1>Flujo de caja</h1>
          <p class="subtitle">De lo que entra a lo que queda, paso a paso</p>
        </div>

        <mat-form-field appearance="outline" class="period-select">
          <mat-label>Periodo</mat-label>
          <mat-select [value]="selectedPeriod()" (selectionChange)="selectedPeriod.set($event.value)">
            <mat-option value="all">Todo</mat-option>
            <mat-option *ngFor="let period of availablePeriods()" [value]="period.value">
              {{ period.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <mat-card class="chart-card" *ngIf="steps().length > 0; else sinDatos">
        <div class="waterfall">
          <div class="step" *ngFor="let step of steps()" [class]="step.type">
            <span class="step-label">{{ step.label }}</span>

            <div class="step-track">
              <div
                class="step-bar"
                [style.margin-left.%]="barOffset(step)"
                [style.width.%]="barWidth(step)"
              ></div>
            </div>

            <span class="step-amount">
              {{ step.type === 'expense' ? '−' : '' }}{{ formatCurrency(step.amount) }}
            </span>
          </div>
        </div>

        <div class="result" [class.negative]="balance() < 0">
          <mat-icon>{{ balance() >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
          <span>
            {{ balance() >= 0
              ? 'Te quedaron ' + formatCurrency(balance())
              : 'Gastaste ' + formatCurrency(-balance()) + ' más de lo que ingresaste' }}
          </span>
        </div>
      </mat-card>

      <ng-template #sinDatos>
        <mat-card class="chart-card">
          <div class="empty-state">
            <mat-icon>waterfall_chart</mat-icon>
            <p>No hay movimientos en este periodo</p>
          </div>
        </mat-card>
      </ng-template>
    </div>
  `,
  styles: [`
    .report-container {
      padding: var(--spacing-lg);
      max-width: 1000px;
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

    .period-select { width: 200px; }

    .chart-card { padding: var(--spacing-lg); }

    .waterfall {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .step {
      display: grid;
      grid-template-columns: minmax(120px, 1.2fr) 3fr minmax(110px, auto);
      gap: var(--spacing-md);
      align-items: center;

      @media (max-width: 680px) {
        grid-template-columns: 1fr;
        gap: var(--spacing-xs);
        padding-bottom: var(--spacing-sm);
      }
    }

    .step-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .step-track {
      height: 28px;
      display: flex;
      align-items: center;
      background: rgba(148, 163, 184, 0.06);
      border-radius: var(--radius-sm);
    }

    .step-bar {
      height: 100%;
      border-radius: var(--radius-sm);
      min-width: 2px;
      transition: width var(--transition-base), margin-left var(--transition-base);
    }

    .step.income .step-bar { background-color: var(--color-success); }
    .step.expense .step-bar { background-color: var(--color-danger); }
    .step.total .step-bar { background-color: var(--color-primary); }

    .step-amount {
      text-align: right;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .step.income .step-amount { color: var(--color-success); }
    .step.expense .step-amount { color: var(--color-danger); }

    .step.total {
      margin-top: var(--spacing-sm);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }

    .step.total .step-label,
    .step.total .step-amount {
      font-weight: 700;
      color: var(--color-text-primary);
      font-size: var(--font-size-base);
    }

    .result {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-lg);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      background: rgba(16, 185, 129, 0.1);
      color: var(--color-success);
      font-weight: 600;
    }

    .result.negative {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-danger);
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
export class WaterfallComponent implements OnInit {
  private transactionService = inject(TransactionService);

  private transactions = signal<Transaction[]>([]);
  selectedPeriod = signal<string>('all');

  availablePeriods = computed(() => {
    const periods = new Map<string, string>();

    for (const t of this.transactions()) {
      const date = new Date(t.date);
      const value = `${date.getFullYear()}-${date.getMonth()}`;
      const label = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(date);
      periods.set(value, label);
    }

    return [...periods.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => b.value.localeCompare(a.value));
  });

  private periodTransactions = computed(() => {
    const period = this.selectedPeriod();
    if (period === 'all') return this.transactions();

    const [year, month] = period.split('-').map(Number);
    return this.transactions().filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  });

  // Cada paso arranca donde terminó el anterior: eso da el efecto cascada.
  steps = computed<WaterfallStep[]>(() => {
    const items = this.periodTransactions();
    if (items.length === 0) return [];

    const income = items
      .filter(t => t.kind === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const porCategoria = new Map<string, number>();
    for (const t of items) {
      if (t.kind !== 'expense' && t.kind !== 'debt') continue;
      const nombre = t.categoryName || t.category?.nombre || 'Sin categoría';
      porCategoria.set(nombre, (porCategoria.get(nombre) ?? 0) + Math.abs(t.amount));
    }

    const steps: WaterfallStep[] = [
      { label: 'Ingresos', amount: income, start: 0, end: income, type: 'income' }
    ];

    let acumulado = income;
    for (const [nombre, monto] of [...porCategoria.entries()].sort((a, b) => b[1] - a[1])) {
      steps.push({
        label: nombre,
        amount: monto,
        start: acumulado - monto,
        end: acumulado,
        type: 'expense'
      });
      acumulado -= monto;
    }

    steps.push({ label: 'Balance', amount: acumulado, start: 0, end: acumulado, type: 'total' });
    return steps;
  });

  balance = computed(() => {
    const steps = this.steps();
    return steps.length > 0 ? steps[steps.length - 1].amount : 0;
  });

  private scale = computed(() => {
    const valores = this.steps().flatMap(s => [Math.abs(s.start), Math.abs(s.end)]);
    return Math.max(1, ...valores);
  });

  ngOnInit() {
    this.transactionService.getTransactions().subscribe({
      next: (data) => this.transactions.set(data ?? []),
      error: () => this.transactions.set([])
    });
  }

  barOffset(step: WaterfallStep): number {
    const min = Math.min(step.start, step.end);
    return (Math.max(0, min) / this.scale()) * 100;
  }

  barWidth(step: WaterfallStep): number {
    const ancho = Math.abs(step.end - step.start);
    return Math.max(1, (ancho / this.scale()) * 100);
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

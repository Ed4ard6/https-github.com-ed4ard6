import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../../core/services/transaction.service';
import { Transaction } from '../../../core/models/domain.models';

interface DayCell {
  day: number | null;
  total: number;
  count: number;
  intensity: number;
  isToday: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="report-container">
      <div class="report-header">
        <div>
          <h1>Calendario de gastos</h1>
          <p class="subtitle">En qué días se te va el dinero</p>
        </div>

        <div class="month-nav">
          <button mat-icon-button (click)="previousMonth()" aria-label="Mes anterior">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span class="month-name">{{ monthName() }}</span>
          <button mat-icon-button (click)="nextMonth()" aria-label="Mes siguiente">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>

      <div class="summary-grid">
        <mat-card class="summary-card">
          <span class="summary-label">Gasto del mes</span>
          <span class="summary-value">{{ formatCurrency(monthTotal()) }}</span>
        </mat-card>
        <mat-card class="summary-card">
          <span class="summary-label">Días con gasto</span>
          <span class="summary-value">{{ daysWithSpending() }}</span>
        </mat-card>
        <mat-card class="summary-card">
          <span class="summary-label">Media por día activo</span>
          <span class="summary-value">{{ formatCurrency(averagePerActiveDay()) }}</span>
        </mat-card>
        <mat-card class="summary-card">
          <span class="summary-label">Día más caro</span>
          <span class="summary-value">{{ formatCurrency(maxDay()) }}</span>
        </mat-card>
      </div>

      <mat-card class="calendar-card">
        <div class="weekdays">
          <span *ngFor="let weekday of weekdays">{{ weekday }}</span>
        </div>

        <div class="calendar-grid">
          <div
            *ngFor="let cell of cells()"
            class="day-cell"
            [class.empty]="cell.day === null"
            [class.today]="cell.isToday"
            [style.background-color]="cellColor(cell)"
            [title]="cellTitle(cell)"
          >
            <span class="day-number" *ngIf="cell.day !== null">{{ cell.day }}</span>
            <span class="day-amount" *ngIf="cell.total > 0">{{ compactCurrency(cell.total) }}</span>
          </div>
        </div>

        <div class="scale">
          <span>Menos</span>
          <i class="scale-box" *ngFor="let level of [0.15, 0.35, 0.6, 0.85, 1]"
             [style.background-color]="'rgba(239, 68, 68, ' + level + ')'"></i>
          <span>Más</span>
        </div>
      </mat-card>
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

    .month-nav {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .month-name {
      min-width: 160px;
      text-align: center;
      font-weight: 600;
      text-transform: capitalize;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: var(--spacing-md);
    }

    .summary-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      padding: var(--spacing-md) var(--spacing-lg);
    }

    .summary-label {
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted);
    }

    .summary-value {
      font-size: var(--font-size-lg);
      font-weight: 700;
    }

    .calendar-card { padding: var(--spacing-lg); }

    .weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-sm);
    }

    .weekdays span {
      text-align: center;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: var(--spacing-xs);
    }

    .day-cell {
      aspect-ratio: 1;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 4px;
      transition: transform var(--transition-fast);
    }

    .day-cell:not(.empty):hover {
      transform: scale(1.06);
    }

    .day-cell.empty {
      border-color: transparent;
      background: transparent !important;
    }

    .day-cell.today {
      border-color: var(--color-primary);
      border-width: 2px;
    }

    .day-number {
      font-size: var(--font-size-sm);
      font-weight: 600;
    }

    .day-amount {
      font-size: 10px;
      opacity: 0.9;
      white-space: nowrap;
    }

    .scale {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-xs);
      margin-top: var(--spacing-lg);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .scale-box {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      display: inline-block;
    }
  `]
})
export class CalendarComponent implements OnInit {
  private transactionService = inject(TransactionService);

  private transactions = signal<Transaction[]>([]);
  private reference = signal(new Date());

  weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  monthName = computed(() =>
    new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(this.reference())
  );

  private dailyTotals = computed(() => {
    const ref = this.reference();
    const totals = new Map<number, { total: number; count: number }>();

    for (const t of this.transactions()) {
      if (t.kind !== 'expense' && t.kind !== 'debt') continue;

      const date = new Date(t.date);
      if (date.getFullYear() !== ref.getFullYear() || date.getMonth() !== ref.getMonth()) continue;

      const day = date.getDate();
      const actual = totals.get(day) ?? { total: 0, count: 0 };
      totals.set(day, { total: actual.total + Math.abs(t.amount), count: actual.count + 1 });
    }

    return totals;
  });

  cells = computed<DayCell[]>(() => {
    const ref = this.reference();
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const totals = this.dailyTotals();
    const max = Math.max(1, ...[...totals.values()].map(v => v.total));

    const diasEnMes = new Date(year, month + 1, 0).getDate();
    // getDay() devuelve 0 para domingo; la rejilla empieza en lunes.
    const primerDia = (new Date(year, month, 1).getDay() + 6) % 7;

    const hoy = new Date();
    const esMesActual = hoy.getFullYear() === year && hoy.getMonth() === month;

    const cells: DayCell[] = [];

    for (let i = 0; i < primerDia; i++) {
      cells.push({ day: null, total: 0, count: 0, intensity: 0, isToday: false });
    }

    for (let day = 1; day <= diasEnMes; day++) {
      const data = totals.get(day);
      const total = data?.total ?? 0;
      cells.push({
        day,
        total,
        count: data?.count ?? 0,
        intensity: total > 0 ? total / max : 0,
        isToday: esMesActual && hoy.getDate() === day
      });
    }

    return cells;
  });

  monthTotal = computed(() =>
    [...this.dailyTotals().values()].reduce((sum, v) => sum + v.total, 0)
  );

  daysWithSpending = computed(() => this.dailyTotals().size);

  averagePerActiveDay = computed(() => {
    const dias = this.daysWithSpending();
    return dias > 0 ? this.monthTotal() / dias : 0;
  });

  maxDay = computed(() => Math.max(0, ...[...this.dailyTotals().values()].map(v => v.total)));

  ngOnInit() {
    this.transactionService.getTransactions().subscribe({
      next: (data) => this.transactions.set(data ?? []),
      error: () => this.transactions.set([])
    });
  }

  previousMonth() {
    const ref = this.reference();
    this.reference.set(new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
  }

  nextMonth() {
    const ref = this.reference();
    this.reference.set(new Date(ref.getFullYear(), ref.getMonth() + 1, 1));
  }

  cellColor(cell: DayCell): string {
    if (cell.day === null || cell.total === 0) return 'transparent';
    // Mínimo 0.15 para que un día con gasto pequeño siga siendo visible.
    return `rgba(239, 68, 68, ${Math.max(0.15, cell.intensity)})`;
  }

  cellTitle(cell: DayCell): string {
    if (cell.day === null) return '';
    if (cell.total === 0) return `Día ${cell.day}: sin gastos`;
    return `Día ${cell.day}: ${this.formatCurrency(cell.total)} en ${cell.count} ${cell.count === 1 ? 'gasto' : 'gastos'}`;
  }

  compactCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
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

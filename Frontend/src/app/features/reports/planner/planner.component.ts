import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SalaryService } from '../../../core/services/salary.service';
import { DebtService } from '../../../core/services/debt.service';
import { BudgetService, Budget } from '../../../core/services/budget.service';
import { Debt } from '../../../core/models/domain.models';
import { buildPaydayPlan } from '../../../core/finance/payday-plan';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="planner-container">
      <div class="header">
        <div>
          <h1>Planificador quincenal</h1>
          <p class="subtitle">Cómo reparte tu salario entre las dos quincenas</p>
        </div>
      </div>

      <mat-card class="salary-card">
        <h2>Tu salario mensual</h2>

        <div class="salary-form">
          <mat-form-field appearance="outline">
            <mat-label>Salario mensual</mat-label>
            <input matInput type="number" [(ngModel)]="salaryInput" step="100000" />
            <span matTextPrefix>$&nbsp;</span>
            <mat-hint *ngIf="salary() > 0">
              Guardado: {{ formatCurrency(salary()) }}
            </mat-hint>
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="saveSalary()" [disabled]="salaryInput <= 0 || saving()">
            <mat-icon>save</mat-icon>
            Guardar
          </button>
        </div>
      </mat-card>

      <mat-card class="empty-card" *ngIf="salary() <= 0">
        <div class="empty-state">
          <mat-icon>payments</mat-icon>
          <p>Registra tu salario para ver el reparto por quincenas</p>
        </div>
      </mat-card>

      <div class="quincenas-grid" *ngIf="salary() > 0">
        <mat-card class="quincena-card" *ngFor="let q of quincenas()" [class.negative]="q.available < 0">
          <div class="quincena-head">
            <h3>{{ q.titulo }}</h3>
            <span class="quincena-range">{{ q.rango }}</span>
          </div>

          <div class="quincena-rows">
            <div class="row">
              <span class="row-label">Ingreso</span>
              <span class="row-value income">{{ formatCurrency(q.income) }}</span>
            </div>
            <div class="row">
              <span class="row-label">Compromisos</span>
              <span class="row-value expense">−{{ formatCurrency(q.committed) }}</span>
            </div>
            <div class="row total">
              <span class="row-label">{{ q.available >= 0 ? 'Te queda' : 'Te falta' }}</span>
              <span class="row-value" [class.negative]="q.available < 0">
                {{ formatCurrency(abs(q.available)) }}
              </span>
            </div>
          </div>

          <mat-progress-bar
            mode="determinate"
            [value]="q.usedPercentage"
            [color]="q.available < 0 ? 'warn' : 'primary'"
          ></mat-progress-bar>
          <span class="used-label">{{ q.usedPercentage | number: '1.0-0' }}% comprometido</span>

          <div class="commitments" *ngIf="q.commitments.length > 0">
            <div class="commitment" *ngFor="let c of q.commitments">
              <mat-icon>{{ c.tipo === 'deuda' ? 'credit_card' : 'account_balance_wallet' }}</mat-icon>
              <span class="commitment-name">
                {{ c.nombre }}
                <small *ngIf="c.day">día {{ c.day }}</small>
              </span>
              <span class="commitment-amount">{{ formatCurrency(c.amount) }}</span>
            </div>
          </div>

          <p class="no-commitments" *ngIf="q.commitments.length === 0">
            Sin pagos comprometidos en esta quincena
          </p>
        </mat-card>
      </div>

      <mat-card class="notes" *ngIf="salary() > 0">
        <mat-icon>info</mat-icon>
        <p>
          Las cuotas de deuda caen en la quincena que corresponde a su día de pago.
          Los presupuestos del mes se reparten a partes iguales entre las dos, porque
          el gasto del día a día no tiene fecha fija.
        </p>
      </mat-card>
    </div>
  `,
  styles: [`
    .planner-container {
      padding: var(--spacing-lg);
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
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

    .salary-card { padding: var(--spacing-lg); }

    h2 {
      margin: 0 0 var(--spacing-lg);
      font-size: var(--font-size-lg);
    }

    .salary-form {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--spacing-md);
      align-items: start;

      button { height: 56px; }

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
        button { height: 48px; }
      }
    }

    .quincenas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--spacing-lg);
    }

    .quincena-card {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      border: 1px solid transparent;
    }

    .quincena-card.negative { border-color: var(--color-danger); }

    .quincena-head h3 {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-lg);
    }

    .quincena-range {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .quincena-rows {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .row-label {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .row-value {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .row-value.income { color: var(--color-success); }
    .row-value.expense { color: var(--color-danger); }

    .row.total {
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--color-border);
    }

    .row.total .row-label,
    .row.total .row-value {
      font-size: var(--font-size-lg);
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .row.total .row-value.negative { color: var(--color-danger); }

    .used-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .commitments {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }

    .commitment {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-sm);
    }

    .commitment mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--color-text-muted);
    }

    .commitment-name {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .commitment-name small {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .commitment-amount {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .no-commitments {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }

    .notes {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border-left: 3px solid var(--color-info);
    }

    .notes mat-icon {
      color: var(--color-info);
      flex-shrink: 0;
    }

    .notes p {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .empty-card { padding: var(--spacing-lg); }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-2xl);
      color: var(--color-text-muted);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    .empty-state p { margin: 0; }
  `]
})
export class PlannerComponent implements OnInit {
  private salaryService = inject(SalaryService);
  private debtService = inject(DebtService);
  private budgetService = inject(BudgetService);
  private snackBar = inject(MatSnackBar);

  salary = signal(0);
  debts = signal<Debt[]>([]);
  budgets = signal<Budget[]>([]);
  saving = signal(false);

  salaryInput = 0;

  quincenas = computed(() =>
    buildPaydayPlan(
      this.salary(),
      this.debts().map(d => ({
        nombre: d.nombre,
        minimumPayment: d.minimumPayment,
        paymentDay: d.paymentDay
      })),
      this.budgets().reduce((sum, b) => sum + b.amount, 0)
    )
  );

  ngOnInit() {
    forkJoin({
      salary: this.salaryService.getCurrentSalary().pipe(catchError(() => of(null))),
      debts: this.debtService.getDebts().pipe(catchError(() => of([]))),
      budgets: this.budgetService
        .getBudgets(new Date().getMonth() + 1, new Date().getFullYear())
        .pipe(catchError(() => of([])))
    }).subscribe(({ salary, debts, budgets }) => {
      const amount = salary?.amount ?? 0;
      this.salary.set(amount);
      this.salaryInput = amount;
      this.debts.set(debts ?? []);
      this.budgets.set(budgets ?? []);
    });
  }

  saveSalary() {
    if (this.salaryInput <= 0) return;

    this.saving.set(true);
    this.salaryService.saveSalary(Number(this.salaryInput)).subscribe({
      next: (salary) => {
        this.salary.set(salary.amount);
        this.saving.set(false);
        this.snackBar.open('Salario guardado', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'No se pudo guardar', 'Cerrar', { duration: 5000 });
        this.saving.set(false);
      }
    });
  }

  abs(value: number): number {
    return Math.abs(value);
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

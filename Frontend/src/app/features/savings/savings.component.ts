import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SavingsGoalService, SavingsGoal } from '../../core/services/savings-goal.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <div class="savings-container">
      <div class="header">
        <div>
          <h1>Metas de ahorro</h1>
          <p class="subtitle">Cuánto necesitas apartar cada mes para llegar a tiempo</p>
        </div>
        <button mat-raised-button color="primary" (click)="toggleForm()">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cerrar' : 'Nueva meta' }}
        </button>
      </div>

      <div class="summary-grid" *ngIf="goals().length > 0">
        <mat-card class="summary-card saved">
          <span class="summary-label">Reunido</span>
          <span class="summary-value">{{ formatCurrency(totalSaved()) }}</span>
        </mat-card>
        <mat-card class="summary-card target">
          <span class="summary-label">Objetivo total</span>
          <span class="summary-value">{{ formatCurrency(totalTarget()) }}</span>
        </mat-card>
        <mat-card class="summary-card monthly">
          <span class="summary-label">A apartar este mes</span>
          <span class="summary-value">{{ formatCurrency(totalMonthly()) }}</span>
          <span class="summary-hint">sumando todas las metas</span>
        </mat-card>
      </div>

      <mat-card class="new-card" *ngIf="showForm()">
        <h2>Nueva meta</h2>

        <div class="new-form">
          <mat-form-field appearance="outline">
            <mat-label>Para qué es</mat-label>
            <input matInput [(ngModel)]="form.nombre" placeholder="Viaje, fondo de emergencia..." />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cuánto quieres reunir</mat-label>
            <input matInput type="number" [(ngModel)]="form.targetAmount" step="100000" placeholder="0" />
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Para cuándo</mat-label>
            <input matInput type="date" [(ngModel)]="form.targetDate" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Ya tengo apartado</mat-label>
            <input matInput type="number" [(ngModel)]="form.initialAmount" step="100000" placeholder="0" />
            <span matTextPrefix>$&nbsp;</span>
            <mat-hint>Opcional, si ya llevas algo ahorrado</mat-hint>
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="createGoal()" [disabled]="!isValid() || saving()">
            <mat-icon>add</mat-icon>
            Crear meta
          </button>
        </div>
      </mat-card>

      <mat-card class="empty-card" *ngIf="goals().length === 0 && !showForm()">
        <div class="empty-state">
          <mat-icon>savings</mat-icon>
          <p>Todavía no tienes metas de ahorro</p>
          <span class="empty-hint">
            Define cuánto quieres reunir y para cuándo, y te digo cuánto apartar cada mes
          </span>
        </div>
      </mat-card>

      <div class="goals-grid">
        <mat-card
          class="goal-card"
          *ngFor="let goal of goals()"
          [class.completed]="goal.completed"
          [class.overdue]="goal.overdue"
        >
          <div class="goal-head">
            <div>
              <h3>{{ goal.nombre }}</h3>
              <span class="goal-date">
                {{ goal.completed
                  ? '¡Meta conseguida!'
                  : goal.overdue
                    ? 'Venció el ' + formatDate(goal.targetDate)
                    : formatDate(goal.targetDate) + ' · ' + monthsLabel(goal.monthsLeft) }}
              </span>
            </div>
            <button mat-icon-button color="warn" (click)="remove(goal)" aria-label="Eliminar">
              <mat-icon>delete</mat-icon>
            </button>
          </div>

          <div class="goal-amounts">
            <span class="current">{{ formatCurrency(goal.currentAmount) }}</span>
            <span class="target">de {{ formatCurrency(goal.targetAmount) }}</span>
          </div>

          <mat-progress-bar
            mode="determinate"
            [value]="goal.progressPercentage"
            [color]="goal.completed ? 'primary' : goal.overdue ? 'warn' : 'accent'"
          ></mat-progress-bar>
          <span class="progress-label">{{ goal.progressPercentage | number: '1.0-1' }}% reunido</span>

          <div class="goal-plan" *ngIf="!goal.completed">
            <div class="plan-row">
              <span class="plan-label">Apartar al mes</span>
              <span class="plan-value">{{ formatCurrency(goal.monthlyTarget) }}</span>
            </div>
            <div class="plan-row">
              <span class="plan-label">Llevas este mes</span>
              <span class="plan-value" [class.ok]="goal.onTrack" [class.behind]="!goal.onTrack">
                {{ formatCurrency(goal.savedThisMonth) }}
              </span>
            </div>
            <div class="status" [class.ok]="goal.onTrack" [class.behind]="!goal.onTrack">
              <mat-icon>{{ goal.onTrack ? 'check_circle' : 'schedule' }}</mat-icon>
              <span>
                {{ goal.onTrack
                  ? 'Vas al día'
                  : 'Te faltan ' + formatCurrency(goal.monthlyTarget - goal.savedThisMonth) + ' este mes' }}
              </span>
            </div>
          </div>

          <div class="contribute" *ngIf="!goal.completed">
            <mat-form-field appearance="outline" class="contribute-field">
              <mat-label>Aportar</mat-label>
              <input
                matInput
                type="number"
                step="10000"
                placeholder="0"
                [ngModel]="contributions[goal.id]"
                (ngModelChange)="contributions[goal.id] = $event"
              />
              <span matTextPrefix>$&nbsp;</span>
            </mat-form-field>
            <button
              mat-raised-button
              color="primary"
              (click)="contribute(goal)"
              [disabled]="!contributions[goal.id] || contributions[goal.id]! <= 0"
            >
              Añadir
            </button>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .savings-container {
      padding: var(--spacing-lg);
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .header {
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

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: var(--spacing-md);
    }

    .summary-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      padding: var(--spacing-lg);
      border-left: 3px solid var(--color-border);
    }

    .summary-card.saved { border-left-color: var(--color-success); }
    .summary-card.target { border-left-color: var(--color-primary); }
    .summary-card.monthly { border-left-color: var(--color-info); }

    .summary-label {
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted);
    }

    .summary-value {
      font-size: var(--font-size-xl);
      font-weight: 700;
    }

    .summary-hint {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .new-card, .empty-card { padding: var(--spacing-lg); }

    h2 {
      margin: 0 0 var(--spacing-lg);
      font-size: var(--font-size-lg);
    }

    .new-form {
      display: grid;
      grid-template-columns: 2fr 1.4fr 1.3fr 1.4fr auto;
      gap: var(--spacing-md);
      align-items: start;

      button { height: 56px; }

      @media (max-width: 1000px) {
        grid-template-columns: 1fr 1fr;
      }

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .goals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: var(--spacing-lg);
    }

    .goal-card {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      border: 1px solid transparent;
    }

    .goal-card.completed { border-color: var(--color-success); }
    .goal-card.overdue { border-color: var(--color-danger); }

    .goal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .goal-head h3 {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-lg);
    }

    .goal-date {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .goal-amounts {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-sm);
    }

    .current {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--color-success);
    }

    .target {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .progress-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .goal-plan {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }

    .plan-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
    }

    .plan-label { color: var(--color-text-secondary); }

    .plan-value {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .plan-value.ok { color: var(--color-success); }
    .plan-value.behind { color: var(--color-warning); }

    .status {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: 600;
    }

    .status.ok {
      background: rgba(16, 185, 129, 0.12);
      color: var(--color-success);
    }

    .status.behind {
      background: rgba(245, 158, 11, 0.12);
      color: var(--color-warning);
    }

    .status mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .contribute {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--spacing-sm);
      align-items: start;
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);

      button { height: 56px; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-2xl);
      color: var(--color-text-muted);
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-weight: 600;
    }

    .empty-hint {
      font-size: var(--font-size-sm);
      max-width: 380px;
    }
  `]
})
export class SavingsComponent implements OnInit {
  private goalService = inject(SavingsGoalService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  goals = signal<SavingsGoal[]>([]);
  saving = signal(false);
  showForm = signal(false);

  /** Importe que se está escribiendo para cada meta, por id. */
  contributions: Record<string, number | null> = {};

  form = {
    nombre: '',
    targetAmount: null as number | null,
    targetDate: '',
    initialAmount: null as number | null
  };

  totalSaved = computed(() => this.goals().reduce((sum, g) => sum + g.currentAmount, 0));
  totalTarget = computed(() => this.goals().reduce((sum, g) => sum + g.targetAmount, 0));

  totalMonthly = computed(() =>
    this.goals().filter(g => !g.completed).reduce((sum, g) => sum + g.monthlyTarget, 0)
  );

  ngOnInit() {
    this.load();
  }

  private load() {
    this.goalService.getGoals().subscribe({
      next: (data) => this.goals.set(data ?? []),
      error: () => this.snackBar.open('No se pudieron cargar las metas', 'Cerrar', { duration: 5000 })
    });
  }

  toggleForm() {
    this.showForm.update(open => !open);
  }

  isValid(): boolean {
    return (
      this.form.nombre.trim().length > 0 &&
      !!this.form.targetAmount &&
      this.form.targetAmount > 0 &&
      this.form.targetDate.length > 0
    );
  }

  createGoal() {
    if (!this.isValid()) return;

    this.saving.set(true);
    this.goalService.createGoal({
      nombre: this.form.nombre.trim(),
      targetAmount: Number(this.form.targetAmount),
      targetDate: this.form.targetDate,
      initialAmount: Number(this.form.initialAmount ?? 0)
    }).subscribe({
      next: (goal) => {
        this.goals.update(list => [...list, goal]);
        this.form = { nombre: '', targetAmount: null, targetDate: '', initialAmount: null };
        this.showForm.set(false);
        this.saving.set(false);
        this.snackBar.open('Meta creada', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'No se pudo crear la meta', 'Cerrar', { duration: 5000 });
        this.saving.set(false);
      }
    });
  }

  contribute(goal: SavingsGoal) {
    const amount = this.contributions[goal.id];
    if (!amount || amount <= 0) return;

    this.goalService.addContribution(goal.id, Number(amount)).subscribe({
      next: (updated) => {
        this.goals.update(list => list.map(g => (g.id === goal.id ? updated : g)));
        this.contributions[goal.id] = null;
        this.snackBar.open('Aporte registrado', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'No se pudo registrar el aporte', 'Cerrar', { duration: 5000 });
      }
    });
  }

  remove(goal: SavingsGoal) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Eliminar esta meta?',
        message: `Se quitará "${goal.nombre}". Los aportes que ya hiciste se mantienen como ahorro en tus transacciones.`,
        confirmText: 'Eliminar',
        icon: 'delete',
        danger: true
      } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.goalService.deleteGoal(goal.id).subscribe({
        next: () => this.goals.update(list => list.filter(g => g.id !== goal.id)),
        error: () => this.snackBar.open('No se pudo eliminar', 'Cerrar', { duration: 5000 })
      });
    });
  }

  monthsLabel(months: number): string {
    if (months <= 0) return 'sin plazo';
    return months === 1 ? 'queda 1 mes' : `quedan ${months} meses`;
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
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

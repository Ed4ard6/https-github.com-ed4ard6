import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BudgetService, Budget } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/domain.models';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <div class="budgets-container">
      <div class="header">
        <div>
          <h1>Presupuestos</h1>
          <p class="subtitle">Cuánto piensas gastar y cuánto llevas</p>
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

      <div class="summary-grid" *ngIf="budgets().length > 0">
        <mat-card class="summary-card planned">
          <span class="summary-label">Presupuestado</span>
          <span class="summary-value">{{ formatCurrency(totalPlanned()) }}</span>
        </mat-card>
        <mat-card class="summary-card spent">
          <span class="summary-label">Gastado</span>
          <span class="summary-value">{{ formatCurrency(totalSpent()) }}</span>
          <span class="summary-hint">{{ totalPercentage() | number: '1.0-1' }}% del plan</span>
        </mat-card>
        <mat-card class="summary-card left" [class.over]="totalRemaining() < 0">
          <span class="summary-label">{{ totalRemaining() >= 0 ? 'Disponible' : 'Excedido' }}</span>
          <span class="summary-value">{{ formatCurrency(abs(totalRemaining())) }}</span>
        </mat-card>
      </div>

      <mat-card class="new-budget-card">
        <h2>Añadir presupuesto</h2>

        <div class="new-budget-form">
          <mat-form-field appearance="outline">
            <mat-label>Categoría</mat-label>
            <mat-select [(ngModel)]="newCategoryId">
              <mat-option *ngFor="let category of availableCategories()" [value]="category.id">
                {{ category.nombre }}
              </mat-option>
            </mat-select>
            <mat-hint *ngIf="availableCategories().length === 0">
              Ya tienes presupuesto para todas tus categorías de gasto
            </mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Importe del mes</mat-label>
            <input matInput type="number" [(ngModel)]="newAmount" step="10000" />
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <button
            mat-raised-button
            color="primary"
            (click)="addBudget()"
            [disabled]="!newCategoryId || newAmount <= 0 || saving()"
          >
            <mat-icon>add</mat-icon>
            Añadir
          </button>
        </div>
      </mat-card>

      <mat-card class="empty-card" *ngIf="budgets().length === 0">
        <div class="empty-state">
          <mat-icon>account_balance_wallet</mat-icon>
          <p>No hay presupuestos para {{ monthName() }}</p>
        </div>
      </mat-card>

      <div class="budgets-grid">
        <mat-card class="budget-card" *ngFor="let budget of budgets()" [class.over]="isOver(budget)">
          <div class="budget-head">
            <span class="budget-name">
              <i class="dot" [style.background-color]="budget.categoryColor || 'var(--color-primary)'"></i>
              {{ budget.categoryName }}
            </span>
            <button mat-icon-button color="warn" (click)="deleteBudget(budget)" aria-label="Eliminar">
              <mat-icon>delete</mat-icon>
            </button>
          </div>

          <div class="budget-amounts">
            <span class="spent-amount" [class.over]="isOver(budget)">
              {{ formatCurrency(budget.spent) }}
            </span>
            <span class="planned-amount">de {{ formatCurrency(budget.amount) }}</span>
          </div>

          <mat-progress-bar
            mode="determinate"
            [value]="percentage(budget)"
            [color]="isOver(budget) ? 'warn' : 'primary'"
          ></mat-progress-bar>

          <div class="budget-footer">
            <span>{{ percentage(budget) | number: '1.0-0' }}%</span>
            <span [class.over]="isOver(budget)">
              {{ isOver(budget)
                ? 'Te pasaste ' + formatCurrency(budget.spent - budget.amount)
                : 'Quedan ' + formatCurrency(budget.amount - budget.spent) }}
            </span>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .budgets-container {
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

    .summary-card.planned { border-left-color: var(--color-primary); }
    .summary-card.spent { border-left-color: var(--color-warning); }
    .summary-card.left { border-left-color: var(--color-success); }
    .summary-card.left.over { border-left-color: var(--color-danger); }

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

    .new-budget-card {
      padding: var(--spacing-lg);
    }

    h2 {
      margin: 0 0 var(--spacing-lg);
      font-size: var(--font-size-lg);
    }

    .new-budget-form {
      display: grid;
      grid-template-columns: 2fr 1.5fr auto;
      gap: var(--spacing-md);
      align-items: start;

      button {
        height: 56px;
      }

      @media (max-width: 700px) {
        grid-template-columns: 1fr;

        button {
          height: 48px;
        }
      }
    }

    .budgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-lg);
    }

    .budget-card {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      border: 1px solid transparent;
    }

    .budget-card.over {
      border-color: var(--color-danger);
    }

    .budget-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .budget-name {
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

    .budget-amounts {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-sm);
    }

    .spent-amount {
      font-size: var(--font-size-xl);
      font-weight: 700;
    }

    .spent-amount.over { color: var(--color-danger); }

    .planned-amount {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .budget-footer {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .budget-footer .over {
      color: var(--color-danger);
      font-weight: 600;
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
export class BudgetsComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  budgets = signal<Budget[]>([]);
  categories = signal<Category[]>([]);
  saving = signal(false);

  private reference = signal(new Date());

  newCategoryId = '';
  newAmount = 0;

  monthName = computed(() =>
    new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(this.reference())
  );

  // Solo categorías de gasto que aún no tienen presupuesto este mes
  availableCategories = computed(() => {
    const usadas = new Set(this.budgets().map(b => b.categoryId));
    return this.categories().filter(c => c.kind === 'expense' && !usadas.has(c.id));
  });

  totalPlanned = computed(() => this.budgets().reduce((sum, b) => sum + b.amount, 0));
  totalSpent = computed(() => this.budgets().reduce((sum, b) => sum + b.spent, 0));
  totalRemaining = computed(() => this.totalPlanned() - this.totalSpent());

  totalPercentage = computed(() => {
    const planned = this.totalPlanned();
    return planned > 0 ? (this.totalSpent() / planned) * 100 : 0;
  });

  ngOnInit() {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data ?? []),
      error: () => this.categories.set([])
    });

    this.load();
  }

  private load() {
    const ref = this.reference();
    this.budgetService.getBudgets(ref.getMonth() + 1, ref.getFullYear()).subscribe({
      next: (data) => this.budgets.set(data ?? []),
      error: () => this.snackBar.open('No se pudieron cargar los presupuestos', 'Cerrar', { duration: 5000 })
    });
  }

  previousMonth() {
    const ref = this.reference();
    this.reference.set(new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
    this.load();
  }

  nextMonth() {
    const ref = this.reference();
    this.reference.set(new Date(ref.getFullYear(), ref.getMonth() + 1, 1));
    this.load();
  }

  addBudget() {
    if (!this.newCategoryId || this.newAmount <= 0) return;

    const ref = this.reference();
    this.saving.set(true);

    this.budgetService.createBudget({
      categoryId: this.newCategoryId,
      amount: Number(this.newAmount),
      month: ref.getMonth() + 1,
      year: ref.getFullYear()
    }).subscribe({
      next: (budget) => {
        this.budgets.update(list => [...list, budget]);
        this.newCategoryId = '';
        this.newAmount = 0;
        this.saving.set(false);
        this.snackBar.open('Presupuesto añadido', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'No se pudo guardar', 'Cerrar', { duration: 5000 });
        this.saving.set(false);
      }
    });
  }

  deleteBudget(budget: Budget) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Eliminar presupuesto?',
        message: `Se quitará el presupuesto de "${budget.categoryName}" para este mes. Tus transacciones no se tocan.`,
        confirmText: 'Eliminar',
        icon: 'delete',
        danger: true
      } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.budgetService.deleteBudget(budget.id).subscribe({
        next: () => this.budgets.update(list => list.filter(b => b.id !== budget.id)),
        error: () => this.snackBar.open('No se pudo eliminar', 'Cerrar', { duration: 5000 })
      });
    });
  }

  percentage(budget: Budget): number {
    return budget.amount > 0 ? Math.min(100, (budget.spent / budget.amount) * 100) : 0;
  }

  isOver(budget: Budget): boolean {
    return budget.spent > budget.amount;
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

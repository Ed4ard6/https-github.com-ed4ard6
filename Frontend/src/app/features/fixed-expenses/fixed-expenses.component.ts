import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FixedExpenseService, FixedExpense } from '../../core/services/fixed-expense.service';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/domain.models';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-fixed-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  template: `
    <div class="fixed-container">
      <div class="header">
        <div>
          <h1>Gastos fijos</h1>
          <p class="subtitle">Los recibos que se repiten cada mes</p>
        </div>
      </div>

      <div class="summary-grid" *ngIf="expenses().length > 0">
        <mat-card class="summary-card total">
          <span class="summary-label">Total al mes</span>
          <span class="summary-value">{{ formatCurrency(total()) }}</span>
          <span class="summary-hint">{{ expenses().length }} recibos</span>
        </mat-card>
        <mat-card class="summary-card first">
          <span class="summary-label">Primera quincena</span>
          <span class="summary-value">{{ formatCurrency(firstHalf()) }}</span>
          <span class="summary-hint">hasta el día 15</span>
        </mat-card>
        <mat-card class="summary-card second">
          <span class="summary-label">Segunda quincena</span>
          <span class="summary-value">{{ formatCurrency(secondHalf()) }}</span>
          <span class="summary-hint">del 16 en adelante</span>
        </mat-card>
      </div>

      <mat-card class="new-card">
        <h2>{{ editingId() ? 'Editar gasto fijo' : 'Añadir gasto fijo' }}</h2>

        <div class="new-form">
          <mat-form-field appearance="outline">
            <mat-label>Concepto</mat-label>
            <input matInput [(ngModel)]="form.nombre" placeholder="Alquiler, internet..." />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Importe</mat-label>
            <input matInput type="number" [(ngModel)]="form.amount" step="10000" placeholder="0" />
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Día de pago</mat-label>
            <input matInput type="number" [(ngModel)]="form.paymentDay" min="1" max="31" placeholder="1" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Categoría</mat-label>
            <mat-select [(ngModel)]="form.categoryId">
              <mat-option [value]="null">Sin categoría</mat-option>
              <mat-option *ngFor="let category of expenseCategories()" [value]="category.id">
                {{ category.nombre }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <div class="form-actions">
            <button mat-button *ngIf="editingId()" (click)="cancelEdit()">Cancelar</button>
            <button mat-raised-button color="primary" (click)="save()" [disabled]="!isValid() || saving()">
              <mat-icon>{{ editingId() ? 'save' : 'add' }}</mat-icon>
              {{ editingId() ? 'Guardar' : 'Añadir' }}
            </button>
          </div>
        </div>

        <mat-slide-toggle class="split-toggle" [(ngModel)]="form.splitBetweenPaydays">
          Repartir entre las dos quincenas
        </mat-slide-toggle>
        <p class="split-hint">
          Actívalo si el recibo es grande: en vez de cargarlo entero en la quincena
          de su fecha, se aparta la mitad en cada una.
        </p>
      </mat-card>

      <mat-card class="empty-card" *ngIf="expenses().length === 0">
        <div class="empty-state">
          <mat-icon>receipt_long</mat-icon>
          <p>No tienes gastos fijos registrados</p>
          <span class="empty-hint">
            Al añadirlos, el planificador podrá colocarlos en la quincena que toca
          </span>
        </div>
      </mat-card>

      <mat-card class="list-card" *ngIf="expenses().length > 0">
        <div class="expense-row" *ngFor="let expense of expenses()">
          <div class="day-badge" [class.second]="expense.paymentDay > 15">
            <span class="day-number">{{ expense.paymentDay }}</span>
            <span class="day-label">día</span>
          </div>

          <div class="expense-info">
            <span class="expense-name">
              {{ expense.nombre }}
              <span class="split-badge" *ngIf="expense.splitBetweenPaydays">
                <mat-icon>call_split</mat-icon>
                repartido
              </span>
            </span>
            <span class="expense-category">
              {{ expense.categoryName || 'Sin categoría' }}
              <ng-container *ngIf="expense.splitBetweenPaydays">
                · {{ formatCurrency(expense.amount / 2) }} por quincena
              </ng-container>
            </span>
          </div>

          <span class="expense-amount">{{ formatCurrency(expense.amount) }}</span>

          <div class="expense-actions">
            <button mat-icon-button (click)="startEdit(expense)" aria-label="Editar">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="remove(expense)" aria-label="Eliminar">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .fixed-container {
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

    .summary-card.total { border-left-color: var(--color-primary); }
    .summary-card.first { border-left-color: var(--color-info); }
    .summary-card.second { border-left-color: var(--color-warning); }

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

    .new-card, .list-card, .empty-card {
      padding: var(--spacing-lg);
    }

    h2 {
      margin: 0 0 var(--spacing-lg);
      font-size: var(--font-size-lg);
    }

    .new-form {
      display: grid;
      grid-template-columns: 2fr 1.4fr 1fr 1.4fr auto;
      gap: var(--spacing-md);
      align-items: start;

      @media (max-width: 1000px) {
        grid-template-columns: 1fr 1fr;
      }

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
      height: 56px;
    }

    .split-toggle {
      margin-top: var(--spacing-lg);
    }

    .split-hint {
      margin: var(--spacing-xs) 0 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      max-width: 620px;
    }

    .split-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      margin-left: var(--spacing-sm);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: rgba(124, 58, 237, 0.15);
      color: var(--color-primary);
      font-size: 11px;
      font-weight: 600;
      vertical-align: middle;

      mat-icon {
        font-size: 13px;
        width: 13px;
        height: 13px;
      }
    }

    .expense-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      transition: background-color var(--transition-fast);
    }

    .expense-row:hover {
      background-color: rgba(124, 58, 237, 0.08);
    }

    .day-badge {
      width: 46px;
      height: 46px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      background: rgba(59, 130, 246, 0.15);
      color: var(--color-info);
    }

    .day-badge.second {
      background: rgba(245, 158, 11, 0.15);
      color: var(--color-warning);
    }

    .day-number {
      font-weight: 700;
      line-height: 1;
    }

    .day-label {
      font-size: 10px;
      opacity: 0.8;
    }

    .expense-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .expense-name {
      font-weight: 600;
    }

    .expense-category {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .expense-amount {
      font-weight: 700;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .expense-actions {
      display: flex;
      flex-shrink: 0;
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
export class FixedExpensesComponent implements OnInit {
  private fixedExpenseService = inject(FixedExpenseService);
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  expenses = signal<FixedExpense[]>([]);
  categories = signal<Category[]>([]);
  saving = signal(false);
  editingId = signal<string | null>(null);

  form = {
    nombre: '',
    amount: null as number | null,
    paymentDay: null as number | null,
    splitBetweenPaydays: false,
    categoryId: null as string | null
  };

  expenseCategories = computed(() => this.categories().filter(c => c.kind === 'expense'));

  total = computed(() => this.expenses().reduce((sum, e) => sum + e.amount, 0));

  firstHalf = computed(() =>
    this.expenses().filter(e => e.paymentDay <= 15).reduce((sum, e) => sum + e.amount, 0)
  );

  secondHalf = computed(() =>
    this.expenses().filter(e => e.paymentDay > 15).reduce((sum, e) => sum + e.amount, 0)
  );

  ngOnInit() {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data ?? []),
      error: () => this.categories.set([])
    });

    this.load();
  }

  private load() {
    this.fixedExpenseService.getFixedExpenses().subscribe({
      next: (data) => this.expenses.set(data ?? []),
      error: () => this.snackBar.open('No se pudieron cargar los gastos fijos', 'Cerrar', { duration: 5000 })
    });
  }

  isValid(): boolean {
    return (
      this.form.nombre.trim().length > 0 &&
      !!this.form.amount &&
      this.form.amount > 0 &&
      !!this.form.paymentDay &&
      this.form.paymentDay >= 1 &&
      this.form.paymentDay <= 31
    );
  }

  startEdit(expense: FixedExpense) {
    this.editingId.set(expense.id);
    this.form = {
      nombre: expense.nombre,
      amount: expense.amount,
      paymentDay: expense.paymentDay,
      splitBetweenPaydays: expense.splitBetweenPaydays,
      categoryId: expense.categoryId
    };
  }

  cancelEdit() {
    this.editingId.set(null);
    this.resetForm();
  }

  save() {
    if (!this.isValid()) return;

    this.saving.set(true);
    const payload = {
      nombre: this.form.nombre.trim(),
      amount: Number(this.form.amount),
      paymentDay: Number(this.form.paymentDay),
      splitBetweenPaydays: this.form.splitBetweenPaydays,
      categoryId: this.form.categoryId
    };

    const id = this.editingId();
    const request$ = id
      ? this.fixedExpenseService.updateFixedExpense(id, payload)
      : this.fixedExpenseService.createFixedExpense(payload);

    request$.subscribe({
      next: (expense) => {
        if (id) {
          this.expenses.update(list => list.map(e => (e.id === id ? expense : e)));
        } else {
          this.expenses.update(list => [...list, expense].sort((a, b) => a.paymentDay - b.paymentDay));
        }

        this.editingId.set(null);
        this.resetForm();
        this.saving.set(false);
        this.snackBar.open(id ? 'Gasto fijo actualizado' : 'Gasto fijo añadido', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'No se pudo guardar', 'Cerrar', { duration: 5000 });
        this.saving.set(false);
      }
    });
  }

  remove(expense: FixedExpense) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Eliminar gasto fijo?',
        message: `Se quitará "${expense.nombre}" de tus recibos mensuales.`,
        confirmText: 'Eliminar',
        icon: 'delete',
        danger: true
      } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.fixedExpenseService.deleteFixedExpense(expense.id).subscribe({
        next: () => this.expenses.update(list => list.filter(e => e.id !== expense.id)),
        error: () => this.snackBar.open('No se pudo eliminar', 'Cerrar', { duration: 5000 })
      });
    });
  }

  private resetForm() {
    this.form = {
      nombre: '',
      amount: null,
      paymentDay: null,
      splitBetweenPaydays: false,
      categoryId: null
    };
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

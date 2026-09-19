import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { TransactionService } from '../../core/services/transaction.service';
import { Transaction } from '../../core/models/domain.models';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RouterLink
  ],
  template: `
    <div class="savings-container">
      <div class="header">
        <div>
          <h1>Ahorros</h1>
          <p class="subtitle">Todo lo que has apartado, aporte a aporte</p>
        </div>
        <button
          mat-raised-button
          color="primary"
          [routerLink]="['/transactions/create']"
          [queryParams]="{ kind: 'saving' }"
        >
          <mat-icon>add</mat-icon>
          Registrar ahorro
        </button>
      </div>

      <div class="summary-grid">
        <mat-card class="summary-card total">
          <span class="summary-label">Total ahorrado</span>
          <span class="summary-value">{{ formatCurrency(total()) }}</span>
          <span class="summary-hint">{{ savings().length }} aportes</span>
        </mat-card>

        <mat-card class="summary-card year">
          <span class="summary-label">Este año</span>
          <span class="summary-value">{{ formatCurrency(totalThisYear()) }}</span>
          <span class="summary-hint">{{ currentYear }}</span>
        </mat-card>

        <mat-card class="summary-card month">
          <span class="summary-label">Este mes</span>
          <span class="summary-value">{{ formatCurrency(totalThisMonth()) }}</span>
          <span class="summary-hint">{{ currentMonthName }}</span>
        </mat-card>

        <mat-card class="summary-card average">
          <span class="summary-label">Aporte medio</span>
          <span class="summary-value">{{ formatCurrency(average()) }}</span>
          <span class="summary-hint">por aporte</span>
        </mat-card>
      </div>

      <mat-card class="list-card">
        <h2>Aportes</h2>

        <div class="empty-state" *ngIf="savings().length === 0">
          <mat-icon>savings</mat-icon>
          <p>Todavía no has registrado ningún ahorro</p>
          <button
            mat-raised-button
            color="primary"
            [routerLink]="['/transactions/create']"
            [queryParams]="{ kind: 'saving' }"
          >
            Registrar el primero
          </button>
        </div>

        <div class="saving-item" *ngFor="let saving of savings()">
          <div class="saving-icon">
            <mat-icon>savings</mat-icon>
          </div>

          <div class="saving-info">
            <span class="saving-description">{{ saving.description || 'Sin descripción' }}</span>
            <span class="saving-meta">
              {{ saving.categoryName || saving.category?.nombre }} · {{ formatDate(saving.date) }}
            </span>
          </div>

          <span class="saving-amount">{{ formatCurrency(saving.amount) }}</span>

          <div class="saving-actions">
            <button mat-icon-button [routerLink]="['/transactions/edit', saving.id]" aria-label="Editar">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteSaving(saving)" aria-label="Eliminar">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .savings-container {
      padding: var(--spacing-lg);
      max-width: 1000px;
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
      border-left: 3px solid var(--color-info);
    }

    .summary-card.total { border-left-color: var(--color-primary); }
    .summary-card.year { border-left-color: var(--color-success); }
    .summary-card.month { border-left-color: var(--color-info); }
    .summary-card.average { border-left-color: var(--color-warning); }

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

    .list-card {
      padding: var(--spacing-lg);
    }

    h2 {
      margin: 0 0 var(--spacing-lg);
      font-size: var(--font-size-lg);
    }

    .saving-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      transition: background-color var(--transition-fast);
    }

    .saving-item:hover {
      background-color: rgba(124, 58, 237, 0.08);
    }

    .saving-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.15);
      color: var(--color-info);
    }

    .saving-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .saving-description {
      font-weight: 600;
    }

    .saving-meta {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .saving-amount {
      font-weight: 700;
      color: var(--color-info);
      white-space: nowrap;
    }

    .saving-actions {
      display: flex;
      flex-shrink: 0;
    }

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
export class SavingsComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  private transactions = signal<Transaction[]>([]);

  currentYear = new Date().getFullYear();
  currentMonthName = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(new Date());

  savings = computed(() =>
    this.transactions()
      .filter(t => t.kind === 'saving')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  total = computed(() => this.savings().reduce((sum, t) => sum + Math.abs(t.amount), 0));

  totalThisYear = computed(() =>
    this.savings()
      .filter(t => new Date(t.date).getFullYear() === this.currentYear)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  );

  totalThisMonth = computed(() => {
    const now = new Date();
    return this.savings()
      .filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  });

  average = computed(() => {
    const items = this.savings();
    return items.length > 0 ? this.total() / items.length : 0;
  });

  ngOnInit() {
    this.load();
  }

  private load() {
    this.transactionService.getTransactions().subscribe({
      next: (data) => this.transactions.set(data ?? []),
      error: () => this.snackBar.open('No se pudieron cargar los ahorros', 'Cerrar', { duration: 5000 })
    });
  }

  deleteSaving(saving: Transaction) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Eliminar este aporte?',
        message: `Se eliminará "${saving.description || 'el aporte'}" de ${this.formatCurrency(saving.amount)}.`,
        confirmText: 'Eliminar',
        icon: 'delete',
        danger: true
      } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.transactionService.deleteTransaction(saving.id).subscribe({
        next: () => this.transactions.update(list => list.filter(t => t.id !== saving.id)),
        error: () => this.snackBar.open('No se pudo eliminar', 'Cerrar', { duration: 5000 })
      });
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  }

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }
}

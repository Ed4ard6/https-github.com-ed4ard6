import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { DebtService } from '../../../core/services/debt.service';
import { Debt } from '../../../core/models/domain.models';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-debts-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatSnackBarModule,
    RouterLink
  ],
  template: `
    <div class="debts-container">
      <div class="header">
        <div>
          <h1>Deudas</h1>
          <p class="subtitle">Lo que debes y cuánto llevas pagado</p>
        </div>
        <div class="header-actions">
          <button mat-button [routerLink]="['/debts/compare']" [disabled]="debts().length === 0">
            <mat-icon>compare_arrows</mat-icon>
            Comparar estrategias
          </button>
          <button mat-raised-button color="primary" [routerLink]="['/debts/create']">
            <mat-icon>add</mat-icon>
            Nueva deuda
          </button>
        </div>
      </div>

      <div class="summary-grid" *ngIf="debts().length > 0">
        <mat-card class="summary-card total">
          <span class="summary-label">Deuda total</span>
          <span class="summary-value">{{ formatCurrency(totalBalance()) }}</span>
        </mat-card>
        <mat-card class="summary-card paid">
          <span class="summary-label">Pagado</span>
          <span class="summary-value">{{ formatCurrency(totalPaid()) }}</span>
          <span class="summary-hint">{{ paidPercentage() | number: '1.0-1' }}% del total</span>
        </mat-card>
        <mat-card class="summary-card monthly">
          <span class="summary-label">Cuotas mínimas al mes</span>
          <span class="summary-value">{{ formatCurrency(totalMinimum()) }}</span>
        </mat-card>
        <mat-card class="summary-card interest">
          <span class="summary-label">Interés estimado al mes</span>
          <span class="summary-value">{{ formatCurrency(monthlyInterest()) }}</span>
        </mat-card>
      </div>

      <mat-card class="empty-card" *ngIf="debts().length === 0">
        <div class="empty-state">
          <mat-icon>credit_card_off</mat-icon>
          <p>No tienes deudas registradas</p>
          <button mat-raised-button color="primary" [routerLink]="['/debts/create']">
            Registrar una deuda
          </button>
        </div>
      </mat-card>

      <div class="debts-grid">
        <mat-card class="debt-card" *ngFor="let debt of debts()">
          <div class="debt-head">
            <div>
              <h3>{{ debt.nombre }}</h3>
              <span class="debt-meta">
                {{ debt.annualRate }}% anual · paga el día {{ debt.paymentDay }}
              </span>
            </div>
            <div class="debt-actions">
              <button mat-icon-button [routerLink]="['/debts/edit', debt.id]" aria-label="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteDebt(debt)" aria-label="Eliminar">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <div class="debt-amounts">
            <div class="amount">
              <span class="amount-label">Saldo</span>
              <span class="amount-value pending">{{ formatCurrency(debt.balance) }}</span>
            </div>
            <div class="amount">
              <span class="amount-label">Original</span>
              <span class="amount-value">{{ formatCurrency(debt.originalAmount) }}</span>
            </div>
            <div class="amount">
              <span class="amount-label">Cuota mínima</span>
              <span class="amount-value">{{ formatCurrency(debt.minimumPayment) }}</span>
            </div>
          </div>

          <div class="debt-progress">
            <mat-progress-bar mode="determinate" [value]="progress(debt)"></mat-progress-bar>
            <span class="progress-label">{{ progress(debt) | number: '1.0-1' }}% pagado</span>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .debts-container {
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

    .header-actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
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

    .summary-card.total { border-left-color: var(--color-danger); }
    .summary-card.paid { border-left-color: var(--color-success); }
    .summary-card.monthly { border-left-color: var(--color-info); }
    .summary-card.interest { border-left-color: var(--color-warning); }

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

    .debts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-lg);
    }

    .debt-card {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .debt-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .debt-head h3 {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-lg);
    }

    .debt-meta {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .debt-actions {
      display: flex;
      flex-shrink: 0;
    }

    .debt-amounts {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-md);
    }

    .amount {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .amount-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .amount-value {
      font-weight: 600;
    }

    .amount-value.pending {
      color: var(--color-danger);
      font-size: var(--font-size-lg);
    }

    .debt-progress {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .progress-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
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
export class DebtsListComponent implements OnInit {
  private debtService = inject(DebtService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  debts = signal<Debt[]>([]);

  totalBalance = computed(() => this.debts().reduce((sum, d) => sum + d.balance, 0));

  totalOriginal = computed(() => this.debts().reduce((sum, d) => sum + d.originalAmount, 0));

  totalPaid = computed(() => Math.max(0, this.totalOriginal() - this.totalBalance()));

  paidPercentage = computed(() => {
    const original = this.totalOriginal();
    return original > 0 ? (this.totalPaid() / original) * 100 : 0;
  });

  totalMinimum = computed(() => this.debts().reduce((sum, d) => sum + d.minimumPayment, 0));

  // Interés del mes: tasa anual repartida entre doce sobre el saldo vivo.
  monthlyInterest = computed(() =>
    this.debts().reduce((sum, d) => sum + (d.balance * (d.annualRate / 100)) / 12, 0)
  );

  ngOnInit() {
    this.load();
  }

  private load() {
    this.debtService.getDebts().subscribe({
      next: (data) => this.debts.set(data ?? []),
      error: () => this.snackBar.open('No se pudieron cargar las deudas', 'Cerrar', { duration: 5000 })
    });
  }

  progress(debt: Debt): number {
    if (debt.originalAmount <= 0) return 0;
    const pagado = debt.originalAmount - debt.balance;
    return Math.min(100, Math.max(0, (pagado / debt.originalAmount) * 100));
  }

  deleteDebt(debt: Debt) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Eliminar esta deuda?',
        message: `Se quitará "${debt.nombre}" de tu listado.`,
        confirmText: 'Eliminar',
        icon: 'delete',
        danger: true
      } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.debtService.deleteDebt(debt.id).subscribe({
        next: () => this.debts.update(list => list.filter(d => d.id !== debt.id)),
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
    }).format(amount);
  }
}

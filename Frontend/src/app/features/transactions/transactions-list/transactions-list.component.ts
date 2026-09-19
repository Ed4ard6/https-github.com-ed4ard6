import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { Transaction } from '../../../core/models/domain.models';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <div class="transactions-container">
      <div class="header">
        <h1>Transacciones</h1>
        <button mat-raised-button color="primary" (click)="navigateTo('/transactions/create')">
          <mat-icon>add</mat-icon>
          Nueva Transacción
        </button>
      </div>

      <mat-card>
        <table mat-table [dataSource]="transactions()" class="transactions-table">
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let element">{{ formatDate(element.date) }}</td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Categoría</th>
            <td mat-cell *matCellDef="let element">
              <span class="category-badge" [style.background-color]="element.category?.color + '20'">
                {{ element.categoryName || element.category?.nombre }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Descripción</th>
            <td mat-cell *matCellDef="let element">{{ element.description }}</td>
          </ng-container>

          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Monto</th>
            <td mat-cell *matCellDef="let element" [ngClass]="element.kind">
              {{ formatCurrency(element.amount) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button (click)="editTransaction(element.id)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteTransaction(element.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .transactions-container {
      padding: var(--spacing-lg);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }
    .transactions-table {
      width: 100%;
    }
    .category-badge {
      padding: 4px 8px;
      border-radius: var(--radius-sm);
    }
    .income { color: var(--color-success); }
    .expense { color: var(--color-danger); }
  `]
})
export class TransactionsListComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private mockDataService = inject(MockDataService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // signal, no un array plano: la app es zoneless y un subscribe()
  // no dispara el re-render por sí solo.
  transactions = signal<Transaction[]>([]);
  displayedColumns = ['date', 'category', 'description', 'amount', 'actions'];

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.transactionService.getTransactions().subscribe({
      next: (data) => this.transactions.set(data ?? []),
      error: (error) => {
        console.warn('Error cargando transacciones, usando mock:', error);
        this.transactions.set(this.mockDataService.getTransactions());
      }
    });
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  }

  formatDate(date: Date | string) {
    return new Intl.DateTimeFormat('es-CO').format(new Date(date));
  }

  editTransaction(id: string) {
    this.router.navigate(['/transactions/edit', id]);
  }

  deleteTransaction(id: string) {
    const transaction = this.transactions().find(t => t.id === id);

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Eliminar transacción?',
        message: transaction?.description
          ? `Se eliminará "${transaction.description}". Esta acción no se puede deshacer.`
          : 'Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        icon: 'delete',
        danger: true
      } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.transactionService.deleteTransaction(id).subscribe({
        next: () => this.transactions.update(list => list.filter(t => t.id !== id)),
        error: () => this.snackBar.open('No se pudo eliminar la transacción', 'Cerrar', { duration: 5000 })
      });
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

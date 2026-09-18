import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
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
    MatSelectModule
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
        <table mat-table [dataSource]="transactions" class="transactions-table">
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let element">{{ formatDate(element.date) }}</td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Categoría</th>
            <td mat-cell *matCellDef="let element">
              <span class="category-badge" [style.background-color]="element.category?.color + '20'">
                {{ element.category?.nombre }}
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

  transactions: Transaction[] = [];
  displayedColumns = ['date', 'category', 'description', 'amount', 'actions'];
  isLoading = true;

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.isLoading = true;
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.warn('Error loading transactions from API, using mock data:', error);
        this.transactions = this.mockDataService.getTransactions();
        this.isLoading = false;
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
    this.transactionService.deleteTransaction(id).subscribe({
      next: () => {
        this.transactions = this.transactions.filter(t => t.id !== id);
      },
      error: (error) => {
        console.error('Error deleting transaction:', error);
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

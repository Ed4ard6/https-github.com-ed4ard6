import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TransactionService } from '../../../core/services/transaction.service';
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
    MatSnackBarModule,
    MatInputModule
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

      <mat-card class="filters-card">
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Buscar</mat-label>
            <input
              matInput
              placeholder="Descripción o categoría"
              [value]="filterText()"
              (input)="filterText.set($any($event.target).value)"
            />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select [value]="filterKind()" (selectionChange)="filterKind.set($event.value)">
              <mat-option value="all">Todos</mat-option>
              <mat-option value="income">Ingresos</mat-option>
              <mat-option value="expense">Gastos</mat-option>
              <mat-option value="debt">Deudas</mat-option>
              <mat-option value="saving">Ahorros</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Año</mat-label>
            <mat-select [value]="filterYear()" (selectionChange)="filterYear.set($event.value)">
              <mat-option value="all">Todos</mat-option>
              <mat-option *ngFor="let year of availableYears()" [value]="year">{{ year }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mes</mat-label>
            <mat-select [value]="filterMonth()" (selectionChange)="filterMonth.set($event.value)">
              <mat-option value="all">Todos</mat-option>
              <mat-option *ngFor="let month of months; let i = index" [value]="i">{{ month }}</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-button class="clear-filters" (click)="clearFilters()" *ngIf="hasActiveFilters()">
            <mat-icon>filter_alt_off</mat-icon>
            Limpiar
          </button>
        </div>

        <div class="filters-summary">
          <span>{{ filtered().length }} de {{ transactions().length }} transacciones</span>
          <span class="filters-total" [class.negative]="filteredTotal() < 0">
            Total: {{ formatCurrency(filteredTotal()) }}
          </span>
        </div>
      </mat-card>

      <mat-card>
        <table mat-table [dataSource]="filtered()" class="transactions-table">
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

        <div class="empty-state" *ngIf="filtered().length === 0">
          <mat-icon>search_off</mat-icon>
          <p>
            {{ transactions().length === 0
              ? 'Aún no tienes transacciones'
              : 'Ninguna transacción coincide con los filtros' }}
          </p>
        </div>
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

    .filters-card {
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-lg);
    }

    .filters {
      display: grid;
      grid-template-columns: minmax(200px, 2fr) repeat(3, minmax(130px, 1fr)) auto;
      gap: var(--spacing-md);
      align-items: start;

      @media (max-width: 900px) {
        grid-template-columns: 1fr 1fr;
      }

      @media (max-width: 560px) {
        grid-template-columns: 1fr;
      }
    }

    .clear-filters {
      color: var(--color-text-secondary);
      align-self: center;
      white-space: nowrap;
    }

    .filters-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      flex-wrap: wrap;
    }

    .filters-total {
      font-weight: 700;
      color: var(--color-success);
    }

    .filters-total.negative {
      color: var(--color-danger);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
      color: var(--color-text-muted);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
        margin-bottom: var(--spacing-md);
      }

      p {
        margin: 0;
      }
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
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  // signal, no un array plano: la app es zoneless y un subscribe()
  // no dispara el re-render por sí solo.
  transactions = signal<Transaction[]>([]);
  displayedColumns = ['date', 'category', 'description', 'amount', 'actions'];

  filterText = signal('');
  filterKind = signal<string>('all');
  filterYear = signal<string | number>('all');
  filterMonth = signal<string | number>('all');

  months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  availableYears = computed(() => {
    const years = new Set(this.transactions().map(t => new Date(t.date).getFullYear()));
    return [...years].sort((a, b) => b - a);
  });

  filtered = computed(() => {
    const text = this.filterText().trim().toLowerCase();
    const kind = this.filterKind();
    const year = this.filterYear();
    const month = this.filterMonth();

    return this.transactions().filter(t => {
      if (kind !== 'all' && t.kind !== kind) return false;

      const date = new Date(t.date);
      if (year !== 'all' && date.getFullYear() !== Number(year)) return false;
      if (month !== 'all' && date.getMonth() !== Number(month)) return false;

      if (text) {
        const haystack = `${t.description ?? ''} ${t.categoryName ?? t.category?.nombre ?? ''}`.toLowerCase();
        if (!haystack.includes(text)) return false;
      }

      return true;
    });
  });

  filteredTotal = computed(() => this.filtered().reduce((sum, t) => sum + t.amount, 0));

  hasActiveFilters = computed(() =>
    this.filterText() !== '' ||
    this.filterKind() !== 'all' ||
    this.filterYear() !== 'all' ||
    this.filterMonth() !== 'all'
  );

  ngOnInit() {
    // El dashboard enlaza aquí con ?kind=income|expense|saving
    const kind = this.route.snapshot.queryParamMap.get('kind');
    if (kind) this.filterKind.set(kind);

    this.loadTransactions();
  }

  clearFilters() {
    this.filterText.set('');
    this.filterKind.set('all');
    this.filterYear.set('all');
    this.filterMonth.set('all');
  }

  // Sin fallback a mock: las filas traen botones de editar y eliminar, y
  // sobre una transacción inventada esas acciones fallan.
  loadTransactions() {
    this.transactionService.getTransactions().subscribe({
      next: (data) => this.transactions.set(data ?? []),
      error: () => this.snackBar.open('No se pudieron cargar las transacciones', 'Cerrar', { duration: 5000 })
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

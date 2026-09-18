import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { Category } from '../../../core/models/domain.models';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <div class="form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Nueva Transacción</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipo</mat-label>
              <mat-select formControlName="kind">
                <mat-option value="income">Ingreso</mat-option>
                <mat-option value="expense">Gasto</mat-option>
                <mat-option value="debt">Deuda</mat-option>
                <mat-option value="saving">Ahorro</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Categoría</mat-label>
              <mat-select formControlName="categoryId">
                <mat-option *ngFor="let cat of categories" [value]="cat.id">
                  {{ cat.nombre }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Monto</mat-label>
              <input matInput type="number" formControlName="amount" step="0.01" />
              <mat-error *ngIf="form.get('amount')?.hasError('required')">
                Monto es requerido
              </mat-error>
              <mat-error *ngIf="form.get('amount')?.hasError('min')">
                Monto debe ser mayor a 0
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <input matInput formControlName="description" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Fecha</mat-label>
              <input matInput type="date" formControlName="date" />
            </mat-form-field>

            <div class="actions">
              <button mat-raised-button color="primary" type="submit">Guardar</button>
              <button mat-button type="button" (click)="navigateTo('/transactions')">Cancelar</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      mat-card {
        background-color: var(--color-bg-card);
        border: 1px solid var(--color-border);
      }

      mat-card-header {
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-lg) var(--spacing-lg) 0;
        border-bottom: 1px solid var(--color-border-light);
      }

      mat-card-title {
        font-size: var(--font-size-xl);
        color: var(--color-text-primary);
        margin: 0;
      }

      mat-card-content {
        padding: var(--spacing-lg);
      }

      form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }
    }

    .form-container {
      padding: var(--spacing-lg);
      max-width: 600px;
      margin: 0 auto;
    }

    .full-width {
      width: 100%;
    }

    .actions {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-lg);
      justify-content: flex-end;
    }
  `]
})
export class TransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private mockDataService = inject(MockDataService);
  private snackBar = inject(MatSnackBar);

  categories: Category[] = [];
  isLoading = false;
  form = this.fb.group({
    kind: ['expense', [Validators.required]],
    categoryId: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.maxLength(500)]],
    date: [new Date().toISOString().split('T')[0], [Validators.required]]
  });

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: () => this.categories = this.mockDataService.getCategories()
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.isLoading = true;
      const value = this.form.value;

      this.transactionService.createTransaction({
        categoryId: value.categoryId || '',
        amount: parseFloat(value.amount?.toString() || '0'),
        description: value.description || '',
        date: new Date(value.date || new Date()),
        kind: value.kind as any
      }).subscribe({
        next: () => {
          this.snackBar.open('✅ Transacción guardada', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/transactions']);
        },
        error: (error) => {
          this.snackBar.open('❌ Error al guardar', 'Cerrar', { duration: 3000 });
          console.error('Error:', error);
          this.isLoading = false;
        }
      });
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

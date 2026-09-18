import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule
  ],
  template: `
    <div class="form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Nueva Categoría</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" />
            </mat-form-field>

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
              <mat-label>Color (hex)</mat-label>
              <input matInput type="color" formControlName="color" />
            </mat-form-field>

            <div class="actions">
              <button mat-raised-button color="primary" type="submit">Guardar</button>
              <button mat-button type="button" (click)="navigateTo('/categories')">Cancelar</button>
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
export class CategoryFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  form = this.fb.group({
    nombre: ['', Validators.required],
    kind: ['expense', Validators.required],
    color: ['#a78bfa']
  });

  onSubmit() {
    if (this.form.valid) {
      this.navigateTo('/categories');
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

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
    .form-container { padding: var(--spacing-lg); }
    .full-width { width: 100%; margin-bottom: var(--spacing-md); }
    .actions { display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg); }
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

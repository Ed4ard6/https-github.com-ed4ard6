import { Component, ChangeDetectorRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { DebtService } from '../../../core/services/debt.service';

@Component({
  selector: 'app-debt-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ debtId ? 'Editar deuda' : 'Nueva deuda' }}</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" placeholder="Tarjeta de crédito, préstamo..." />
              <mat-error *ngIf="form.get('nombre')?.hasError('required')">
                El nombre es obligatorio
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Saldo actual</mat-label>
              <input matInput type="number" formControlName="balance" step="1000" />
              <span matTextPrefix>$&nbsp;</span>
              <mat-hint>Lo que te queda por pagar</mat-hint>
              <mat-error *ngIf="form.get('balance')?.hasError('min')">
                No puede ser negativo
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Importe original</mat-label>
              <input matInput type="number" formControlName="originalAmount" step="1000" />
              <span matTextPrefix>$&nbsp;</span>
              <mat-hint>Con cuánto empezó la deuda. Sirve para calcular el progreso</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tasa de interés anual</mat-label>
              <input matInput type="number" formControlName="annualRate" step="0.1" />
              <span matTextSuffix>%</span>
              <mat-error *ngIf="form.get('annualRate')?.hasError('max')">
                Debe estar entre 0 y 200
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Cuota mínima mensual</mat-label>
              <input matInput type="number" formControlName="minimumPayment" step="1000" />
              <span matTextPrefix>$&nbsp;</span>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Día de pago</mat-label>
              <input matInput type="number" formControlName="paymentDay" min="1" max="31" />
              <mat-hint>Día del mes en que vence la cuota</mat-hint>
              <mat-error *ngIf="form.get('paymentDay')?.invalid">
                Debe estar entre 1 y 31
              </mat-error>
            </mat-form-field>

            <div class="actions">
              <button mat-button type="button" (click)="cancel()">Cancelar</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                {{ debtId ? 'Guardar cambios' : 'Crear deuda' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      padding: var(--spacing-lg);
      max-width: 600px;
      margin: 0 auto;
    }

    :host ::ng-deep {
      mat-card-header {
        padding: var(--spacing-lg) var(--spacing-lg) 0;
        border-bottom: 1px solid var(--color-border-light);
        margin-bottom: var(--spacing-lg);
      }

      mat-card-title {
        font-size: var(--font-size-xl);
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

    .full-width { width: 100%; }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      margin-top: var(--spacing-md);
    }
  `]
})
export class DebtFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private debtService = inject(DebtService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  debtId: string | null = null;
  saving = signal(false);

  form = this.fb.group({
    nombre: ['', [Validators.required]],
    balance: [0, [Validators.required, Validators.min(0)]],
    originalAmount: [0, [Validators.min(0)]],
    annualRate: [0, [Validators.required, Validators.min(0), Validators.max(200)]],
    minimumPayment: [0, [Validators.required, Validators.min(0)]],
    paymentDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]]
  });

  ngOnInit() {
    this.debtId = this.route.snapshot.paramMap.get('id');
    if (!this.debtId) return;

    this.debtService.getDebt(this.debtId).subscribe({
      next: (debt) => {
        this.form.patchValue({
          nombre: debt.nombre,
          balance: debt.balance,
          originalAmount: debt.originalAmount,
          annualRate: debt.annualRate,
          minimumPayment: debt.minimumPayment,
          paymentDay: debt.paymentDay
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('No se pudo cargar la deuda', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/debts']);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.snackBar.open('Revisa los campos marcados', 'Cerrar', { duration: 4000 });
      return;
    }

    this.saving.set(true);
    const value = this.form.value;
    const payload = {
      nombre: value.nombre!.trim(),
      balance: Number(value.balance ?? 0),
      originalAmount: Number(value.originalAmount ?? 0),
      annualRate: Number(value.annualRate ?? 0),
      minimumPayment: Number(value.minimumPayment ?? 0),
      paymentDay: Number(value.paymentDay ?? 1)
    };

    const request$ = this.debtId
      ? this.debtService.updateDebt(this.debtId, payload)
      : this.debtService.createDebt(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open(this.debtId ? 'Deuda actualizada' : 'Deuda creada', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/debts']);
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'No se pudo guardar', 'Cerrar', { duration: 5000 });
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  cancel() {
    this.router.navigate(['/debts']);
  }
}

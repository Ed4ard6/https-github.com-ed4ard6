import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/** Las dos contraseñas tienen que coincidir. */
function passwordsIguales(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const repeat = group.get('repeat')?.value;
  return password && repeat && password !== repeat ? { noCoinciden: true } : null;
}

/**
 * Canjea el enlace de recuperación por una contraseña nueva.
 *
 * El token viaja en la query string del enlace (?token=…). No se pide la
 * contraseña anterior: tener el enlace es la prueba de acceso.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Elegir contraseña nueva</mat-card-title>
          <mat-card-subtitle *ngIf="token && !done()">
            Escribe la contraseña con la que quieres entrar a partir de ahora
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Enlace sin token: se llegó aquí a mano -->
          <div *ngIf="!token" class="message error">
            Este enlace está incompleto. Vuelve a pedir uno desde
            <a routerLink="/auth/forgot-password">recuperar el acceso</a>.
          </div>

          <form *ngIf="token && !done()" [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nueva contraseña</mat-label>
              <input matInput formControlName="password" [type]="visible() ? 'text' : 'password'" />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="visible.set(!visible())"
                [attr.aria-label]="visible() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <mat-icon>{{ visible() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.controls.password.hasError('required')">
                Escribe una contraseña
              </mat-error>
              <mat-error *ngIf="form.controls.password.hasError('minlength')">
                Mínimo 6 caracteres
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Repetir la contraseña</mat-label>
              <input matInput formControlName="repeat" [type]="visible() ? 'text' : 'password'" />
              <mat-error *ngIf="form.controls.repeat.hasError('required')">
                Repite la contraseña
              </mat-error>
            </mat-form-field>

            <div *ngIf="form.hasError('noCoinciden') && form.controls.repeat.touched" class="message error">
              Las dos contraseñas no coinciden
            </div>

            <div *ngIf="error()" class="message error">{{ error() }}</div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="!form.valid || loading()"
            >
              <mat-spinner *ngIf="loading()" diameter="20" class="spinner"></mat-spinner>
              <span *ngIf="!loading()">Guardar y entrar</span>
            </button>
          </form>

          <div *ngIf="done()" class="done">
            <mat-icon class="done-icon">lock_reset</mat-icon>
            <p class="message ok">Contraseña actualizada. Ya puedes iniciar sesión con ella.</p>
            <a mat-raised-button color="primary" routerLink="/auth/login">Ir a iniciar sesión</a>
          </div>

          <div class="back-link" *ngIf="!done()">
            <a routerLink="/auth/login">Volver a iniciar sesión</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, var(--color-bg-dark) 0%, var(--color-bg-darker) 100%);
        padding: var(--spacing-md);
      }

      .auth-card {
        width: 100%;
        max-width: 420px;
        background-color: var(--color-bg-card) !important;
        box-shadow: var(--shadow-xl);
        border-radius: var(--radius-lg);
      }

      mat-card-header {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
      }

      mat-card-title {
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--color-primary);
        text-align: center;
      }

      mat-card-subtitle {
        text-align: center;
        color: var(--color-text-secondary);
      }

      form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .full-width {
        width: 100%;
      }

      .message {
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-sm);
      }

      .message.error {
        background-color: rgba(239, 68, 68, 0.1);
        border-left: 4px solid var(--color-danger);
        color: var(--color-danger);

        a {
          color: var(--color-primary);
          font-weight: 600;
        }
      }

      .message.ok {
        background-color: rgba(16, 185, 129, 0.1);
        border-left: 4px solid var(--color-success);
        color: var(--color-text-primary);
        margin: 0;
      }

      .done {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-md);
        text-align: center;
      }

      .done-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--color-success);
      }

      .spinner {
        display: inline-block;
        margin-right: 8px;
      }

      .back-link {
        text-align: center;
        margin-top: var(--spacing-lg);
        font-size: var(--font-size-sm);

        a {
          color: var(--color-primary);
          text-decoration: none;
          font-weight: 600;
        }
      }
    `
  ]
})
export class ResetPasswordComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  /** Token del enlace; sin él no hay nada que hacer aquí. */
  token = this.route.snapshot.queryParamMap.get('token') ?? '';

  loading = signal(false);
  done = signal(false);
  visible = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      repeat: ['', [Validators.required]]
    },
    { validators: passwordsIguales }
  );

  onSubmit(): void {
    if (!this.form.valid || this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.auth.resetPassword(this.token, this.form.getRawValue().password).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: response => {
        this.loading.set(false);
        // El backend explica el motivo (enlace caducado, ya usado, inválido)
        this.error.set(
          response?.error?.message ??
            'No se pudo cambiar la contraseña. Pide un enlace nuevo e inténtalo otra vez.'
        );
      }
    });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * LoginComponent
 * Página de login con formulario reactivo
 * Usa datos mock para desarrollo
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Finance App</mat-card-title>
          <mat-card-subtitle>Inicia sesión para continuar</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <!-- Email -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="ejemplo@correo.com" />
              <mat-error *ngIf="email?.hasError('required')">
                El email es requerido
              </mat-error>
              <mat-error *ngIf="email?.hasError('email')">
                Ingresa un email válido
              </mat-error>
            </mat-form-field>

            <!-- Password -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput formControlName="password" type="password" placeholder="Tu contraseña" />
              <mat-error *ngIf="password?.hasError('required')">
                La contraseña es requerida
              </mat-error>
              <mat-error *ngIf="password?.hasError('minlength')">
                Mínimo 6 caracteres
              </mat-error>
            </mat-form-field>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <!-- Submit Button -->
            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="!loginForm.valid || isLoading"
            >
              <mat-spinner *ngIf="isLoading" diameter="20" class="spinner"></mat-spinner>
              <span *ngIf="!isLoading">Iniciar sesión</span>
            </button>
          </form>

          <!-- Register Link -->
          <div class="register-link">
            ¿No tienes cuenta? <a routerLink="/auth/register">Regístrate aquí</a>
          </div>

          <!-- Demo Credentials -->
          <div class="demo-credentials">
            <small>
              <strong>Demo:</strong> Email: cualquiera@ejemplo.com | Contraseña: cualquiera
            </small>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, var(--color-bg-dark) 0%, var(--color-bg-darker) 100%);
        padding: var(--spacing-md);
      }

      .login-card {
        width: 100%;
        max-width: 400px;
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
        font-size: var(--font-size-2xl);
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

      .error-message {
        background-color: rgba(239, 68, 68, 0.1);
        border-left: 4px solid var(--color-danger);
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        color: var(--color-danger);
        font-size: var(--font-size-sm);
      }

      .spinner {
        display: inline-block;
        margin-right: 8px;
      }

      .register-link {
        text-align: center;
        margin-top: var(--spacing-md);
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);

        a {
          color: var(--color-primary);
          text-decoration: none;
          font-weight: 600;
          transition: color var(--transition-fast);

          &:hover {
            color: var(--color-primary-light);
          }
        }
      }

      .demo-credentials {
        margin-top: var(--spacing-md);
        padding: var(--spacing-sm);
        background-color: var(--color-bg-input);
        border-radius: var(--radius-sm);
        font-size: 11px;
        color: var(--color-text-muted);
        border-left: 3px solid var(--color-info);
      }
    `
  ]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isLoading = false;
  errorMessage = '';

  loginForm: FormGroup;

  constructor() {
    // Crear formulario reactivo con validaciones
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Getters para acceder a los controles del formulario
   */
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  /**
   * Maneja el envío del formulario de login
   */
  onLogin(): void {
    if (!this.loginForm.valid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    // Llamar al servicio de autenticación (mock)
    this.authService.login(email, password).subscribe({
      next: () => {
        // Redireccionar al dashboard después del login exitoso
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Error en el inicio de sesión. Intenta de nuevo.';
        console.error('Login error:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}

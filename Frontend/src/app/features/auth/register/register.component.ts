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
 * RegisterComponent
 * Página de registro con formulario reactivo
 * Valida que las contraseñas coincidan
 */
@Component({
  selector: 'app-register',
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
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Crear Cuenta</mat-card-title>
          <mat-card-subtitle>Regístrate en Finance App</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <!-- Nombre -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre Completo</mat-label>
              <input matInput formControlName="nombre" placeholder="Tu nombre" />
              <mat-error *ngIf="nombre?.hasError('required')">
                El nombre es requerido
              </mat-error>
              <mat-error *ngIf="nombre?.hasError('minlength')">
                Mínimo 3 caracteres
              </mat-error>
            </mat-form-field>

            <!-- Email -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="tu@correo.com" />
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
              <input
                matInput
                formControlName="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
              />
              <mat-error *ngIf="password?.hasError('required')">
                La contraseña es requerida
              </mat-error>
              <mat-error *ngIf="password?.hasError('minlength')">
                Mínimo 6 caracteres
              </mat-error>
            </mat-form-field>

            <!-- Confirm Password -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar Contraseña</mat-label>
              <input
                matInput
                formControlName="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
              />
              <mat-error *ngIf="confirmPassword?.hasError('required')">
                Confirma tu contraseña
              </mat-error>
              <mat-error *ngIf="registerForm.hasError('passwordMismatch')">
                Las contraseñas no coinciden
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
              [disabled]="!registerForm.valid || isLoading"
            >
              <mat-spinner *ngIf="isLoading" diameter="20" class="spinner"></mat-spinner>
              <span *ngIf="!isLoading">Crear Cuenta</span>
            </button>
          </form>

          <!-- Login Link -->
          <div class="login-link">
            ¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .register-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, var(--color-bg-dark) 0%, var(--color-bg-darker) 100%);
        padding: var(--spacing-md);
      }

      .register-card {
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

      .login-link {
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
    `
  ]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isLoading = false;
  errorMessage = '';

  registerForm: FormGroup;

  constructor() {
    // Crear formulario reactivo con validador personalizado para contraseñas
    this.registerForm = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      {
        validators: this.passwordMatchValidator
      }
    );
  }

  /**
   * Validador personalizado que verifica si las contraseñas coinciden
   */
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Getters para acceder a los controles del formulario
   */
  get nombre() {
    return this.registerForm.get('nombre');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  /**
   * Maneja el envío del formulario de registro
   */
  onRegister(): void {
    if (!this.registerForm.valid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { nombre, email, password } = this.registerForm.value;

    // Llamar al servicio de autenticación (mock)
    this.authService.register(nombre, email, password).subscribe({
      next: () => {
        // Redireccionar al dashboard después del registro exitoso
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Error al crear la cuenta. Intenta de nuevo.';
        console.error('Register error:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}

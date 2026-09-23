import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Pide el enlace de recuperación.
 *
 * El backend responde siempre lo mismo, exista el correo o no, para que esta
 * pantalla no sirva para averiguar quién tiene cuenta. Por eso aquí sólo hay
 * un estado de éxito, nunca un "ese correo no existe".
 */
@Component({
  selector: 'app-forgot-password',
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
          <mat-card-title>Recuperar el acceso</mat-card-title>
          <mat-card-subtitle *ngIf="!sent()">
            Escribe tu correo y te mandamos un enlace para elegir una contraseña nueva
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form *ngIf="!sent()" [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo electrónico</mat-label>
              <input matInput formControlName="email" type="email" placeholder="ejemplo@correo.com" />
              <mat-error *ngIf="form.controls.email.hasError('required')">
                Escribe tu correo
              </mat-error>
              <mat-error *ngIf="form.controls.email.hasError('email')">
                Ese correo no tiene un formato válido
              </mat-error>
            </mat-form-field>

            <div *ngIf="error()" class="message error">{{ error() }}</div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width"
              [disabled]="!form.valid || loading()"
            >
              <mat-spinner *ngIf="loading()" diameter="20" class="spinner"></mat-spinner>
              <span *ngIf="!loading()">Enviar enlace</span>
            </button>
          </form>

          <!-- Confirmación: el mismo texto exista o no la cuenta -->
          <div *ngIf="sent()" class="sent">
            <mat-icon class="sent-icon">mark_email_read</mat-icon>
            <p class="message ok">{{ message() }}</p>
            <p class="hint">
              El enlace caduca en 30 minutos y sólo se puede usar una vez. Si pides otro, el
              anterior deja de servir.
            </p>

            <!-- Atajo de desarrollo: sin servidor de correo, el enlace viene
                 en la respuesta para poder probar el flujo completo. -->
            <div *ngIf="devUrl()" class="dev-link">
              <span class="dev-label">Modo desarrollo · no hay servidor de correo</span>
              <a [href]="devUrl()">Abrir el enlace de recuperación</a>
            </div>
          </div>

          <div class="back-link">
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
      }

      .message.ok {
        background-color: rgba(16, 185, 129, 0.1);
        border-left: 4px solid var(--color-success);
        color: var(--color-text-primary);
        margin: 0;
      }

      .sent {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-md);
        text-align: center;
      }

      .sent-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--color-success);
      }

      .hint {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        margin: 0;
      }

      .dev-link {
        width: 100%;
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        background-color: var(--color-bg-input);
        border-left: 3px solid var(--color-info);
        display: flex;
        flex-direction: column;
        gap: 4px;
        text-align: left;

        a {
          color: var(--color-primary);
          font-weight: 600;
          font-size: var(--font-size-sm);
          word-break: break-all;
        }
      }

      .dev-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-text-muted);
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
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  // Señales: la app corre sin zone.js, así que subscribe() no redibuja solo.
  loading = signal(false);
  sent = signal(false);
  message = signal('');
  error = signal('');
  devUrl = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (!this.form.valid || this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: response => {
        this.loading.set(false);
        this.sent.set(true);
        this.message.set(response.message);
        this.devUrl.set(response.resetUrl ?? null);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo contactar con el servidor. Inténtalo de nuevo en un momento.');
      }
    });
  }
}

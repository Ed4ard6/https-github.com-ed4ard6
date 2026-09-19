import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
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
    <div class="profile-container">
      <h1>Mi cuenta</h1>

      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>person</mat-icon>
            Datos personales
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" />
              <mat-error *ngIf="profileForm.get('nombre')?.hasError('required')">
                El nombre es obligatorio
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" formControlName="email" />
              <mat-error *ngIf="profileForm.get('email')?.hasError('email')">
                Introduce un correo válido
              </mat-error>
            </mat-form-field>

            <div class="actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="savingProfile()">
                Guardar cambios
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>lock</mat-icon>
            Cambiar contraseña
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña actual</mat-label>
              <input matInput type="password" formControlName="currentPassword" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nueva contraseña</mat-label>
              <input matInput type="password" formControlName="newPassword" />
              <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">
                Mínimo 6 caracteres
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Repetir nueva contraseña</mat-label>
              <input matInput type="password" formControlName="confirmPassword" />
              <mat-error *ngIf="passwordForm.hasError('mismatch')">
                Las contraseñas no coinciden
              </mat-error>
            </mat-form-field>

            <div class="actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="savingPassword()">
                Actualizar contraseña
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: var(--spacing-lg);
      max-width: 640px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    h1 {
      font-size: var(--font-size-2xl);
      margin: 0;
    }

    :host ::ng-deep {
      mat-card {
        background-color: var(--color-bg-card);
        border: 1px solid var(--color-border);
      }

      mat-card-header {
        padding: var(--spacing-lg) var(--spacing-lg) 0;
        border-bottom: 1px solid var(--color-border-light);
        margin-bottom: var(--spacing-lg);
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: var(--font-size-lg);
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
    }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  savingProfile = signal(false);
  savingPassword = signal(false);

  profileForm = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });

  passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: group => group.get('newPassword')?.value === group.get('confirmPassword')?.value ? null : { mismatch: true } }
  );

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (user) => this.profileForm.patchValue({ nombre: user.nombre, email: user.email }),
      error: () => this.snackBar.open('No se pudo cargar tu perfil', 'Cerrar', { duration: 4000 })
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;

    this.savingProfile.set(true);
    this.userService.updateProfile({
      nombre: this.profileForm.value.nombre!,
      email: this.profileForm.value.email!
    }).subscribe({
      next: (user) => {
        this.authService.updateStoredUser(user);
        this.snackBar.open('Datos actualizados', 'Cerrar', { duration: 3000 });
        this.savingProfile.set(false);
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'No se pudo guardar', 'Cerrar', { duration: 5000 });
        this.savingProfile.set(false);
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) return;

    this.savingPassword.set(true);
    this.userService.changePassword({
      currentPassword: this.passwordForm.value.currentPassword!,
      newPassword: this.passwordForm.value.newPassword!
    }).subscribe({
      next: () => {
        this.snackBar.open('Contraseña actualizada', 'Cerrar', { duration: 3000 });
        this.passwordForm.reset();
        this.savingPassword.set(false);
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'No se pudo cambiar la contraseña', 'Cerrar', { duration: 5000 });
        this.savingPassword.set(false);
      }
    });
  }
}

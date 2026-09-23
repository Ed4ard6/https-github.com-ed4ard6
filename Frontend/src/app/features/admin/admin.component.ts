import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminUser, AdminStats, AdminAuditLog } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule
  ],
  template: `
    <div class="admin-container">
      <div class="header">
        <div>
          <h1>Administración</h1>
          <p class="subtitle">Gestión de cuentas y accesos</p>
        </div>
      </div>

      <mat-card class="scope-note">
        <mat-icon>shield</mat-icon>
        <p>
          Desde aquí se gestionan <strong>accesos</strong>, no dinero. No hay forma de
          ver las transacciones, deudas ni ahorros de otra cuenta, y las contraseñas
          no se pueden consultar: solo se guarda su huella cifrada. Cada acción queda
          registrada abajo.
        </p>
      </mat-card>

      <div class="stats-grid" *ngIf="stats() as s">
        <mat-card class="stat-card">
          <span class="stat-label">Cuentas</span>
          <span class="stat-value">{{ s.totalUsers }}</span>
          <span class="stat-hint">{{ s.activeUsers }} activas</span>
        </mat-card>
        <mat-card class="stat-card">
          <span class="stat-label">Administradores</span>
          <span class="stat-value">{{ s.admins }}</span>
        </mat-card>
        <mat-card class="stat-card">
          <span class="stat-label">Activas (30 días)</span>
          <span class="stat-value">{{ s.activeLast30Days }}</span>
          <span class="stat-hint">con acceso reciente</span>
        </mat-card>
        <mat-card class="stat-card">
          <span class="stat-label">Movimientos</span>
          <span class="stat-value">{{ s.totalTransactions }}</span>
          <span class="stat-hint">total, sin importes</span>
        </mat-card>
      </div>

      <mat-card class="temp-password" *ngIf="temporaryPassword() as temp">
        <mat-icon>key</mat-icon>
        <div>
          <strong>Contraseña provisional de {{ temp.email }}</strong>
          <code>{{ temp.password }}</code>
          <p>
            Entrégasela por un canal seguro. No vuelve a mostrarse: a partir de
            ahora solo existe su huella cifrada.
          </p>
        </div>
        <button mat-icon-button (click)="temporaryPassword.set(null)" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </mat-card>

      <mat-card class="users-card">
        <h2>Cuentas</h2>

        <div class="user-row" *ngFor="let user of users()" [class.inactive]="!user.activo">
          <div class="user-avatar" [class.admin]="user.role === 'admin'">
            {{ initial(user.nombre) }}
          </div>

          <div class="user-info">
            <span class="user-name">
              {{ user.nombre }}
              <span class="role-badge" *ngIf="user.role === 'admin'">admin</span>
              <span class="role-badge you" *ngIf="user.id === currentUserId()">tú</span>
            </span>
            <span class="user-email">{{ user.email }}</span>
          </div>

          <div class="user-meta">
            <span>{{ user.transactionCount }} movimientos</span>
            <span>{{ lastAccess(user) }}</span>
          </div>

          <span class="status" [class.off]="!user.activo">
            {{ user.activo ? 'Activa' : 'Desactivada' }}
          </span>

          <div class="user-actions">
            <button
              mat-stroked-button
              (click)="resetPassword(user)"
              [disabled]="busy()"
            >
              Restablecer contraseña
            </button>
            <button
              mat-stroked-button
              [color]="user.activo ? 'warn' : 'primary'"
              (click)="toggleStatus(user)"
              [disabled]="busy() || user.id === currentUserId()"
              [title]="user.id === currentUserId() ? 'No puedes desactivar tu propia cuenta' : ''"
            >
              {{ user.activo ? 'Desactivar' : 'Activar' }}
            </button>
          </div>
        </div>
      </mat-card>

      <mat-card class="audit-card">
        <h2>Registro de actividad</h2>

        <p class="empty" *ngIf="auditLog().length === 0">
          Todavía no se ha realizado ninguna acción de administración.
        </p>

        <div class="audit-row" *ngFor="let entry of auditLog()">
          <mat-icon [class]="actionClass(entry.action)">{{ actionIcon(entry.action) }}</mat-icon>
          <div class="audit-info">
            <span class="audit-detail">{{ entry.details }}</span>
            <span class="audit-meta">
              {{ entry.adminEmail }} → {{ entry.targetEmail }} · {{ formatDateTime(entry.createdAt) }}
            </span>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: var(--spacing-lg);
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    h1 {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-2xl);
    }

    .subtitle {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    h2 {
      margin: 0 0 var(--spacing-lg);
      font-size: var(--font-size-lg);
    }

    .scope-note {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border-left: 3px solid var(--color-info);
    }

    .scope-note mat-icon {
      color: var(--color-info);
      flex-shrink: 0;
    }

    .scope-note p {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: var(--spacing-md);
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      padding: var(--spacing-lg);
      border-left: 3px solid var(--color-primary);
    }

    .stat-label {
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted);
    }

    .stat-value {
      font-size: var(--font-size-xl);
      font-weight: 700;
    }

    .stat-hint {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .temp-password {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border-left: 3px solid var(--color-warning);
      background: rgba(245, 158, 11, 0.1);
    }

    .temp-password > mat-icon {
      color: var(--color-warning);
      flex-shrink: 0;
    }

    .temp-password > div {
      flex: 1;
    }

    .temp-password strong {
      display: block;
      margin-bottom: var(--spacing-sm);
    }

    .temp-password code {
      display: inline-block;
      padding: 6px 12px;
      border-radius: var(--radius-md);
      background: rgba(0, 0, 0, 0.35);
      font-size: var(--font-size-lg);
      letter-spacing: 1px;
      user-select: all;
    }

    .temp-password p {
      margin: var(--spacing-sm) 0 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .users-card, .audit-card {
      padding: var(--spacing-lg);
    }

    .user-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      transition: background-color var(--transition-fast);
      flex-wrap: wrap;
    }

    .user-row:hover {
      background-color: rgba(124, 58, 237, 0.08);
    }

    .user-row.inactive {
      opacity: 0.6;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(148, 163, 184, 0.2);
      font-weight: 700;
    }

    .user-avatar.admin {
      background: var(--color-primary);
      color: #fff;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 160px;
    }

    .user-name {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .role-badge {
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: rgba(124, 58, 237, 0.2);
      color: var(--color-primary-light);
      font-size: 11px;
      font-weight: 600;
    }

    .role-badge.you {
      background: rgba(148, 163, 184, 0.2);
      color: var(--color-text-muted);
    }

    .user-email {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      min-width: 130px;
    }

    .status {
      padding: 4px 10px;
      border-radius: var(--radius-full);
      background: rgba(16, 185, 129, 0.15);
      color: var(--color-success);
      font-size: var(--font-size-xs);
      font-weight: 600;
      white-space: nowrap;
    }

    .status.off {
      background: rgba(239, 68, 68, 0.15);
      color: var(--color-danger);
    }

    .user-actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .user-actions button {
      font-size: var(--font-size-xs);
    }

    .audit-row {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-sm) var(--spacing-md);
    }

    .audit-row mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--color-text-muted);
    }

    .audit-row mat-icon.danger { color: var(--color-danger); }
    .audit-row mat-icon.success { color: var(--color-success); }
    .audit-row mat-icon.warning { color: var(--color-warning); }

    .audit-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .audit-detail {
      font-size: var(--font-size-sm);
    }

    .audit-meta {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .empty {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }
  `]
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users = signal<AdminUser[]>([]);
  stats = signal<AdminStats | null>(null);
  auditLog = signal<AdminAuditLog[]>([]);
  busy = signal(false);
  temporaryPassword = signal<{ email: string; password: string } | null>(null);

  currentUserId = computed(() => this.authService.getCurrentUser()?.id ?? '');

  ngOnInit() {
    this.load();
  }

  private load() {
    this.adminService.getUsers().subscribe({
      next: (data) => this.users.set(data ?? []),
      error: () => this.snackBar.open('No se pudieron cargar las cuentas', 'Cerrar', { duration: 5000 })
    });

    this.adminService.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.stats.set(null)
    });

    this.loadAudit();
  }

  private loadAudit() {
    this.adminService.getAuditLog().subscribe({
      next: (data) => this.auditLog.set(data ?? []),
      error: () => this.auditLog.set([])
    });
  }

  toggleStatus(user: AdminUser) {
    const desactivar = user.activo;

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: desactivar ? '¿Desactivar esta cuenta?' : '¿Reactivar esta cuenta?',
        message: desactivar
          ? `${user.email} dejará de poder iniciar sesión. Sus datos se conservan intactos.`
          : `${user.email} volverá a poder iniciar sesión.`,
        confirmText: desactivar ? 'Desactivar' : 'Activar',
        icon: desactivar ? 'block' : 'check_circle',
        danger: desactivar
      } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.busy.set(true);
      this.adminService.setUserStatus(user.id, !user.activo).subscribe({
        next: (actualizado) => {
          this.users.update(list => list.map(u => (u.id === user.id ? actualizado : u)));
          this.busy.set(false);
          this.loadAudit();
          this.snackBar.open(desactivar ? 'Cuenta desactivada' : 'Cuenta reactivada', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message ?? 'No se pudo cambiar el estado', 'Cerrar', { duration: 5000 });
          this.busy.set(false);
        }
      });
    });
  }

  resetPassword(user: AdminUser) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Restablecer la contraseña?',
        message: `Se generará una contraseña provisional para ${user.email} y la actual dejará de servir. Tendrás que entregársela tú.`,
        confirmText: 'Restablecer',
        icon: 'key',
        danger: true
      } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.busy.set(true);
      this.adminService.resetPassword(user.id).subscribe({
        next: ({ temporaryPassword }) => {
          this.temporaryPassword.set({ email: user.email, password: temporaryPassword });
          this.busy.set(false);
          this.loadAudit();
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message ?? 'No se pudo restablecer', 'Cerrar', { duration: 5000 });
          this.busy.set(false);
        }
      });
    });
  }

  initial(nombre: string): string {
    return nombre?.trim().charAt(0).toUpperCase() ?? '?';
  }

  lastAccess(user: AdminUser): string {
    if (!user.lastLoginAt) return 'sin accesos';
    return `visto ${this.formatDate(user.lastLoginAt)}`;
  }

  actionIcon(action: string): string {
    switch (action) {
      case 'DeactivateUser': return 'block';
      case 'ActivateUser': return 'check_circle';
      case 'ResetPassword': return 'key';
      default: return 'edit';
    }
  }

  actionClass(action: string): string {
    switch (action) {
      case 'DeactivateUser': return 'danger';
      case 'ActivateUser': return 'success';
      case 'ResetPassword': return 'warning';
      default: return '';
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }
}

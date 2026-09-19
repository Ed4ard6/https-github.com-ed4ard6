import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar class="app-header">
      <a class="logo" [routerLink]="['/dashboard']" aria-label="Ir al dashboard">
        <span class="logo-emoji">💰</span>
        <span class="logo-text">Finance App</span>
      </a>

      <span class="spacer"></span>

      <button type="button" [matMenuTriggerFor]="userMenu" class="user-trigger">
        <span class="avatar">{{ initial(user?.nombre) }}</span>
        <span class="user-name">{{ user?.nombre }}</span>
        <mat-icon class="chevron">expand_more</mat-icon>
      </button>

      <mat-menu #userMenu="matMenu" class="user-menu">
        <div class="menu-header">
          <span class="menu-name">{{ user?.nombre }}</span>
          <span class="menu-email">{{ user?.email }}</span>
        </div>

        <mat-divider></mat-divider>

        <button mat-menu-item [routerLink]="['/profile']">
          <mat-icon>manage_accounts</mat-icon>
          <span>Mi cuenta</span>
        </button>

        <mat-divider></mat-divider>

        <button mat-menu-item class="logout-item" (click)="onLogout()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [
    `
      .app-header {
        background-color: var(--color-bg-card);
        border-bottom: 1px solid var(--color-border);
        height: 64px;
        display: flex;
        align-items: center;
        padding: 0 var(--spacing-lg);
        flex-shrink: 0;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        text-decoration: none;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-md);
        transition: background-color var(--transition-fast);
        cursor: pointer;
      }

      .logo:hover {
        background-color: rgba(124, 58, 237, 0.12);
      }

      .logo-emoji {
        font-size: 24px;
        line-height: 1;
      }

      .logo-text {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--color-primary);
        white-space: nowrap;
      }

      .spacer {
        flex: 1;
      }

      .user-trigger {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--spacing-sm);
        color: var(--color-text-primary);
        height: 44px;
        padding: 0 var(--spacing-sm);
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--radius-full);
        font-family: inherit;
        cursor: pointer;
        transition: background-color var(--transition-fast), border-color var(--transition-fast);
      }

      .user-trigger:hover {
        background-color: rgba(124, 58, 237, 0.12);
        border-color: var(--color-border);
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--color-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: var(--font-size-sm);
      }

      .user-name {
        font-size: var(--font-size-sm);
        font-weight: 500;
        display: none;
      }

      @media (min-width: 720px) {
        .user-name {
          display: inline;
        }
      }

      .chevron {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--color-text-muted);
      }
    `
  ]
})
export class HeaderComponent {
  private authService = inject(AuthService);

  @Output() logoutClick = new EventEmitter<void>();

  get user() {
    return this.authService.getCurrentUser();
  }

  initial(nombre?: string | null): string {
    return nombre?.trim().charAt(0).toUpperCase() ?? '?';
  }

  onLogout(): void {
    this.logoutClick.emit();
  }
}

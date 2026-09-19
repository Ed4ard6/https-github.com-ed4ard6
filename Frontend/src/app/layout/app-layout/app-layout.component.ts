import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog } from '@angular/material/dialog';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../core/services/auth.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    HeaderComponent
  ],
  template: `
    <div class="layout-wrapper">
      <!-- Header -->
      <app-header (logoutClick)="confirmLogout()"></app-header>

      <!-- Contenido con Sidebar -->
      <div class="content-wrapper">
        <mat-sidenav-container autosize>
          <mat-sidenav mode="side" [opened]="true" class="sidebar">
            <div class="sidebar-content">
            <nav class="nav-menu">
              <a class="nav-item active" [routerLink]="['/dashboard']" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
                <mat-icon>dashboard</mat-icon>
                <span>Dashboard</span>
              </a>
              <a class="nav-item" [routerLink]="['/transactions']" routerLinkActive="active">
                <mat-icon>receipt_long</mat-icon>
                <span>Transacciones</span>
              </a>
              <a class="nav-item" [routerLink]="['/categories']" routerLinkActive="active">
                <mat-icon>label</mat-icon>
                <span>Categorías</span>
              </a>
              <a class="nav-item" [routerLink]="['/debts']" routerLinkActive="active">
                <mat-icon>credit_card</mat-icon>
                <span>Deudas</span>
              </a>
              <a class="nav-item" [routerLink]="['/budgets']" routerLinkActive="active">
                <mat-icon>account_balance_wallet</mat-icon>
                <span>Presupuestos</span>
              </a>
              <a class="nav-item" [routerLink]="['/savings']" routerLinkActive="active">
                <mat-icon>savings</mat-icon>
                <span>Ahorros</span>
              </a>
              <div class="nav-group">
                <button
                  type="button"
                  class="nav-item nav-toggle"
                  [class.active]="isReportsRoute()"
                  (click)="reportsOpen.set(!reportsOpen())"
                  [attr.aria-expanded]="reportsOpen()"
                >
                  <mat-icon>analytics</mat-icon>
                  <span>Reportes</span>
                  <mat-icon class="chevron" [class.open]="reportsOpen()">expand_more</mat-icon>
                </button>

                <div class="submenu" [class.open]="reportsOpen()">
                  <a
                    *ngFor="let report of reports"
                    class="nav-subitem"
                    [routerLink]="[report.path]"
                    routerLinkActive="active"
                  >
                    <mat-icon>{{ report.icon }}</mat-icon>
                    <span>{{ report.label }}</span>
                  </a>
                </div>
              </div>
            </nav>

            <div class="sidebar-footer">
              <button type="button" class="nav-item logout-item" (click)="confirmLogout()">
                <mat-icon>logout</mat-icon>
                <span>Cerrar sesión</span>
              </button>
            </div>
            </div>
          </mat-sidenav>

          <mat-sidenav-content>
            <div class="main-content">
              <router-outlet></router-outlet>
            </div>
          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .layout-wrapper {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--color-bg-dark);
    }

    .app-header {
      background-color: var(--color-bg-card);
      border-bottom: 1px solid var(--color-border);
      height: 70px;
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-lg);
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      width: 100%;
      gap: var(--spacing-lg);
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      min-width: 200px;
      flex-shrink: 0;
    }

    .logo {
      font-size: 32px;
      line-height: 1;
    }

    .logo-section h1 {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--color-primary);
      margin: 0;
      white-space: nowrap;
    }

    .spacer {
      flex: 1;
    }

    .content-wrapper {
      flex: 1;
      overflow: hidden;
      display: flex;
    }

    mat-sidenav-container {
      width: 100%;
      height: 100%;
    }

    .sidebar {
      width: 280px !important;
      background-color: var(--color-bg-darker);
      border-right: 1px solid var(--color-border);
      padding: var(--spacing-lg) 0;
      flex-shrink: 0;
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      padding: 0 var(--spacing-sm);
    }

    .sidebar-footer {
      margin-top: auto;
      padding: var(--spacing-md) var(--spacing-sm) 0;
      border-top: 1px solid var(--color-border);
    }

    .nav-group {
      display: flex;
      flex-direction: column;
    }

    .nav-toggle {
      width: 100%;
      background: transparent;
      border: 1px solid transparent;
      border-left: 3px solid transparent;
      font-family: inherit;
      text-align: left;
      cursor: pointer;

      .chevron {
        margin-left: auto;
        font-size: 20px;
        width: 20px;
        height: 20px;
        transition: transform var(--transition-base);
      }

      .chevron.open {
        transform: rotate(180deg);
      }
    }

    // Se despliega con max-height para que la transición funcione
    // sin fijar una altura concreta.
    .submenu {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height var(--transition-base), opacity var(--transition-base),
        margin var(--transition-base);
    }

    .submenu.open {
      max-height: 320px;
      opacity: 1;
      margin: var(--spacing-xs) 0;
    }

    .nav-subitem {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: 10px 16px 10px 44px;
      color: var(--color-text-muted);
      text-decoration: none;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      transition: all 0.2s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background-color: rgba(124, 58, 237, 0.1);
        color: var(--color-text-primary);
      }

      &.active {
        color: var(--color-primary);
        background-color: rgba(124, 58, 237, 0.15);
        font-weight: 600;
      }
    }

    .logout-item {
      width: 100%;
      background: transparent;
      border: 1px solid transparent;
      border-left: 3px solid transparent;
      font-family: inherit;
      text-align: left;
      color: var(--color-danger);

      mat-icon {
        color: var(--color-danger);
      }

      &:hover {
        background-color: rgba(239, 68, 68, 0.12);
        color: var(--color-danger);
        border-left-color: var(--color-danger);
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: 12px 16px;
      color: var(--color-text-secondary);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      cursor: pointer;
      border-left: 3px solid transparent;
      margin-left: -3px;
      font-weight: 500;
      font-size: var(--font-size-sm);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: currentColor;
      }

      &:hover {
        background-color: rgba(167, 139, 250, 0.1);
        color: var(--color-primary);
      }

      &.active {
        background-color: rgba(167, 139, 250, 0.15);
        border-left-color: var(--color-primary);
        color: var(--color-primary);
        font-weight: 600;
      }
    }

    mat-sidenav-content {
      overflow-y: auto;
      background-color: var(--color-bg-dark);
    }

    .main-content {
      height: 100%;
      background-color: var(--color-bg-dark);
    }
  `]
})
export class AppLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  reports = [
    { path: '/reports/monthly', label: 'Mensual', icon: 'bar_chart' },
    { path: '/reports/waterfall', label: 'Flujo de caja', icon: 'waterfall_chart' },
    { path: '/reports/calendar', label: 'Calendario', icon: 'calendar_month' },
    { path: '/reports/categories', label: 'Por categoría', icon: 'donut_large' }
  ];

  // Abierto de entrada si ya estás dentro de un reporte.
  reportsOpen = signal(this.router.url.startsWith('/reports'));

  isReportsRoute = computed(() => this.reportsOpen() || this.router.url.startsWith('/reports'));

  confirmLogout(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Cerrar sesión?',
        message: 'Tendrás que volver a iniciar sesión para acceder a tus datos.',
        confirmText: 'Cerrar sesión',
        icon: 'logout',
        danger: true
      } satisfies ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.logout();
    });
  }

  private logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}

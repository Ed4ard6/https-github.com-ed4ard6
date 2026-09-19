import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reports-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, MatIconModule],
  template: `
    <div class="reports-shell">
      <nav class="reports-tabs">
        <a
          *ngFor="let report of reports"
          class="tab"
          [routerLink]="[report.path]"
          routerLinkActive="active"
        >
          <mat-icon>{{ report.icon }}</mat-icon>
          <span class="tab-label">{{ report.label }}</span>
        </a>
      </nav>

      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .reports-shell {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .reports-tabs {
      display: flex;
      gap: var(--spacing-xs);
      padding: var(--spacing-md) var(--spacing-lg) 0;
      border-bottom: 1px solid var(--color-border);
      overflow-x: auto;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-lg);
      color: var(--color-text-secondary);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      font-weight: 500;
      white-space: nowrap;
      transition: color var(--transition-fast), background-color var(--transition-fast),
        border-color var(--transition-fast);
    }

    .tab:hover {
      color: var(--color-text-primary);
      background-color: rgba(124, 58, 237, 0.08);
    }

    .tab.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
      font-weight: 600;
    }

    .tab mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    @media (max-width: 620px) {
      .tab-label {
        display: none;
      }

      .tab {
        padding: var(--spacing-md);
      }
    }
  `]
})
export class ReportsLayoutComponent {
  reports = [
    { path: 'monthly', label: 'Mensual', icon: 'bar_chart' },
    { path: 'waterfall', label: 'Flujo de caja', icon: 'waterfall_chart' },
    { path: 'calendar', label: 'Calendario', icon: 'calendar_month' },
    { path: 'categories', label: 'Categorías', icon: 'donut_large' }
  ];
}

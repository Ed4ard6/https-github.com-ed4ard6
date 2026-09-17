import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../core/services/mock-data.service';
import { SavingsGoal } from '../../core/models/domain.models';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatButtonModule, MatIconModule],
  template: `
    <div class="savings-container">
      <div class="header">
        <h1>Metas de Ahorro</h1>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          Nueva Meta
        </button>
      </div>

      <div class="goals-grid">
        <mat-card *ngFor="let goal of goals" class="goal-card">
          <mat-card-header>
            <mat-card-title>{{ goal.nombre }}</mat-card-title>
            <mat-card-subtitle>{{ formatDate(goal.targetDate) }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="goal-progress">
              <mat-progress-bar [value]="calculateProgress(goal)" color="accent"></mat-progress-bar>
              <span class="progress-text">{{ calculateProgress(goal).toFixed(0) }}%</span>
            </div>

            <div class="amounts">
              <div class="amount-item">
                <span class="label">Ahorrado</span>
                <span class="value">{{ formatCurrency(goal.currentAmount) }}</span>
              </div>
              <div class="amount-item">
                <span class="label">Meta</span>
                <span class="value">{{ formatCurrency(goal.targetAmount) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .savings-container { padding: var(--spacing-lg); }
    .header { display: flex; justify-content: space-between; margin-bottom: var(--spacing-lg); }
    .goals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg); }
    .goal-card { background-color: var(--color-bg-card) !important; }
    .goal-progress { display: flex; gap: var(--spacing-md); align-items: center; margin-bottom: var(--spacing-md); }
    .progress-text { font-weight: 600; min-width: 50px; }
    .amounts { display: flex; justify-content: space-between; }
    .amount-item { text-align: center; }
    .label { color: var(--color-text-secondary); display: block; font-size: var(--font-size-sm); }
    .value { font-weight: 700; color: var(--color-primary); }
  `]
})
export class SavingsComponent implements OnInit {
  private mockDataService = inject(MockDataService);

  goals: SavingsGoal[] = [];

  ngOnInit() {
    this.goals = this.mockDataService.getSavingsGoals();
  }

  calculateProgress(goal: SavingsGoal): number {
    return (goal.currentAmount / goal.targetAmount) * 100;
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  }

  formatDate(date: Date | string) {
    return new Intl.DateTimeFormat('es-CO').format(new Date(date));
  }
}

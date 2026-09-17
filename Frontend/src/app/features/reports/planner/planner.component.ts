import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule],
  template: `
    <div class="planner-container">
      <h1>Planificador Quincenal</h1>
      <p>Asignación de ingresos (1ª y 2ª quincena)</p>

      <div class="quincenas-grid">
        <mat-card class="quincena-card">
          <mat-card-header>
            <mat-card-title>Primera Quincena (1-15)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="allocation">
              <div class="item">
                <span class="label">Ingreso</span>
                <span class="amount">$1,500,000</span>
              </div>
              <div class="item">
                <span class="label">Asignado a Gastos</span>
                <span class="amount">$400,000</span>
              </div>
              <div class="item">
                <span class="label">Disponible</span>
                <span class="amount">$1,100,000</span>
              </div>
              <mat-progress-bar [value]="26.7" color="accent" mode="determinate"></mat-progress-bar>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="quincena-card">
          <mat-card-header>
            <mat-card-title>Segunda Quincena (16-30)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="allocation">
              <div class="item">
                <span class="label">Ingreso</span>
                <span class="amount">$1,500,000</span>
              </div>
              <div class="item">
                <span class="label">Asignado a Gastos</span>
                <span class="amount">$330,000</span>
              </div>
              <div class="item">
                <span class="label">Disponible</span>
                <span class="amount">$1,170,000</span>
              </div>
              <mat-progress-bar [value]="22.0" color="primary" mode="determinate"></mat-progress-bar>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .planner-container { padding: var(--spacing-lg); }
    .quincenas-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-lg); }
    .quincena-card { background-color: var(--color-bg-card) !important; }
    .allocation { display: flex; flex-direction: column; gap: var(--spacing-md); }
    .item { display: flex; justify-content: space-between; padding: var(--spacing-sm) 0; }
    .label { color: var(--color-text-secondary); }
    .amount { font-weight: 700; color: var(--color-primary); }
  `]
})
export class PlannerComponent {}

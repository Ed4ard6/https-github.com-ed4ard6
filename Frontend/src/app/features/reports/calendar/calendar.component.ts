import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="report-container">
      <h1>Mapa de Calor - Actividad de Gastos</h1>
      <p>Visualiza tu actividad de gasto por día</p>
      <mat-card>
        <mat-card-content>
          <div class="chart-placeholder">
            <p>Calendario de calor (Heat Map) de gastos diarios</p>
            <p style="font-size: 48px;">🗓️</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .report-container { padding: var(--spacing-lg); }
    .chart-placeholder { text-align: center; padding: var(--spacing-2xl); }
  `]
})
export class CalendarComponent {}

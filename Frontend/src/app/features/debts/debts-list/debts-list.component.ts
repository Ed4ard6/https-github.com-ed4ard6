import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MockDataService } from '../../../core/services/mock-data.service';
import { Debt } from '../../../core/models/domain.models';

@Component({
  selector: 'app-debts-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="debts-container">
      <div class="header">
        <h1>Deudas</h1>
        <button mat-raised-button color="primary" (click)="navigateTo('/debts/compare')">
          <mat-icon>compare</mat-icon>
          Comparar Estrategias
        </button>
      </div>

      <mat-card>
        <table mat-table [dataSource]="debts" class="debts-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let element">{{ element.nombre }}</td>
          </ng-container>

          <ng-container matColumnDef="balance">
            <th mat-header-cell *matHeaderCellDef>Saldo</th>
            <td mat-cell *matCellDef="let element">{{ formatCurrency(element.balance) }}</td>
          </ng-container>

          <ng-container matColumnDef="rate">
            <th mat-header-cell *matHeaderCellDef>Tasa Anual</th>
            <td mat-cell *matCellDef="let element">{{ element.annualRate }}%</td>
          </ng-container>

          <ng-container matColumnDef="minPayment">
            <th mat-header-cell *matHeaderCellDef>Pago Mínimo</th>
            <td mat-cell *matCellDef="let element">{{ formatCurrency(element.minimumPayment) }}</td>
          </ng-container>

          <ng-container matColumnDef="paymentDay">
            <th mat-header-cell *matHeaderCellDef>Día de Pago</th>
            <td mat-cell *matCellDef="let element">Día {{ element.paymentDay }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .debts-container { padding: var(--spacing-lg); }
    .header { display: flex; justify-content: space-between; margin-bottom: var(--spacing-lg); }
    .debts-table { width: 100%; }
  `]
})
export class DebtsListComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private router = inject(Router);

  debts: Debt[] = [];
  displayedColumns = ['nombre', 'balance', 'rate', 'minPayment', 'paymentDay'];

  ngOnInit() {
    this.debts = this.mockDataService.getDebts();
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

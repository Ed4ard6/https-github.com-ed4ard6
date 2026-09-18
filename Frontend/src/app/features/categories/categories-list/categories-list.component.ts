import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MockDataService } from '../../../core/services/mock-data.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/domain.models';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="categories-container">
      <div class="header">
        <h1>Categorías</h1>
        <button mat-raised-button color="primary" (click)="navigateTo('/categories/create')">
          <mat-icon>add</mat-icon>
          Nueva Categoría
        </button>
      </div>

      <mat-card>
        <table mat-table [dataSource]="categories" class="categories-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let element">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div
                  style="width: 16px; height: 16px; border-radius: 50%; background-color: {{ element.color }}"
                ></div>
                {{ element.nombre }}
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="kind">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let element">{{ element.kind }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let element">
              {{ element.activo ? 'Activa' : 'Inactiva' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button (click)="editCategory(element.id)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteCategory(element.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .categories-container { padding: var(--spacing-lg); }
    .header { display: flex; justify-content: space-between; margin-bottom: var(--spacing-lg); }
    .categories-table { width: 100%; }
  `]
})
export class CategoriesListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private mockDataService = inject(MockDataService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  categories: Category[] = [];
  displayedColumns = ['nombre', 'kind', 'status', 'actions'];

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().pipe(
      timeout(8000),
      catchError((error) => {
        console.warn('⚠️ Error loading categories from API:', error?.message);
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('✅ Loaded categories from API:', data.length);
          this.categories = data;
        } else {
          console.log('⚠️ Empty categories, using mock data');
          this.categories = this.mockDataService.getCategories();
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Categories error:', error);
        this.categories = this.mockDataService.getCategories();
        this.cdr.detectChanges();
      }
    });
  }

  editCategory(id: string) {
    this.router.navigate(['/categories/edit', id]);
  }

  deleteCategory(id: string) {
    this.categories = this.categories.filter(c => c.id !== id);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

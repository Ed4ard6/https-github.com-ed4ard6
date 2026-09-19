import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { KindLabelPipe } from '../../../shared/pipes/kind-label.pipe';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/domain.models';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    KindLabelPipe
  ],
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
            <td mat-cell *matCellDef="let element">{{ element.kind | kindLabel }}</td>
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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  categories: Category[] = [];
  displayedColumns = ['nombre', 'kind', 'status', 'actions'];

  ngOnInit() {
    this.loadCategories();
  }

  // Sin fallback a mock: enseñar categorías que no existen en la base de
  // datos lleva a errores al intentar usarlas.
  loadCategories() {
    this.categoryService.getCategories().pipe(timeout(8000)).subscribe({
      next: (data) => {
        this.categories = data ?? [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('No se pudieron cargar las categorías', 'Cerrar', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }

  editCategory(id: string) {
    this.router.navigate(['/categories/edit', id]);
  }

  deleteCategory(id: string) {
    const category = this.categories.find(c => c.id === id);

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Eliminar categoría?',
        message: `Se desactivará "${category?.nombre ?? 'la categoría'}". Las transacciones que la usan se mantienen.`,
        confirmText: 'Eliminar',
        icon: 'delete',
        danger: true
      } satisfies ConfirmDialogData
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.categories = this.categories.filter(c => c.id !== id);
          this.cdr.detectChanges();
        },
        error: () => this.snackBar.open('No se pudo eliminar la categoría', 'Cerrar', { duration: 5000 })
      });
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

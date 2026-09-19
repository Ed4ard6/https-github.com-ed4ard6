import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SavingsGoal {
  id: string;
  nombre: string;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  remaining: number;
  progressPercentage: number;
  monthsLeft: number;
  /** Cuánto habría que apartar cada mes para llegar a tiempo */
  monthlyTarget: number;
  savedThisMonth: number;
  onTrack: boolean;
  completed: boolean;
  overdue: boolean;
}

export interface SaveSavingsGoalRequest {
  nombre: string;
  targetAmount: number;
  targetDate: string;
  initialAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SavingsGoalService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5211/api/savingsgoals';

  getGoals(): Observable<SavingsGoal[]> {
    return this.http.get<SavingsGoal[]>(this.apiUrl);
  }

  createGoal(data: SaveSavingsGoalRequest): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(this.apiUrl, data);
  }

  updateGoal(id: string, data: SaveSavingsGoalRequest): Observable<SavingsGoal> {
    return this.http.put<SavingsGoal>(`${this.apiUrl}/${id}`, data);
  }

  /** Registra un aporte y devuelve la meta con el progreso recalculado. */
  addContribution(id: string, amount: number, description?: string): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(`${this.apiUrl}/${id}/contributions`, { amount, description });
  }

  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

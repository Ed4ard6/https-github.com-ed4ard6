import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Ficha de cuenta del panel. No trae nada financiero a propósito: el
 * administrador gestiona accesos, no mira el dinero de los demás.
 */
export interface AdminUser {
  id: string;
  nombre: string;
  email: string;
  role: string;
  activo: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  transactionCount: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  activeLast30Days: number;
  totalTransactions: number;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  targetEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5211/api/admin';

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`);
  }

  setUserStatus(id: string, activo: boolean): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/users/${id}/status`, { activo });
  }

  /** Devuelve la contraseña provisional. Se muestra una sola vez. */
  resetPassword(id: string): Observable<{ temporaryPassword: string }> {
    return this.http.post<{ temporaryPassword: string }>(
      `${this.apiUrl}/users/${id}/reset-password`,
      {}
    );
  }

  getAuditLog(): Observable<AdminAuditLog[]> {
    return this.http.get<AdminAuditLog[]>(`${this.apiUrl}/audit`);
  }
}

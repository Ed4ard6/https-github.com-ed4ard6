import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, AuthResponse, JwtToken } from '../models/domain.models';
import { MockDataService } from './mock-data.service';

/**
 * AuthService
 * Maneja autenticación, token JWT y estado del usuario
 * En producción, esto se conectaría al backend API
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private mockDataService = inject(MockDataService);

  // Comportamientos observables
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  private userSubject = new BehaviorSubject<User | null>(this.getStoredUser());

  // Observables públicos
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  user$ = this.userSubject.asObservable();

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {}

  /**
   * Login - Autentica usuario con email y contraseña
   * MOCK: Acepta cualquier credencial
   */
  login(email: string, password: string): Observable<AuthResponse> {
    // Simulamos delay de red
    return of({
      token: this.generateMockToken(email),
      user: {
        id: '1',
        nombre: 'Eduardo',
        email,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }).pipe(
      delay(500), // Simular latencia de red
      tap(response => {
        this.storeToken(response.token);
        this.storeUser(response.user);
        this.isAuthenticatedSubject.next(true);
        this.userSubject.next(response.user);
      })
    );
  }

  /**
   * Register - Registra nuevo usuario
   * MOCK: Crea usuario con los datos proporcionados
   */
  register(nombre: string, email: string, password: string): Observable<AuthResponse> {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      nombre,
      email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of({
      token: this.generateMockToken(email),
      user: newUser
    }).pipe(
      delay(500),
      tap(response => {
        this.storeToken(response.token);
        this.storeUser(response.user);
        this.isAuthenticatedSubject.next(true);
        this.userSubject.next(response.user);
      })
    );
  }

  /**
   * Logout - Cierra sesión del usuario
   */
  logout(): Observable<void> {
    return of(void 0).pipe(
      delay(300),
      tap(() => {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.isAuthenticatedSubject.next(false);
        this.userSubject.next(null);
      })
    );
  }

  /**
   * Obtiene el token JWT actual
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  /**
   * Decodifica el token JWT (MOCK)
   */
  decodeToken(): JwtToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      const decoded = JSON.parse(atob(parts[1]));
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Verifica si el token ha expirado
   */
  isTokenExpired(): boolean {
    const decoded = this.decodeToken();
    if (!decoded) return true;

    const now = Date.now() / 1000;
    return decoded.exp < now;
  }

  /**
   * Genera un token JWT mock (Base64)
   * NOTA: En producción viene del servidor
   */
  private generateMockToken(email: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: '1',
        email,
        nombre: 'Eduardo',
        exp: Math.floor(Date.now() / 1000) + this.TOKEN_EXPIRY / 1000,
        iat: Math.floor(Date.now() / 1000)
      })
    );
    const signature = 'mock_signature';

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Almacena el token en localStorage
   */
  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Almacena el usuario en localStorage
   */
  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Recupera el usuario almacenado
   */
  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Verifica si hay un token válido
   */
  private hasToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token && !this.isTokenExpired();
  }
}

import { Injectable, computed, effect, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { UsuarioModel } from './models/UsuarioModel';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CarritoService } from './services/carrito.service';
import { CarritoProductoService } from './services/carrito-producto.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private apiUrl = environment.apiURL;
  private tokenKey = 'currentUser';
  private legacyTokenKey = 'token';

  // Signals
  tokenUser = signal<string | null>(localStorage.getItem(this.tokenKey));
  authenticated = computed(() => !!this.tokenUser());
  usuario = signal<UsuarioModel | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private cartService: CarritoService,

  ) {
    const legacyToken = localStorage.getItem(this.legacyTokenKey);
    if (!this.tokenUser() && legacyToken) {
      localStorage.setItem(this.tokenKey, legacyToken);
      localStorage.removeItem(this.legacyTokenKey);
      this.tokenUser.set(legacyToken);
    }

    if (this.tokenUser()) {
      this.getUserProfile().subscribe();
    }
  }

  get isAuthenticatedSignal() {
    return this.authenticated;
  }

  get currentUserSignal() {
    return this.usuario;
  }

  get getToken(): string | null {
    return this.tokenUser();
  }

  // Crear usuario
  createUser(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuario/register`, usuario);
  }

  // Listar roles
  listaRoles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rol`);
  }

  // Login
  //tap es para efectos secundarios (obtener el dato, pero que no lo cambian ni lo transforman para el siguiente paso)
  loginUser(credentials: any): Observable<any> {
  return this.http
    .post<any>(`${this.apiUrl}/usuario/login`, credentials) // Cambia a any para recibir toda la respuesta
    .pipe(
      tap((response) => {
        
        const token = String(response.token);
        localStorage.setItem(this.tokenKey, token);
        localStorage.removeItem(this.legacyTokenKey);
        this.tokenUser.set(token);

        // GUARDAR USUARIO EN LOCALSTORAGE SI REQUIERE CAMBIO DE CONTRASEÑA
        if (response.requirePasswordChange && response.usuario) {
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
        } else {
          // Limpiar por si acaso
          localStorage.removeItem('usuario');
        }

        // Registrar usuario en signal
        this.getUserProfile().subscribe();
      })
    );
}

  // Obtener perfil desde backend del usuario
 getUserProfile(): Observable<UsuarioModel | null> {
  return this.http.get<UsuarioModel>(`${this.apiUrl}/usuario/profile`).pipe(
    tap((user) => {
      this.usuario.set(user);
      
      // Si el usuario requiere cambio de contraseña pero no está en localStorage, guardarlo
      if (user.isTempPassword && !localStorage.getItem('usuario')) {
        localStorage.setItem('usuario', JSON.stringify(user));
      }
    }),
    catchError(() => {
      this.logout();
      return of(null);
    })
  );
}

  // Logout
logout(): void {
  const usuario = this.usuario();
  if (usuario) {
    // Marcar carrito como ABANDONADO antes de limpiar sesión
    this.cartService.abandonarCarrito(usuario.id).subscribe({
      next: () => console.log('Carrito marcado como abandonado al logout'),
      error: (err) => console.error('Error al abandonar carrito al logout', err)
    });
  }

  // Limpiar sesión
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem(this.legacyTokenKey);
   localStorage.removeItem('usuario');
  this.tokenUser.set(null);
  this.usuario.set(null);

  this.router.navigate(['/usuario/login']);
}


}


import { Component, computed, inject } from '@angular/core';
import { CarritoProductoService } from '../../share/services/carrito-producto.service';
import { AuthenticationService } from '../../share/authentication.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private carritoService = inject(CarritoProductoService);

  private authService = inject(AuthenticationService);
  isAuntenticated = this.authService.isAuthenticatedSignal;
  currentUser = this.authService.currentUserSignal;


 cartItemCount = computed(() => 
    this.carritoService.items().reduce((total, item) => total + item.cantidad, 0)
  );

  public isAdmin = computed(() => {
    const user = this.authService.currentUserSignal();
    console.log('User: ', user?.rol.toString());
    return user?.rol.toString() == 'ADMIN';
  });

  constructor(private router: Router) {}

  ngOnInit(): void {}
  login() {
    this.router.navigate(['usuario/login']);
  }
  logout() {
    //
    this.authService.logout();
  }
goToViewProfile() {
  // Redirige al componente de visualización de perfil
  const userId = this.currentUser()?.id;
  if (userId) {
    this.router.navigate(['/usuario/perfil', userId]);
  }
}
}

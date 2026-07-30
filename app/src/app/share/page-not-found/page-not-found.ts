import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  standalone: false,
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css'
})
export class PageNotFound {
constructor(private router: Router) { }

  ngOnInit(): void { }

  irInicio() {
    // Redireccionar a la ruta raíz 
    this.router.navigate(['/']);
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: false,
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {

  constructor(

    private router: Router
  ){

  }

  productos() {
    this.router.navigate(['/producto']);
  }

}

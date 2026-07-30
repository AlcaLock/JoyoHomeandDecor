import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-access-denied-index',
  standalone: false,
  templateUrl: './access-denied-index.html',
  styleUrl: './access-denied-index.css'
})
export class AccessDeniedIndex {

  constructor(private router: Router, private translate: TranslateService) {}

  goHome() {
    this.router.navigate(['/inicio']);
  }
}

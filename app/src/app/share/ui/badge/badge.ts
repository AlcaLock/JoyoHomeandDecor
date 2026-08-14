import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'discount' | 'new' | 'out-of-stock' | 'info' | 'success' | 'danger';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.html',
  styleUrl: './badge.css',
})
export class AppBadge {
  variant = input<BadgeVariant>('info');
  /** Marca el badge como región dinámica (ej. stock que cambia) para lectores de pantalla. */
  live = input(false);
}

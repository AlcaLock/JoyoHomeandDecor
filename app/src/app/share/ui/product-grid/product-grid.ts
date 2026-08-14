import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppProductCard } from '../product-card/product-card';
import { ProductCardData } from '../product-card/product-card.model';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, AppProductCard],
  templateUrl: './product-grid.html',
  styleUrl: './product-grid.css',
})
export class AppProductGrid {
  products = input<ProductCardData[]>([]);
  /** Tarjetas renderizadas de inmediato; el resto usa @defer (on viewport). */
  eagerCount = input(4);
  emptyMessage = input('No encontramos productos con estos filtros.');
  hideCta = input(false);

  addToCart = output<number>();
  viewDetail = output<number>();
}

import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButton } from '../button/button';
import { AppBadge } from '../badge/badge';
import { ProductCardData } from './product-card.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, AppButton, AppBadge],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class AppProductCard {
  product = input.required<ProductCardData>();
  currency = input('CRC');
  /** Oculta el CTA de compra (ej. vista de administrador). */
  hideCta = input(false);

  addToCart = output<number>();
  viewDetail = output<number>();

  protected readonly hasDiscount = computed(() => {
    const promo = this.product().promoPrice;
    return promo != null && promo < this.product().price;
  });

  protected readonly outOfStock = computed(() => this.product().inStock === false);

  protected readonly formattedPrice = computed(() => this.formatCurrency(this.product().price));

  protected readonly formattedPromoPrice = computed(() => {
    const promo = this.product().promoPrice;
    return promo != null ? this.formatCurrency(promo) : '';
  });

  protected readonly stars = computed(() => {
    const rating = Math.round(this.product().rating ?? 0);
    return Array.from({ length: 5 }, (_, i) => i < rating);
  });

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: this.currency(),
      currencyDisplay: 'narrowSymbol',
    }).format(value);
  }
}

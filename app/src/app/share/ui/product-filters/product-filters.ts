import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppInput } from '../input/input';
import { AppButton } from '../button/button';
import {
  PriceRange,
  ProductColorOption,
  ProductFilterOption,
  ProductFilterState,
} from './product-filters.model';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, AppInput, AppButton],
  templateUrl: './product-filters.html',
  styleUrl: './product-filters.css',
})
export class AppProductFilters {
  categoryLabel = input('Categoría');
  categoryOptions = input<ProductFilterOption[]>([]);
  materialLabel = input('Material');
  materialOptions = input<ProductFilterOption[]>([]);
  colorOptions = input<ProductColorOption[]>([]);
  priceBounds = input<PriceRange>({ min: 0, max: 0 });

  filtersChange = output<ProductFilterState>();

  protected readonly expanded = signal(true);
  protected readonly search = signal('');
  protected readonly selectedCategories = signal<(number | string)[]>([]);
  protected readonly selectedMaterials = signal<(number | string)[]>([]);
  protected readonly selectedColors = signal<(number | string)[]>([]);
  protected readonly priceMin = signal(0);
  protected readonly priceMax = signal(0);

  protected readonly fillPercent = computed(() => {
    const { min, max } = this.priceBounds();
    const span = max - min || 1;
    const left = ((this.priceMin() - min) / span) * 100;
    const right = ((this.priceMax() - min) / span) * 100;
    return { left, width: Math.max(0, right - left) };
  });

  private readonly filters = computed<ProductFilterState>(() => ({
    search: this.search(),
    categoryIds: this.selectedCategories(),
    materialIds: this.selectedMaterials(),
    colorIds: this.selectedColors(),
    price: { min: this.priceMin(), max: this.priceMax() },
  }));

  constructor() {
    // Realinea el rango de precio seleccionado cuando cambian los límites reales del catálogo.
    effect(() => {
      const bounds = this.priceBounds();
      untracked(() => {
        if (this.priceMin() < bounds.min || this.priceMin() > bounds.max) {
          this.priceMin.set(bounds.min);
        }
        if (this.priceMax() > bounds.max || this.priceMax() < bounds.min) {
          this.priceMax.set(bounds.max);
        }
      });
    });

    // Cada cambio de estado deriva (computed) el filtro combinado y lo emite (effect) hacia la grilla.
    effect(() => {
      this.filtersChange.emit(this.filters());
    });
  }

  protected toggle(): void {
    this.expanded.update((value) => !value);
  }

  protected isSelected(collection: (number | string)[], id: number | string): boolean {
    return collection.includes(id);
  }

  protected toggleCategory(id: number | string): void {
    this.toggleValue(this.selectedCategories, id);
  }

  protected toggleMaterial(id: number | string): void {
    this.toggleValue(this.selectedMaterials, id);
  }

  protected toggleColor(id: number | string): void {
    this.toggleValue(this.selectedColors, id);
  }

  private toggleValue(source: typeof this.selectedCategories, id: number | string): void {
    source.update((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  protected onMinPriceInput(value: string): void {
    const next = Number(value);
    this.priceMin.set(Math.min(next, this.priceMax()));
  }

  protected onMaxPriceInput(value: string): void {
    const next = Number(value);
    this.priceMax.set(Math.max(next, this.priceMin()));
  }

  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected clearAll(): void {
    this.search.set('');
    this.selectedCategories.set([]);
    this.selectedMaterials.set([]);
    this.selectedColors.set([]);
    const bounds = this.priceBounds();
    this.priceMin.set(bounds.min);
    this.priceMax.set(bounds.max);
  }
}

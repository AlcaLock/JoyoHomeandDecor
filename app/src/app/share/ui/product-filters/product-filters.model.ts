export interface ProductFilterOption {
  id: number | string;
  label: string;
}

export interface ProductColorOption extends ProductFilterOption {
  hex: string;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductFilterState {
  search: string;
  categoryIds: (number | string)[];
  materialIds: (number | string)[];
  colorIds: (number | string)[];
  price: PriceRange;
}

export type ProductBadgeVariant = 'discount' | 'new' | 'out-of-stock' | 'info' | 'success' | 'danger';

export interface ProductCardBadge {
  label: string;
  variant: ProductBadgeVariant;
}

export interface ProductCardData {
  id: number;
  name: string;
  imageUrl: string;
  hoverImageUrl?: string | null;
  price: number;
  promoPrice?: number | null;
  rating?: number;
  reviewCount?: number;
  badges?: ProductCardBadge[];
  inStock?: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  color?: string;
  textColor?: string;
  description?: string;
  restaurant_id: string;
  has_extras?: boolean;
  sort_order?: number;
  active?: boolean;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  restaurant_id: string;
  name: string;
  price: number;
  active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category_id: string;
  restaurant_id: string;
  active?: boolean;
  has_variations?: boolean;
  product_categories?: ProductCategory;
  category?: ProductCategory;
  extras?: ProductExtra[];
  variations?: ProductVariation[];
}

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  category_id?: string | null;
  restaurant_id: string;
  active: boolean;
}

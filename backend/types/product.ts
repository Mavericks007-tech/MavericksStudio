export type ProductCategory =
  | 'T-Shirts'
  | 'Hoodies'
  | 'Joggers'
  | 'Shorts'
  | 'Jackets'
  | 'Full Sleeve Jersey'
  | 'Accessories';

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'One Size';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;               // in pence (GBP)
  compare_at_price?: number;   // original price if on sale
  category: ProductCategory;
  team?: string;               // e.g. "Red Bull", "Ferrari", "Mercedes"
  driver?: string;             // e.g. "Max Verstappen"
  sizes: ProductSize[];
  images: string[];            // Cloudinary URLs
  stock: Record<ProductSize, number>; // stock per size
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;
  category: ProductCategory;
  team?: string;
  driver?: string;
  sizes: ProductSize[];
  images: string[];
  stock: Record<ProductSize, number>;
  is_featured?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  is_active?: boolean;
}

export interface ProductFilters {
  category?: ProductCategory;
  team?: string;
  driver?: string;
  min_price?: number;
  max_price?: number;
  is_featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

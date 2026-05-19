import { supabaseAdmin } from './supabase';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
} from '../types/product';

// ─── Generate a URL-friendly slug ─────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Fetch paginated / filtered product list ──────────────────────────────
export async function getProducts(filters: ProductFilters = {}): Promise<{
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { page = 1, limit = 20, category, team, driver, min_price, max_price, is_featured, search } = filters;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq('category', category);
  if (team) query = query.ilike('team', `%${team}%`);
  if (driver) query = query.ilike('driver', `%${driver}%`);
  if (min_price !== undefined) query = query.gte('price', min_price);
  if (max_price !== undefined) query = query.lte('price', max_price);
  if (is_featured !== undefined) query = query.eq('is_featured', is_featured);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    products: data as Product[],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// ─── Fetch a single product by slug ───────────────────────────────────────
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return data as Product;
}

// ─── Fetch a single product by id ─────────────────────────────────────────
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Product;
}

// ─── Create a product ─────────────────────────────────────────────────────
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const slug = slugify(input.name);
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ ...input, slug, is_active: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

// ─── Update a product ─────────────────────────────────────────────────────
export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const updates: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
  if (input.name) updates.slug = slugify(input.name);

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

// ─── Soft-delete (deactivate) a product ───────────────────────────────────
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Decrement stock for a given size ────────────────────────────────────
export async function decrementStock(
  productId: string,
  size: string,
  qty: number
): Promise<void> {
  const product = await getProductById(productId);
  if (!product) throw new Error('Product not found');

  const currentStock = product.stock[size as keyof typeof product.stock] ?? 0;
  if (currentStock < qty) throw new Error(`Insufficient stock for ${product.name} (${size})`);

  const updatedStock = { ...product.stock, [size]: currentStock - qty };
  const { error } = await supabaseAdmin
    .from('products')
    .update({ stock: updatedStock, updated_at: new Date().toISOString() })
    .eq('id', productId);
  if (error) throw new Error(error.message);
}

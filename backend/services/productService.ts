import {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../lib/products';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
} from '../types/product';

export class ProductService {
  // ── Public ───────────────────────────────────────────────────────────────

  async listProducts(filters: ProductFilters = {}) {
    return getProducts(filters);
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const product = await getProductBySlug(slug);
    if (!product) throw new Error('Product not found');
    return product;
  }

  async getProductById(id: string): Promise<Product> {
    const product = await getProductById(id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  // ── Admin ────────────────────────────────────────────────────────────────

  async createProduct(input: CreateProductInput): Promise<Product> {
    this.validateCreateInput(input);
    return createProduct(input);
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    await this.getProductById(id); // ensure it exists
    return updateProduct(id, input);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id); // ensure it exists
    return deleteProduct(id);
  }

  // ── Validation ───────────────────────────────────────────────────────────

  private validateCreateInput(input: CreateProductInput): void {
    if (!input.name?.trim()) throw new Error('Product name is required');
    if (!input.price || input.price <= 0) throw new Error('Price must be greater than 0');
    if (!input.category) throw new Error('Category is required');
    if (!input.images?.length) throw new Error('At least one image is required');
    if (!input.sizes?.length) throw new Error('At least one size is required');
  }
}

export const productService = new ProductService();

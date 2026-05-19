import { NextRequest, NextResponse } from 'next/server';
import { productService } from '../../../../../services/productService';
import { AuthError } from '../../../../../lib/auth';
import { UpdateProductInput } from '../../../../../types/product';

// PATCH /api/admin/products/:id — update a product
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateProductInput = await req.json();
    const product = await productService.updateProduct(params.id, body);
    return NextResponse.json(product);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/products/:id — deactivate a product
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await productService.deleteProduct(params.id);
    return NextResponse.json({ message: 'Product deactivated' });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

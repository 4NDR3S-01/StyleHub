import ProductsAdmin from '../../../components/admin/ProductsAdmin';

export default function AdminProductsPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg">Productos</h2>
      <ProductsAdmin />
    </div>
  );
}

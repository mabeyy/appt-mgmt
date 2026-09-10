<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Support\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manage retail products. Owner-only, and only for the service verticals
 * (salon, barbershop) — court/resource tenants have the products module
 * disabled, so every action 404s for them.
 */
class ProductController extends Controller
{
    public function __construct(protected TenantContext $tenant)
    {
        $this->ensureModuleEnabled();
    }

    /**
     * Products exist only for businesses whose type sells them.
     */
    protected function ensureModuleEnabled(): void
    {
        abort_unless((bool) $this->tenant->current()?->usesServices(), 404);
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $products = Product::query()
            ->with('category:id,name')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"))
            ->when($request->filled('status'), fn ($q) => $q->where('is_active', $request->string('status')->toString() === 'active'))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => ProductCategory::orderBy('name')->get(['id', 'name']),
            'filters' => ['search' => $search, 'status' => $request->string('status')->toString()],
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        Product::create($this->withCategory($request->validated()));

        return back()->with('success', 'Product created.');
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($this->withCategory($request->validated()));

        return back()->with('success', 'Product updated.');
    }

    public function toggle(Product $product): RedirectResponse
    {
        $product->update(['is_active' => ! $product->is_active]);

        return back()->with('success', 'Product status updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return back()->with('success', 'Product deleted.');
    }

    /**
     * Resolve the category from the submitted data, creating a new one when the
     * admin typed a name in, and drop the transient key.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function withCategory(array $data): array
    {
        $name = trim($data['new_category'] ?? '');
        unset($data['new_category']);

        if ($name !== '') {
            $data['product_category_id'] = ProductCategory::firstOrCreate(['name' => $name])->id;
        }

        return $data;
    }
}

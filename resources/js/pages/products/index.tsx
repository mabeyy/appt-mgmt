import { Head, router, useForm } from '@inertiajs/react';
import { Package, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import InputError from '@/components/input-error';
import { CheckboxField } from '@/components/shared/checkbox-field';
import { DataPagination } from '@/components/shared/data-pagination';
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { FormDialog, useFormDialog } from '@/components/shared/form-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { SegmentedToggle } from '@/components/shared/segmented-toggle';
import { StatusFilterSelect } from '@/components/shared/status-filter-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useTableFilters } from '@/hooks/use-table-filters';
import { destroy, index, store, update } from '@/routes/products';
import type { Paginated } from '@/types';

type ProductCategory = {
    id: number;
    name: string;
};

type Product = {
    id: number;
    name: string;
    description: string | null;
    sku: string | null;
    price: string | number;
    stock: number;
    low_stock_threshold: number;
    is_active: boolean;
    category: ProductCategory | null;
};

type Props = {
    products: Paginated<Product>;
    categories: ProductCategory[];
    filters: {
        search: string;
        status: string;
    };
};

/** Peso currency formatting for retail products. */
function formatPeso(value: string | number | null | undefined): string {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);

    return `₱${(Number.isFinite(num) ? Number(num) : 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function isLowStock(product: Product): boolean {
    return (
        product.low_stock_threshold > 0 &&
        product.stock <= product.low_stock_threshold
    );
}

type CategoryMode = 'existing' | 'new';

function ProductFormDialog({
    trigger,
    product,
    categories,
}: {
    trigger: ReactElement;
    product?: Product;
    categories: ProductCategory[];
}) {
    const form = useForm({
        name: product?.name ?? '',
        description: product?.description ?? '',
        sku: product?.sku ?? '',
        price: product?.price != null ? String(product.price) : '',
        stock: product?.stock ?? 0,
        low_stock_threshold: product?.low_stock_threshold ?? 0,
        is_active: product?.is_active ?? true,
        product_category_id: product?.category?.id
            ? String(product.category.id)
            : '',
        new_category: '',
    });

    const [categoryMode, setCategoryMode] = useState<CategoryMode>(
        categories.length === 0 ? 'new' : 'existing',
    );

    const switchCategoryMode = (mode: CategoryMode) => {
        setCategoryMode(mode);

        // Keep only the field for the active mode so the backend gets a clean choice.
        if (mode === 'existing') {
            form.setData('new_category', '');
        } else {
            form.setData('product_category_id', '');
        }
    };

    const { open, onOpenChange, submit, isEdit } = useFormDialog(
        form,
        { store, update },
        product?.id,
    );

    return (
        <FormDialog
            trigger={trigger}
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? 'Edit product' : 'New product'}
            description={
                isEdit
                    ? 'Update the details of this product.'
                    : 'Add a retail product to sell.'
            }
            submitLabel={isEdit ? 'Save changes' : 'Create product'}
            processing={form.processing}
            onSubmit={submit}
        >
            <div className="grid gap-2">
                <Label htmlFor="name">Product name</Label>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder="e.g. Shampoo"
                    autoFocus
                />
                <InputError message={form.errors.name} />
            </div>

            <div className="grid gap-2">
                <Label>Category</Label>
                <SegmentedToggle
                    value={categoryMode}
                    onChange={switchCategoryMode}
                    options={[
                        {
                            value: 'existing',
                            label: 'Existing category',
                            disabled: categories.length === 0,
                        },
                        { value: 'new', label: 'New category' },
                    ]}
                />
                {categoryMode === 'existing' ? (
                    <Select
                        value={form.data.product_category_id}
                        onValueChange={(v) =>
                            form.setData('product_category_id', String(v))
                        }
                        items={{
                            '': 'No category',
                            ...Object.fromEntries(
                                categories.map((c) => [String(c.id), c.name]),
                            ),
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="No category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">No category</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        value={form.data.new_category}
                        onChange={(e) =>
                            form.setData('new_category', e.target.value)
                        }
                        placeholder="e.g. Hair Care, Styling"
                    />
                )}
                <InputError
                    message={
                        form.errors.new_category ??
                        form.errors.product_category_id
                    }
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={form.data.description}
                    onChange={(e) =>
                        form.setData('description', e.target.value)
                    }
                    rows={3}
                    placeholder="Optional description"
                />
                <InputError message={form.errors.description} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                        id="sku"
                        value={form.data.sku}
                        onChange={(e) => form.setData('sku', e.target.value)}
                        placeholder="Optional"
                    />
                    <InputError message={form.errors.sku} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                        id="price"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.data.price}
                        onChange={(e) => form.setData('price', e.target.value)}
                        placeholder="0.00"
                    />
                    <InputError message={form.errors.price} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                        id="stock"
                        type="number"
                        min={0}
                        value={form.data.stock}
                        onChange={(e) =>
                            form.setData('stock', Number(e.target.value))
                        }
                    />
                    <InputError message={form.errors.stock} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="low_stock_threshold">
                        Low stock threshold
                    </Label>
                    <Input
                        id="low_stock_threshold"
                        type="number"
                        min={0}
                        value={form.data.low_stock_threshold}
                        onChange={(e) =>
                            form.setData(
                                'low_stock_threshold',
                                Number(e.target.value),
                            )
                        }
                    />
                    <InputError message={form.errors.low_stock_threshold} />
                </div>
            </div>

            <CheckboxField
                checked={form.data.is_active}
                onCheckedChange={(checked) =>
                    form.setData('is_active', checked)
                }
                label="Active (available for sale)"
            />
        </FormDialog>
    );
}

export default function ProductsIndex({ products, categories, filters }: Props) {
    const { values, setValue } = useTableFilters(index().url, {
        search: filters.search ?? '',
        status: filters.status || 'all',
    });

    return (
        <>
            <Head title="Products" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Products"
                    description="Manage the retail products you sell."
                >
                    <ProductFormDialog
                        categories={categories}
                        trigger={
                            <Button>
                                <Plus /> Add product
                            </Button>
                        }
                    />
                </PageHeader>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SearchInput
                        value={values.search}
                        onChange={(v) => setValue('search', v)}
                        placeholder="Search products..."
                        className="flex-1 sm:max-w-xs"
                    />
                    <StatusFilterSelect
                        value={values.status}
                        onValueChange={(v) => setValue('status', v)}
                    />
                </div>

                <Card className="py-0">
                    {products.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Package}
                                title="No products yet"
                                description="Add your first product to start selling."
                            >
                                <ProductFormDialog
                                    categories={categories}
                                    trigger={
                                        <Button>
                                            <Plus /> Add product
                                        </Button>
                                    }
                                />
                            </EmptyState>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {product.name}
                                            </div>
                                            {product.description && (
                                                <div className="max-w-xs truncate text-xs text-muted-foreground">
                                                    {product.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {product.sku || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {product.category ? (
                                                <Badge variant="outline">
                                                    {product.category.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatPeso(product.price)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{product.stock}</span>
                                                {isLowStock(product) && (
                                                    <Badge variant="destructive">
                                                        Low
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <label className="flex cursor-pointer items-center gap-2">
                                                <Switch
                                                    className="transition-colors duration-300 data-checked:bg-emerald-500 [&_[data-slot=switch-thumb]]:!bg-white"
                                                    checked={product.is_active}
                                                    onCheckedChange={() =>
                                                        router.patch(
                                                            `/products/${product.id}/toggle`,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                                only: [
                                                                    'products',
                                                                ],
                                                            },
                                                        )
                                                    }
                                                    aria-label={`Toggle ${product.name}`}
                                                />
                                                <span className="inline-block w-16 text-sm text-muted-foreground">
                                                    {product.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </label>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <ProductFormDialog
                                                    product={product}
                                                    categories={categories}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                        >
                                                            <Pencil />
                                                            <span className="sr-only">
                                                                Edit
                                                            </span>
                                                        </Button>
                                                    }
                                                />
                                                <DeleteConfirmButton
                                                    title="Delete product?"
                                                    description={`"${product.name}" will be permanently removed.`}
                                                    url={destroy(product.id).url}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                <DataPagination
                    links={products.links}
                    from={products.from}
                    to={products.to}
                    total={products.total}
                />
            </div>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [{ title: 'Products', href: index() }],
};

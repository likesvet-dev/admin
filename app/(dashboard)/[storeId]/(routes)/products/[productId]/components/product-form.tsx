'use client';

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Image, Product, Size, ProductSize, Color, ProductColor } from "@prisma/client";
import axios from "axios";
import { ChevronDown, Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

interface ProductFormProps {
    initialData: (Product & {
        images: Image[];
        productSizes: (ProductSize & { size: Size })[];
        productColors: (ProductColor & { color: Color })[];
    }) | null;
    categories: Category[];
    sizes: Size[];
    colors: Color[];
}

const priceSchema = z.number().min(0.01, "Minimum price is 0.01").transform((val) => Math.round(val * 100));

const formSchema = z.object({
    name: z.string().min(1),
    images: z.object({ url: z.string() }).array(),
    price: priceSchema,
    categoryId: z.string().min(1),
    sizeIds: z.string().array().min(1, "Необходимо выбирать минимум 1 размер"),
    colorIds: z.string().array().min(1, "Необходимо выбирать минимум 1 цвет"),
    isFeatured: z.boolean().default(false).optional(),
    isArchived: z.boolean().default(false).optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, categories, sizes, colors }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const router = useRouter();

    const title = initialData ? "Редактировать товар" : "Создать товар";
    const description = initialData ? "Управление товарами для вашего магазина" : "Создание нового товара";
    const toastMessage = initialData ? "Товар обновлен" : "Товар создан";
    const action = initialData ? "Сохранить" : "Создать";

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData
            ? {
                name: initialData.name,
                images: initialData.images || [],
                price: initialData.price / 100,
                categoryId: initialData.categoryId,
                sizeIds: initialData.productSizes.map((ps) => ps.sizeId),
                colorIds: initialData.productColors.map((pc) => pc.colorId),
                isFeatured: initialData.isFeatured,
                isArchived: initialData.isArchived,
            }
            : {
                name: "",
                images: [],
                price: 0,
                categoryId: "",
                sizeIds: [],
                colorIds: [],
                isFeatured: false,
                isArchived: false,
            },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "images",
    });

    const [displayPrice, setDisplayPrice] = useState(initialData ? String(initialData.price / 100) : "");

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/products/${params.productId}`, data);
            } else {
                await axios.post(`/api/${params.storeId}/products`, data);
            }
            router.refresh();
            router.push(`/${params.storeId}/products`);
            toast.success(toastMessage);
        } catch {
            toast.error("Не удалось обновить товар");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/products/${params.productId}`);
            router.refresh();
            router.push(`/${params.storeId}/products`);
            toast.success("Товар удален");
        } catch {
            toast.error("что-то пошло не так");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={loading} />
            <div className="flex item-center justify-between">
                <Heading title={title} description={description} />
                {initialData && (
                    <Button
                        disabled={loading}
                        variant="destructive"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => setOpen(true)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    {/* immagini */}
                    <FormField
                        control={form.control}
                        name="images"
                        render={() => (
                            <FormItem>
                                <FormLabel>Фото</FormLabel>
                                <FormControl>
                                    <ImageUpload
                                        value={fields.map((img) => img.url)}
                                        disabled={loading}
                                        onChange={(url) => append({ url })}
                                        onRemove={(url) => {
                                            const index = fields.findIndex((f) => f.url === url);
                                            if (index >= 0) remove(index);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-3 gap-8 max-[500px]:grid-cols-1">
                        {/* nome */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Название</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="Имя товара" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* prezzo */}
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Цена</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={displayPrice}
                                            onChange={(e) => {
                                                setDisplayPrice(e.target.value);
                                                const numValue = parseFloat(e.target.value);
                                                field.onChange(isNaN(numValue) ? 0 : numValue);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* categoria */}
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Категория</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue defaultValue={field.value} placeholder="Выберите категорию" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* multiple sizes */}
                        <FormField
                            control={form.control}
                            name="sizeIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Размеры</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                                {field.value?.length
                                                    ? sizes
                                                        .filter((s) => field.value.includes(s.id))
                                                        .map((s) => s.value)
                                                        .join(", ")
                                                    : "Выберите размеры"}
                                                <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="p-2 max-h-60 overflow-y-auto"
                                            align="start"
                                            side="bottom"
                                            style={{ width: "var(--radix-popover-trigger-width)" }}
                                        >
                                            <div className="flex flex-col space-y-1">
                                                {sizes.map((size) => {
                                                    const isSelected = field.value?.includes(size.id);
                                                    return (
                                                        <label
                                                            key={size.id}
                                                            className="flex items-center space-x-2 cursor-pointer py-1 px-2 hover:bg-gray-100 rounded-md"
                                                        >
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        field.onChange([...(field.value || []), size.id]);
                                                                    } else {
                                                                        field.onChange(field.value?.filter((id) => id !== size.id));
                                                                    }
                                                                }}
                                                            />
                                                            <span>{size.value}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* multiple colors */}
                        <FormField
                            control={form.control}
                            name="colorIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Цвета</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                                {field.value?.length
                                                    ? colors
                                                        .filter((c) => field.value.includes(c.id))
                                                        .map((c) => c.name)
                                                        .join(", ")
                                                    : "Выберите цвета"}
                                                <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="p-2 max-h-60 overflow-y-auto"
                                            align="start"
                                            side="bottom"
                                            style={{ width: "var(--radix-popover-trigger-width)" }}
                                        >
                                            <div className="flex flex-col space-y-1">
                                                {colors.map((color) => {
                                                    const isSelected = field.value?.includes(color.id);
                                                    return (
                                                        <label
                                                            key={color.id}
                                                            className="flex items-center space-x-2 cursor-pointer py-1 px-2 hover:bg-gray-100 rounded-md"
                                                        >
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        field.onChange([...(field.value || []), color.id]);
                                                                    } else {
                                                                        field.onChange(field.value?.filter((id) => id !== color.id));
                                                                    }
                                                                }}
                                                            />
                                                            <span className="flex items-center space-x-2">
                                                                <span
                                                                    className="w-4 h-4 rounded-full border"
                                                                    style={{ backgroundColor: color.value }}
                                                                />
                                                                <span>{color.name}</span>
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* featured */}
                        <FormField
                            control={form.control}
                            name="isFeatured"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Рекомендуемые товары</FormLabel>
                                        <FormDescription>Этот товар будет отображаться в разделе Смотрите также</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* archived */}
                        <FormField
                            control={form.control}
                            name="isArchived"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>В архиве</FormLabel>
                                        <FormDescription>Этот товар будет недоступен для покупки</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button disabled={loading} className="ml-auto cursor-pointer" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};

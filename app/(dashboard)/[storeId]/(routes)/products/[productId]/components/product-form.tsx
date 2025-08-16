'use client';

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Image, Product, Size } from "@prisma/client";
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

interface ProductFormProps {
    initialData: (Product & { images: Image[] }) | null;
    categories: Category[];
    sizes: Size[];
}

const priceSchema = z
    .number()
    .min(0.01, "Minimum price is 0.01")
    .transform((val) => Math.round(val * 100));

const formSchema = z.object({
    name: z.string().min(1),
    images: z.object({ url: z.string() }).array(),
    price: priceSchema,
    categoryId: z.string().min(1),
    sizeId: z.string().min(1),
    isFeatured: z.boolean().default(false).optional(),
    isArchived: z.boolean().default(false).optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, categories, sizes }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const params = useParams();
    const router = useRouter();

    const title = initialData ? 'Редактировать товар' : 'Создать товар';
    const description = initialData ? 'Управление товарами для вашего магазина' : 'Создание нового товара';
    const toastMessage = initialData ? 'Товар обновлен' : 'Товар создан';
    const action = initialData ? 'Сохранить' : 'Создать';

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData
            ? {
                name: initialData.name,
                images: initialData.images || [],
                // prezzo in UI in unità intere (es. 12.34), lo schema lo riconverte in centesimi
                price: initialData.price / 100,
                categoryId: initialData.categoryId,
                sizeId: initialData.sizeId,
                isFeatured: initialData.isFeatured,
                isArchived: initialData.isArchived,
            }
            : {
                name: '',
                images: [],
                price: 0,
                categoryId: '',
                sizeId: '',
                isFeatured: false,
                isArchived: false,
            },
    });

    // Gestione array immagini
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "images",
    });

    // Stato solo per l'input visuale del prezzo
    const [displayPrice, setDisplayPrice] = useState(
        initialData ? String(initialData.price / 100) : ''
    );

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
            toast.error('Не удалось обновить товар');
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
            toast.success('Товар удален');
        } catch {
            toast.error('что-то пошло не так');
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
                    <Button disabled={loading} variant="destructive" size="sm" className="cursor-pointer" onClick={() => setOpen(true)}>
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    {/* IMMAGINI con useFieldArray */}
                    <FormField
                        control={form.control}
                        name="images"
                        render={() => (
                            <FormItem>
                                <FormLabel>Фото</FormLabel>
                                <FormControl>
                                    <ImageUpload
                                        value={fields.map((img) => img.url)} // string[]
                                        disabled={loading}
                                        onChange={(url) => append({ url })} // aggiunge un nuovo item all'array
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
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Название</FormLabel>
                                <FormControl>
                                    <Input disabled={loading} placeholder="Имя товара" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="price" render={({ field }) => (
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
                        )} />

                        <FormField control={form.control} name="categoryId" render={({ field }) => (
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
                        )} />

                        <FormField control={form.control} name="sizeId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Размер</FormLabel>
                                <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue defaultValue={field.value} placeholder="Выберите размер" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {sizes.map((size) => (
                                            <SelectItem key={size.id} value={size.id}>
                                                {size.value}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="isFeatured" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Рекомендуемые товары</FormLabel>
                                    <FormDescription>Этот товар будет отображаться в странице продукта в раздел Смотрите текже</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="isArchived" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>В архиве</FormLabel>
                                    <FormDescription>Этот товар будет недоступен для покупки</FormDescription>
                                </div>
                            </FormItem>
                        )} />
                    </div>

                    <Button disabled={loading} className="ml-auto cursor-pointer" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};

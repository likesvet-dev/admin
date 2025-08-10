'use client';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Store } from "@/lib/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface SettingsFormProps {
    initialData: Store;
}

const formSchema = z.object({
    name: z.string().min(1)
})

type SettingsFormValues = z.infer<typeof formSchema>;

export const SettingsForm: React.FC<SettingsFormProps> = ({ initialData }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData
    });

    const onSubmit = async (data: SettingsFormValues) => {
        console.log(data)
    }

    return (
        <>
            <div className="flex item-cents justify-between">
                <Heading title='Настройки' description='Редактировать настройки магазины' />
                <Button disabled={loading} variant='destructive' size='sm' onClick={() => setOpen(true)}>
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    <div className="grid grid-cols-3 gap-8">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Название</FormLabel>
                                <FormControl>
                                    <Input disabled={loading} placeholder="Название магазина" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <Button disabled={loading} className="ml-auto" type="submit">Сохранить</Button>
                </form>
            </Form>
        </>
    )
}
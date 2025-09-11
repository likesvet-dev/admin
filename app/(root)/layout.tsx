import { authServer } from "@/lib/auth";
import prismadb from "@/lib/prismadb";
import { redirect } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function SetupLayout({ children, params }:  any) {
    let userId: string;

    try {
        ({ userId } = await authServer());
    } catch {
        redirect('/sign-in');
    }

    const store = await prismadb.store.findFirst({
        where: { userId },
    });

    const currentStoreId = params.storeId;

    if (store && store.id !== currentStoreId) {
        redirect(`/${store.id}`);
    }

    return <>{children}</>;
}
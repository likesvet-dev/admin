import { authServer } from "@/lib/auth";
import prismadb from "@/lib/prismadb";
import { redirect } from "next/navigation";

export default async function SetupLayout({ children, currentStoreId }: { children: React.ReactNode; currentStoreId?: string; }) {
    let userId: string;

    try {
        ({ userId } = await authServer());
    } catch {
        redirect('/sign-in');
    }

    const store = await prismadb.store.findFirst({
        where: { userId },
    });

    if (store && store.id !== currentStoreId) {
        redirect(`/${store.id}`);
    }

    return <>{children}</>;
}

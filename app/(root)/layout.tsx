import { auth } from "@/lib/auth";
import prismadb from "@/lib/prismadb";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
    const { userId } = await auth();
    console.log('[layout] auth returned userId=', userId);

    if (!userId) {
        console.log('[layout] no userId -> redirect /sign-in');
        redirect('/sign-in');
    }

    const store = await prismadb.store.findFirst({
        where: {
            userId
        }
    });

    if (store) {
        redirect(`/${store.id}`);
    }

    return (
        <>
            {children}
        </>
    );
}
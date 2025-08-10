import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: { storeId: string } }) {
    const { userId } = await auth();
    const resolvedParams = await params;

    if (!userId) {
        redirect('/sign-in');
    }

    const store = await prismadb.store.findFirst({
        where: {
            id: resolvedParams.storeId,
            userId
        }
    });

    if (!store) {
        redirect('/');
    }

    return (
        <>
            <div>Navbar</div>
            {children}
        </>
    )
}
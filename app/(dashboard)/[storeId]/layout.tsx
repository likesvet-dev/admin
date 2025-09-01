import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";

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
            <Navbar />
            <main className="
                pt-[calc(64px+env(safe-area-inset-top))]
                max-[1435px]:pt-[calc(88px+env(safe-area-inset-top))]
                max-[1080px]:pt-[calc(120px+env(safe-area-inset-top))]
                max-[960px]:pt-[calc(160px+env(safe-area-inset-top))]
                max-[620px]:pt-[calc(180px+env(safe-area-inset-top))]
                max-[500px]:pt-[calc(120px+env(safe-area-inset-top))]
                ">
                    {children}
            </main>
        </>
    )
}
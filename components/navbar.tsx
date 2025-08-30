import { UserButton } from "@clerk/nextjs";
import { MainNav } from "@/components/main-nav";
import StoreSwitcher from "@/components/store-switcher";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";
import { ThemeToggle } from "./theme-toggle";

const Navbar = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const stores = await prismadb.store.findMany({
        where: {
            userId
        }
    });

    return (
        <div className="border-b ">
            <div className="flex flex-row h-16 items-center px-4 max-[1435px]:flex-col max-[1435px]:items-start max-[1435px]:gap-4 max-[1435px]:h-22 max-[1435px]:relative max-[1435px]:pt-1 max-[1080px]:h-30 max-[960px]:h-40 max-[620px]:h-45 max-[500px]:h-30">
                <StoreSwitcher items={stores} />
                <MainNav className="mx-6 max-[1435px]:mx-0 max-[1080px]:w-full max-[500px]:w-full" />
                <div className="ml-auto flex items-center space-x-4 max-[1435px]:absolute max-[1435px]:top-1 max-[1435px]:right-4">
                    <ThemeToggle />
                    <UserButton />
                </div>
            </div>
        </div>
    );
}

export default Navbar;
import { UserButton } from "@clerk/nextjs";
import { MainNav } from "@/components/main-nav";
import StoreSwitcher from "@/components/store-switcher";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";

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
            <div className="flex flex-row h-16 items-center px-4 max-[500px]:flex-col max-[500px]:items-start max-[500px]:gap-4 max-[500px]:h-22 max-[500px]:relative">
                <StoreSwitcher items={stores} />
                <MainNav className="mx-6 " />
                <div className="ml-auto flex items-center space-x-4 max-[500px]:absolute max-[500px]:top-1 max-[500px]:right-4">
                    <UserButton />
                </div>
            </div>
        </div>
    );
}

export default Navbar;
"use client";

import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

export default function PageLayout({ children }) {
    const pathname = usePathname();

    if (pathname === "/login") {
        return <main>{children}</main>;
    }

    return (
        <div className="flex bg-pos-base min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-[280px] p-8 animate-fade-in text-white overflow-x-hidden">
                <div className="max-w-[1500px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

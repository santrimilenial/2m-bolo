"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
    LayoutDashboard,
    Wallet,
    History,
    Receipt,
    BarChart3,
    LineChart,
    TrendingUp,
    Package,
    ShoppingCart,
    Calculator,
    Archive,
    Users,
    Settings,
    LogOut,
    Shield,
    Landmark,
    Megaphone,
    PieChart
} from "lucide-react";

const SidebarItem = ({ href, icon: Icon, label, active }) => (
    <Link
        href={href}
        className={`flex items-center space-x-4 px-5 py-3.5 my-1 rounded-xl font-medium transition-all duration-300 ${active
                ? "bg-gradient-to-r from-pos-accent to-purple-600 text-white shadow-neon"
                : "text-pos-textMuted hover:text-white hover:bg-pos-panel border border-pos-border/5"
            }`}
    >
        <Icon size={18} className={active ? "opacity-100" : "opacity-70"} />
        <span className="text-[13px]">{label}</span>
    </Link>
);

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, setUser } = useAuth();
    
    const role = user?.role || "";
    const username = user?.username || "Guest";

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const allMenuGroups = [
        {
            title: "Menu",
            items: [
                { href: "/", icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
            ]
        },
        {
            title: "Finance & Accounting",
            items: [
                { href: "/cash", icon: Wallet, label: "Cash", key: "cash" },
                { href: "/cashflow", icon: History, label: "Cashflow", key: "cashflow" },
                { href: "/beban", icon: Receipt, label: "Beban Lain-Lain", key: "beban" },
                { href: "/utang-piutang", icon: BarChart3, label: "Utang Piutang", key: "utang-piutang" },
                { href: "/laporan", icon: Calculator, label: "Laporan Laba Rugi", key: "laporan" },
                { href: "/arus-modal", icon: Landmark, label: "Arus Modal", key: "arus-modal" },
            ]
        },
        {
            title: "Performance",
            items: [
                { href: "/monitoring/cashflow", icon: TrendingUp, label: "Real Cashflow", key: "monitoring-cashflow" },
                { href: "/monitoring", icon: LineChart, label: "All Monitoring", key: "monitoring-all" },
                { href: "/laporan-penjualan", icon: PieChart, label: "Laporan Penjualan", key: "laporan-penjualan" },
                { href: "/laporan-iklan", icon: Megaphone, label: "Laporan Iklan", key: "laporan-iklan" },
            ]
        },
        {
            title: "Operations",
            items: [
                { href: "/persediaan", icon: Package, label: "Inventory", key: "persediaan" },
                { href: "/penjualan", icon: ShoppingCart, label: "Sales Log", key: "penjualan" },
                { href: "/sales-log-cash", icon: ShoppingCart, label: "Sales Log Cash", key: "sales-log-cash" },
                { href: "/akun-iklan", icon: Megaphone, label: "Daftar Akun Iklan", key: "akun-iklan" },
                { href: "/budgeting", icon: Calculator, label: "Budgeting", key: "budgeting" },
                { href: "/inventaris", icon: Archive, label: "Assets", key: "inventaris" },
            ]
        }
    ];

    if (role === 'OWNER') {
        allMenuGroups.push({
            title: "System Admin",
            items: [
                { href: "/users", icon: Users, label: "Users", key: "users" },
            ]
        });
    }

    const menuGroups = allMenuGroups.map(group => {
        const filteredItems = group.items.filter(item => {
            // OWNER has access to everything
            if (role === 'OWNER') return true;
            // Otherwise check accessConfig
            if (user?.accessConfig?.menus?.[item.key]?.view) {
                return true;
            }
            return false;
        });
        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);

    if (loading) return null;

    return (
        <aside className="fixed left-0 top-0 h-screen w-[280px] bg-pos-base border-r border-pos-border flex flex-col z-50">
            <div className="p-8 pb-4 flex items-center space-x-3">
                <div className="text-pos-accent">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                </div>
                <span className="text-2xl font-black tracking-tight text-white uppercase">CLICCO</span>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
                {menuGroups.map((group, idx) => (
                    <div key={idx}>
                        <h3 className="px-5 mb-2 text-[11px] font-bold text-pos-textMuted tracking-wider">
                            {group.title}
                        </h3>
                        <div>
                            {group.items.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    {...item}
                                    active={pathname === item.href}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-pos-border">
                <div className="bg-pos-panel rounded-xl p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pos-accent to-purple-500 p-[2px]">
                         <div className="w-full h-full bg-pos-panel rounded-full flex items-center justify-center">
                             <span className="text-white font-bold text-sm">{username.charAt(0).toUpperCase()}</span>
                         </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{username}</p>
                        <p className="text-[10px] text-pos-textMuted uppercase tracking-widest">{role?.replace('_', ' ')}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 bg-pos-panel border border-pos-border/5 hover:bg-pos-panel border border-pos-border/10 text-white rounded-lg text-xs font-bold transition-all mt-2 flex items-center justify-center space-x-2"
                    >
                        <span>Sign Out</span>
                        <LogOut size={12} />
                    </button>
                    
                    {/* Decorative glow inside the status box */}
                    <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-pos-accent blur-3xl opacity-20"></div>
                </div>
            </div>
        </aside>
    );
}

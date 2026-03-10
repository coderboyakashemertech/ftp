import { Search, Settings, HelpCircle, User, LogOut, Menu } from "lucide-react"

import Link from "next/link";

interface HeaderProps {
    onLogout?: () => void;
    username?: string | null;
    onToggleSidebar?: () => void;
}

export function Header({ onLogout, username, onToggleSidebar }: HeaderProps) {
    return (
        <header className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-[50] transition-colors">
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer md:hidden"
                    title="Menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-2">
                    {/* A simple placeholder logo consisting of colored shapes */}
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 28L20 12L28 28H12Z" fill="#FFC107" />
                        <path d="M12 28L20 12V28H12Z" fill="#FF9800" />
                        <path d="M4 28L12 12L20 28H4Z" fill="#4CAF50" />
                        <path d="M4 28L12 12V28H4Z" fill="#388E3C" />
                        <path d="M20 28L28 12L36 28H20Z" fill="#2196F3" />
                        <path d="M20 28L28 12V28H20Z" fill="#1976D2" />
                    </svg>
                    <span className="text-xl font-medium text-gray-700 dark:text-gray-200 tracking-tight hidden sm:block">Drive</span>
                </div>
            </div>

            <div className="flex-1 max-w-2xl px-2 sm:px-6 min-w-0">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-500 group-focus-within:text-gray-900 dark:group-focus-within:text-gray-100 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border-transparent rounded-full leading-5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-gray-200 dark:focus:border-gray-700 sm:text-sm transition-all focus:shadow-md"
                        placeholder="Search in Drive"
                    />
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer hidden sm:block" title="Help">
                    <HelpCircle className="h-5 w-5" />
                </button>
                <Link
                    href="/settings"
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer block"
                    title="Settings"
                >
                    <Settings className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-3 pl-2 border-l border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider whitespace-nowrap">{username || "User"}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tighter">Verified</span>
                    </div>
                    <button onClick={onLogout} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 rounded-full transition-all cursor-pointer group" title="Logout">
                        <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </header>
    )
}


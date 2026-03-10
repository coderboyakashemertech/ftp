"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppProvider, useAppContext } from "../../context/AppContext";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { addPinnedFolder, removePinnedFolderByPath, removePinnedFolder } from "../../services/api";

function MainLayoutContent({ children }: { children: ReactNode }) {
    const { isAuth, username, loadingAuth, performLogout, pinnedFolders, drives, selectedDrive, setSelectedDrive, refreshPinnedFolders } = useAppContext();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loadingAuth && !isAuth) {
            router.push("/login");
        }
    }, [isAuth, loadingAuth, router]);

    if (loadingAuth || !isAuth) {
        return (
            <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const handleUnpinById = async (id: number) => {
        try {
            await removePinnedFolder(id);
            await refreshPinnedFolders();
        } catch (err) {
            console.error("Failed to unpin:", err);
        }
    };

    const handleDriveSelect = (driveName: string) => {
        setSelectedDrive(driveName);
        if (pathname !== "/") {
            router.push("/");
        }
    };

    return (
        <div className="font-sans h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
            <Header
                onLogout={performLogout}
                username={username}
                onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
            />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 z-[55] md:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <Sidebar
                    pinnedFolders={pinnedFolders}
                    onNavigate={(path) => { router.push(`/?path=${encodeURIComponent(path)}`); setIsSidebarOpen(false); }}
                    drives={drives}
                    selectedDrive={selectedDrive}
                    onDriveSelect={handleDriveSelect}
                    onUnpin={handleUnpinById}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 border-t border-l border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden z-10 -ml-[1px]">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <AppProvider>
            <MainLayoutContent>{children}</MainLayoutContent>
        </AppProvider>
    );
}

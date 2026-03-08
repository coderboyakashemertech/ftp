import { HardDrive, Monitor, Users, Clock, Star, Trash2, Plus, Folder } from "lucide-react"
import { cn } from "../lib/utils"
import type { PinnedFolder } from "../types"

interface SidebarItemProps {
    icon: React.ElementType
    label: string
    active?: boolean
    onClick?: () => void
}

function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 w-full px-4 py-2 text-sm font-medium rounded-r-full transition-colors cursor-pointer",
                active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
        >
            <Icon className="h-5 w-5" />
            {label}
        </button>
    )
}

interface SidebarProps {
    pinnedFolders?: PinnedFolder[]
    onNavigate?: (path: string) => void
}

export function Sidebar({ pinnedFolders = [], onNavigate }: SidebarProps) {
    return (
        <aside className="w-64 flex-shrink-0 flex flex-col py-4 pr-3 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-[calc(100vh-65px)]">
            <div className="px-4 mb-4">
                <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-gray-700 dark:text-gray-200 text-sm w-fit cursor-pointer">
                    <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    New
                </button>
            </div>

            <nav className="flex-1 space-y-1">
                <SidebarItem icon={HardDrive} label="My Drive" active />
                <SidebarItem icon={Trash2} label="Trash" />

                {pinnedFolders.length > 0 && (
                    <>
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800" />
                        <div className="px-4 py-2">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Pinned Folders
                            </h3>
                        </div>
                        <div className="space-y-1">
                            {pinnedFolders.map((folder) => (
                                <SidebarItem
                                    key={folder.path}
                                    icon={Folder}
                                    label={folder.name}
                                    onClick={() => onNavigate?.(folder.path)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </nav>

            <div className="px-5 mt-auto text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span>6.5 GB of 15 GB used</span>
                <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">Buy storage</a>
            </div>
        </aside>
    )
}

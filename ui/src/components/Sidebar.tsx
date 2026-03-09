import { Plus, Folder, Clock, Star, Trash2, Home, Share2, Settings, HardDrive, X, Image as ImageIcon } from "lucide-react";
import { cn } from "../lib/utils"
import type { PinnedFolder } from "../types"

interface Drive {
    name: string;
    path: string;
}

interface SidebarItemProps {
    icon: React.ElementType
    label: string
    active?: boolean
    onClick?: () => void
    onAction?: () => void
    actionIcon?: React.ElementType
}

function SidebarItem({ icon: Icon, label, active, onClick, onAction, actionIcon: ActionIcon }: SidebarItemProps) {
    return (
        <div className="group/item relative flex items-center pr-2">
            <button
                onClick={onClick}
                className={cn(
                    "flex items-center gap-3 flex-1 px-4 py-2 text-sm font-medium rounded-r-full transition-colors cursor-pointer text-left truncate",
                    active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
            >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{label}</span>
            </button>
            {onAction && ActionIcon && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction();
                    }}
                    className="absolute right-4 p-1 rounded-md opacity-0 group-hover/item:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all cursor-pointer z-20"
                    title="Unpin"
                >
                    <ActionIcon className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    )
}

interface SidebarProps {
    pinnedFolders?: PinnedFolder[];
    onNavigate: (path: string) => void;
    drives?: Drive[];
    selectedDrive?: string | null;
    onDriveSelect: (driveName: string) => void;
    onUnpin?: (id: number) => void;
    currentView?: "drive" | "gallery" | "settings";
    onNavigateView?: (view: "drive" | "gallery" | "settings") => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ pinnedFolders = [], onNavigate, drives = [], selectedDrive, onDriveSelect, onUnpin, currentView = "drive", onNavigateView, isOpen, onClose }: SidebarProps) {
    return (
        <aside className={cn(
            "flex-shrink-0 flex flex-col py-4 pr-3 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto",
            "fixed inset-y-0 left-0 z-[60] transform transition-transform duration-300 w-64 md:relative md:translate-x-0",
            isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}>
            <div className="px-4 mb-4 flex justify-between items-center">
                <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-gray-700 dark:text-gray-200 text-sm w-fit cursor-pointer">
                    <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    New
                </button>
                <button
                    onClick={onClose}
                    className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            <nav className="flex-1 space-y-1 px-2 overflow-y-auto custom-scrollbar">
                <div className="mb-6 space-y-1">
                    <SidebarItem
                        icon={HardDrive}
                        label="My Drive"
                        active={currentView === "drive" || !currentView}
                        onClick={() => onNavigateView?.("drive")}
                    />
                    <SidebarItem
                        icon={ImageIcon}
                        label="Gallery"
                        active={currentView === "gallery"}
                        onClick={() => onNavigateView?.("gallery")}
                    />
                </div>

                {/* Drives Section */}
                <div className="mb-4">
                    <h3 className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Available Drives</h3>
                    {drives.map((drive) => (
                        <button
                            key={drive.name}
                            onClick={() => onDriveSelect(drive.name)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${selectedDrive === drive.name
                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/10 hover:text-gray-900 dark:hover:text-gray-100"
                                }`}
                        >
                            <HardDrive className={`h-4 w-4 ${selectedDrive === drive.name ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} />
                            <span className="flex-1 text-left truncate">{drive.name}</span>
                        </button>
                    ))}
                </div>

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
                                    key={folder.id}
                                    icon={Folder}
                                    label={folder.name}
                                    onClick={() => {
                                        if (folder.drive) onDriveSelect(folder.drive)
                                        onNavigate?.(folder.path)
                                    }}
                                    onAction={folder.id ? () => onUnpin?.(folder.id!) : undefined}
                                    actionIcon={X}
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

import { useState } from "react"
import { Folder, File as FileIcon, MoreVertical, FileText, ImageIcon, Code, FileArchive, Film, Music } from "lucide-react"
import type { FileItem } from "../types"
import { format } from "date-fns"
import Image from "next/image"
import { ContextMenu } from "./ContextMenu"
import { getDownloadUrl, getStaticUrl } from "../services/api"

interface ItemCardProps {
    item: string | FileItem
    isFolder: boolean
    viewMode: "grid" | "list"
    currentPath: string
    onDoubleClick: () => void
    isPinned?: boolean
    onPin?: (name: string, path: string) => void
}

function getFileIcon(extension: string | null) {
    if (!extension) return <FileIcon className="h-5 w-5 md:h-8 md:w-8 text-indigo-400" />

    const ext = extension.toLowerCase()
    switch (ext) {
        case 'txt': case 'md': case 'csv':
            return <FileText className="h-5 w-5 md:h-8 md:w-8 text-blue-500" />
        case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg':
            return <ImageIcon className="h-5 w-5 md:h-8 md:w-8 text-green-500" />
        case 'js': case 'ts': case 'json': case 'html': case 'css': case 'jsx': case 'tsx':
            return <Code className="h-5 w-5 md:h-8 md:w-8 text-yellow-500" />
        case 'zip': case 'rar': case 'tar': case 'gz':
            return <FileArchive className="h-5 w-5 md:h-8 md:w-8 text-red-500" />
        case 'mp4': case 'mov': case 'avi':
            return <Film className="h-5 w-5 md:h-8 md:w-8 text-purple-500" />
        case 'mp3': case 'wav': case 'ogg':
            return <Music className="h-5 w-5 md:h-8 md:w-8 text-pink-500" />
        default:
            return <FileIcon className="h-5 w-5 md:h-8 md:w-8 text-indigo-400" />
    }
}

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function ItemCard({ item, isFolder, viewMode, currentPath, onDoubleClick, isPinned, onPin }: ItemCardProps) {
    const name = isFolder ? (item as string) : (item as FileItem).name
    const isImage = !isFolder && ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif', 'bmp', 'ico', 'tiff'].includes((item as FileItem).extension?.toLowerCase() || '')
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
    const staticUrl = API_URL.replace('/api', '/api/static')

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    // Construct the full path securely.
    const cleanPath = currentPath === "/" ? "" : currentPath.replace(/^\//, '')
    const fullPath = cleanPath ? `${cleanPath}/${name}` : name
    const imagePath = `${staticUrl}/${fullPath}`

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleMoreClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setContextMenu({ x: rect.right - 180, y: rect.bottom + 5 });
    };

    const handleCopyPath = () => {
        navigator.clipboard.writeText(fullPath);
        // Could add a toast here
    };

    const downloadUrl = !isFolder ? getDownloadUrl(fullPath) : undefined;
    const staticUrl_direct = !isFolder ? getStaticUrl(fullPath) : undefined;

    if (viewMode === "list") {
        return (
            <div
                onDoubleClick={onDoubleClick}
                onContextMenu={handleContextMenu}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 cursor-pointer align-middle group transition-colors"
            >
                <div className="col-span-6 flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 overflow-hidden rounded-md relative">
                        {isFolder ? (
                            <Folder className="h-5 w-5 text-gray-700 dark:text-gray-300 fill-gray-700 dark:fill-gray-300" />
                        ) : isImage ? (
                            <Image
                                src={imagePath}
                                alt={name}
                                fill
                                className="object-cover"
                                unoptimized={false}
                            />
                        ) : (
                            getFileIcon((item as FileItem).extension)
                        )}
                    </div>
                    <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{name}</span>
                </div>
                <div className="col-span-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    {!isFolder && (item as FileItem).modifiedAt
                        ? format(new Date((item as FileItem).modifiedAt), "MMM d, yyyy")
                        : "--"}
                </div>
                <div className="col-span-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    {!isFolder ? formatBytes((item as FileItem).size) : "--"}
                </div>
                <div className="col-span-1 flex items-center justify-end relative">
                    <button
                        onClick={handleMoreClick}
                        className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-gray-500 cursor-pointer"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>
                    {contextMenu && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            isFolder={isFolder}
                            onClose={() => setContextMenu(null)}
                            downloadUrl={downloadUrl}
                            fileName={name}
                            onCopyPath={handleCopyPath}
                            onPin={onPin ? () => onPin(name, fullPath) : undefined}
                            isPinned={isPinned}
                            onOpen={onDoubleClick}
                        />
                    )}
                </div>
            </div>
        )
    }

    // Grid view
    return (
        <div
            onDoubleClick={onDoubleClick}
            onContextMenu={handleContextMenu}
            className={`
        relative group rounded-xl border border-gray-200 dark:border-gray-800 
        bg-white dark:bg-gray-900 overflow-hidden cursor-pointer
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 
        transition-all duration-200 flex flex-col 
        ${isFolder ? 'p-4 gap-3' : 'aspect-square'}
      `}
        >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                    onClick={handleMoreClick}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm cursor-pointer"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    isFolder={isFolder}
                    onClose={() => setContextMenu(null)}
                    downloadUrl={downloadUrl}
                    fileName={name}
                    onCopyPath={handleCopyPath}
                    onPin={onPin ? () => onPin(name, fullPath) : undefined}
                    isPinned={isPinned}
                    onOpen={onDoubleClick}
                />
            )}

            {isFolder ? (
                <div className="flex items-center gap-3">
                    <Folder className="h-6 w-6 text-gray-700 dark:text-gray-300 fill-gray-700 dark:fill-gray-300 flex-shrink-0" />
                    <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{name}</span>
                </div>
            ) : (
                <>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 overflow-hidden relative">
                        {isImage ? (
                            <Image src={imagePath} alt={name || "File image"} fill className="object-cover" unoptimized={false} />
                        ) : (
                            getFileIcon((item as FileItem).extension)
                        )}
                    </div>
                    <div className="px-3 py-3 bg-white dark:bg-gray-900 flex items-center gap-2">
                        {getFileIcon((item as FileItem).extension)}
                        <span className="truncate text-xs font-medium text-gray-800 dark:text-gray-200 flex-1">{name}</span>
                    </div>
                </>
            )}
        </div>
    )
}


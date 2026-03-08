import { useState, useEffect, useMemo } from "react"
import { fetchGallery, getStaticUrl } from "../services/api"
import type { FileItem } from "../types"
import { Image as ImageIcon, Film, PlayCircle, Folder } from "lucide-react"
import { GalleryPreviewModal } from "./GalleryPreviewModal"

export function Gallery() {
    const [mediaFiles, setMediaFiles] = useState<FileItem[]>([])

    // Loading & Error States
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Navigation State
    const [viewLevel, setViewLevel] = useState<"folders" | "media">("folders")
    const [selectedFolder, setSelectedFolder] = useState<{ path: string, name: string } | null>(null)
    const [previewIndex, setPreviewIndex] = useState<number | null>(null)

    // 1. Fetch Everything on mount
    useEffect(() => {
        const loadGallery = async () => {
            setLoading(true)
            try {
                const result = await fetchGallery()
                setMediaFiles(result.files)
            } catch (err) {
                console.error("Failed to load gallery:", err)
                setError("Failed to load gallery content.")
            } finally {
                setLoading(false)
            }
        }
        loadGallery()
    }, [])

    // Folders View Data (from fetched mediaFiles)
    const foldersData = useMemo(() => {
        const folderMap = new Map<string, string>()
        mediaFiles.forEach(file => {
            const fPath = file.folderPath ? `/${file.folderPath}` : "/"
            const fName = file.folderName || fPath
            if (!folderMap.has(fPath)) {
                folderMap.set(fPath, fName)
            }
        })
        return Array.from(folderMap.entries())
            .map(([path, name]) => ({ path, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [mediaFiles])

    // Media View Data (filtered by selectedFolder)
    const mediaData = useMemo(() => {
        if (!selectedFolder) return []

        return mediaFiles.filter(file => {
            const folderPath = file.folderPath ? `/${file.folderPath}` : "/"
            return folderPath === selectedFolder.path
        })
    }, [mediaFiles, selectedFolder])

    const isVideo = (filename: string) => {
        const ext = filename.split(".").pop()?.toLowerCase() || ""
        return ["mp4", "webm", "ogg", "mov", "mkv", "avi"].includes(ext)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh] text-red-500">
                <p>{error}</p>
            </div>
        )
    }

    if (viewLevel === "folders" && mediaFiles.length === 0) {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-gray-500 dark:text-gray-400">
                    <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                    <h3 className="text-xl font-medium mb-1">No photos or videos</h3>
                    <p>No media files found in the gallery.</p>
                </div>
            </div>
        )
    }

    // --- RENDER HELPERS ---

    const renderFoldersView = () => (
        <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white px-1 mb-4">
                Folders
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                {foldersData.map(folderObj => {
                    // Find items in this folder
                    const folderItems = mediaFiles.filter(f =>
                        (f.folderPath ? `/${f.folderPath}` : "/") === folderObj.path
                    );

                    const itemsInFolder = folderItems.length;

                    // Get the first item as a preview image
                    const previewFile = folderItems.length > 0 ? folderItems[0] : null;
                    const previewUrl = previewFile ? getStaticUrl(previewFile.path || "", previewFile.drive) : "";
                    const isVid = previewFile ? isVideo(previewFile.name) : false;

                    return (
                        <div
                            key={folderObj.path}
                            onClick={() => {
                                setSelectedFolder(folderObj)
                                setViewLevel("media")
                            }}
                            className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500"
                        >
                            {previewFile ? (
                                isVid ? (
                                    <div className="w-full h-full relative">
                                        <video
                                            src={`${previewUrl}#t=0.1`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            preload="metadata"
                                            muted
                                            playsInline
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={previewUrl}
                                        alt={folderObj.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>';
                                            target.className = "w-full h-full object-contain p-8 text-gray-400";
                                        }}
                                    />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                                    <Folder className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                </div>
                            )}

                            {/* Overlay Gradient for Text */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-12 flex flex-col justify-end">
                                <div className="flex items-center gap-2">
                                    <Folder className="h-4 w-4 text-indigo-400 shrink-0" />
                                    <p className="font-semibold text-sm text-white truncate drop-shadow-md">
                                        {folderObj.name}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-300 drop-shadow-md ml-6">
                                    {itemsInFolder} items
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    )

    const renderMediaView = () => (
        <div className="space-y-4 animate-in fade-in duration-300 pb-20">
            <div className="flex items-center gap-2 mb-4 px-1 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-3 z-10 border-b border-gray-100 dark:border-gray-800">
                <button
                    onClick={() => {
                        setViewLevel("folders")
                        setSelectedFolder(null)
                    }}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                    &larr; Back to Folders
                </button>
                <div className="ml-2 pl-4 border-l border-gray-300 dark:border-gray-700 flex flex-col min-w-0">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                        {selectedFolder?.name}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                {mediaData.map((file) => {
                    const isVid = isVideo(file.name)
                    const srcUrl = getStaticUrl(file.path || "", file.drive)

                    return (
                        <div
                            key={file.path || file.name}
                            className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500"
                            onClick={() => {
                                const index = mediaData.findIndex(f => f.path === file.path && f.name === file.name);
                                if (index !== -1) setPreviewIndex(index);
                            }}
                        >
                            {isVid ? (
                                <div className="w-full h-full relative">
                                    <video
                                        src={`${srcUrl}#t=0.1`}
                                        className="w-full h-full object-cover"
                                        preload="metadata"
                                        muted
                                        playsInline
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <PlayCircle className="h-10 w-10 text-white opacity-80 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        <Film className="h-3 w-3" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full relative">
                                    <img
                                        src={srcUrl}
                                        alt={file.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>';
                                            target.className = "w-full h-full object-contain p-8 text-gray-400";
                                        }}
                                    />
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 pt-8 flex items-end">
                                <p className="text-white text-xs font-medium truncate w-full drop-shadow-md">
                                    {file.name}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )

    return (
        <div className="h-full relative">
            {viewLevel === "folders" && renderFoldersView()}
            {viewLevel === "media" && renderMediaView()}

            {previewIndex !== null && (
                <GalleryPreviewModal
                    files={mediaData}
                    initialIndex={previewIndex}
                    onClose={() => setPreviewIndex(null)}
                />
            )}
        </div>
    )
}

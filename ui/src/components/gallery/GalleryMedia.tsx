"use client";

import { useState, useEffect, useRef } from "react";
import { fetchGallery, getStaticUrl } from "../../services/api";
import type { FileItem } from "../../types";
import { Film, PlayCircle, LayoutGrid, List, ChevronLeft, Star, RefreshCw } from "lucide-react";
import { GalleryPreviewModal } from "../GalleryPreviewModal";
import Image from "next/image";
import Link from "next/link";

const isVideo = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return ["mp4", "webm", "ogg", "mov", "mkv", "avi"].includes(ext);
};

interface GalleryMediaProps {
    folderPath: string;
}

export function GalleryMedia({ folderPath }: GalleryMediaProps) {
    const [mediaFiles, setMediaFiles] = useState<FileItem[]>([]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const lastFetchRef = useRef<{ page: number; folderPath?: string } | null>(null);

    useEffect(() => {
        const savedMode = localStorage.getItem("galleryViewMode") as "grid" | "list";
        if (savedMode === "grid" || savedMode === "list") {
            setViewMode(savedMode);
        }
    }, []);

    const handleSetViewMode = (mode: "grid" | "list") => {
        setViewMode(mode);
        localStorage.setItem("galleryViewMode", mode);
    };

    const loadMedia = async (pageNum: number, append: boolean = false, forceRefresh: boolean = false) => {
        if (!append && !forceRefresh && lastFetchRef.current?.page === pageNum && lastFetchRef.current?.folderPath === folderPath) {
            return;
        }

        const cacheKey = `gallery_media_cache_${folderPath}`;

        if (!append && pageNum === 1 && !forceRefresh) {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && parsed.mediaFiles && parsed.mediaFiles.length > 0) {
                        setMediaFiles(parsed.mediaFiles);
                        setPage(parsed.page);
                        setTotalPages(parsed.totalPages);
                        setTotalItems(parsed.totalItems);
                        setLoading(false);
                        lastFetchRef.current = { page: parsed.page, folderPath };
                        return;
                    }
                }
            } catch (err) {
                console.error("Failed to parse cached media", err);
            }
        }

        lastFetchRef.current = { page: pageNum, folderPath };

        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const result = await fetchGallery(pageNum, 50, folderPath);

            let newMediaFiles = [];
            const freshFiles = result.files || [];
            if (append) {
                newMediaFiles = [...mediaFiles, ...freshFiles];
            } else {
                newMediaFiles = freshFiles;
            }

            setMediaFiles(newMediaFiles || []);
            setTotalPages(result.totalPages);
            setTotalItems(result.total);
            setPage(result.page);

            localStorage.setItem(cacheKey, JSON.stringify({
                mediaFiles: newMediaFiles,
                page: result.page,
                totalPages: result.totalPages,
                totalItems: result.total
            }));
        } catch (err) {
            console.error("Failed to load gallery media:", err);
            setError("Failed to load media files.");
            lastFetchRef.current = null;
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        loadMedia(1);
    }, [folderPath]);

    const handleLoadMore = () => {
        if (page < totalPages) {
            loadMedia(page + 1, true);
        }
    };

    if (loading && page === 1) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh] text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    const folderName = folderPath.split("/").filter(Boolean).pop() || "Gallery";

    const renderViewToggle = () => (
        <div className="flex items-center gap-3">
            <button
                onClick={() => {
                    localStorage.removeItem(`gallery_media_cache_${folderPath}`);
                    loadMedia(1, false, true);
                }}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                title="Refresh Media"
                disabled={loading}
            >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            </button>

            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <button
                    onClick={() => handleSetViewMode("list")}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    title="List view"
                >
                    <List className="h-4 w-4" />
                </button>
                <button
                    onClick={() => handleSetViewMode("grid")}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    title="Grid view"
                >
                    <LayoutGrid className="h-4 w-4" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-full relative px-4 sm:px-6">
            <div className="space-y-6 pb-32">
                <div className="flex items-center justify-between px-1 sticky top-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl py-4 z-20 border-b border-gray-100/50 dark:border-gray-800/50">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/gallery"
                            className="group flex items-center justify-center h-10 w-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </Link>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                                {folderName}
                            </h2>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider opacity-70">
                                {totalItems} items in collection
                            </p>
                        </div>
                    </div>
                    {renderViewToggle()}
                </div>

                {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                        {mediaFiles.map((file, idx) => {
                            const isVid = isVideo(file.name);
                            const srcUrl = getStaticUrl(file.path || "", file.drive);

                            return (
                                <div
                                    key={file.path || file.name}
                                    className="group relative aspect-square bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-xl"
                                    onClick={() => setPreviewIndex(idx)}
                                >
                                    <div className="w-full h-full relative overflow-hidden">
                                        {isVid ? (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50/50 dark:bg-indigo-900/10 group-hover:bg-indigo-100/50 dark:group-hover:bg-indigo-900/20">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 opacity-50 group-hover:opacity-100" />
                                                    <Film className="h-10 w-10 text-indigo-500 dark:text-indigo-400 relative" strokeWidth={1.5} />
                                                </div>

                                                <div className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/20">
                                                    <PlayCircle className="h-3.5 w-3.5 text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <Image
                                                src={srcUrl}
                                                alt={file.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                                loading="lazy"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y5ZmFmYSIvPjwvc3ZnPg==';
                                                }}
                                                height={400}
                                                width={400}
                                            />
                                        )}
                                    </div>

                                    <div className="absolute inset-x-2 bottom-2 p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-white/40 dark:border-gray-800/40 opacity-0 group-hover:opacity-100">
                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tighter mt-0.5">
                                            {isVid ? "Video" : "Image"} • {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {mediaFiles.map((file, idx) => {
                            const isVid = isVideo(file.name);
                            const srcUrl = getStaticUrl(file.path || "", file.drive);

                            return (
                                <div
                                    key={file.path || file.name}
                                    onClick={() => setPreviewIndex(idx)}
                                    className="group flex items-center gap-4 p-3 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 rounded-2xl cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                                >
                                    <div className="relative w-14 h-14 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                                        {isVid ? (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50/50 dark:bg-indigo-900/10">
                                                <Film className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                                            </div>
                                        ) : (
                                            <Image
                                                src={srcUrl}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                height={50}
                                                width={50}
                                            />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                            {file.name}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${isVid ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                }`}>
                                                {isVid ? "Video" : "Image"}
                                            </span>
                                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-bold tracking-tight">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.extension?.replace('.', '').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-gray-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100">
                                        <Star className="h-4 w-4" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {page < totalPages && (
                    <div className="flex justify-center pt-8">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm flex items-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                    Loading...
                                </>
                            ) : (
                                `Load More Content (${totalItems - mediaFiles.length} remaining)`
                            )}
                        </button>
                    </div>
                )}
            </div>

            {previewIndex !== null && (
                <GalleryPreviewModal
                    files={mediaFiles}
                    initialIndex={previewIndex}
                    onClose={() => setPreviewIndex(null)}
                />
            )}
        </div>
    );
}

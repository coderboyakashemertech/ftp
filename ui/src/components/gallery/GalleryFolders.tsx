"use client";

import { useState, useEffect, useRef } from "react";
import { fetchGallery } from "../../services/api";
import type { GalleryResponse } from "../../types";
import { Image as ImageIcon, Folder, LayoutGrid, List, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function GalleryFolders() {
    const router = useRouter();
    const [folders, setFolders] = useState<GalleryResponse["folders"]>([]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const lastFetchRef = useRef<boolean>(false);

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

    const loadFolders = async (forceRefetch = false) => {
        if (!forceRefetch && lastFetchRef.current) return;

        if (!forceRefetch) {
            try {
                const cached = localStorage.getItem("gallery_folders_cache");
                if (cached) {
                    const parsed = JSON.parse(cached);
                    // Only return early if we ACTUALLY have valid cached folders
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setFolders(parsed);
                        setLoading(false);
                        lastFetchRef.current = true;
                        return; // Successfully loaded from cache, exit function
                    }
                }
            } catch (err) {
                console.error("Failed to parse cached folders", err);
            }
        }

        setLoading(true);
        try {
            const result = await fetchGallery(1, 1); // Pass 1 limit so it mostly just gets folders
            setFolders(result.folders);
            localStorage.setItem("gallery_folders_cache", JSON.stringify(result.folders));
            lastFetchRef.current = true;
        } catch (err) {
            console.error("Failed to load gallery folders:", err);
            setError("Failed to load gallery content.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFolders();
    }, []);

    const handleRefresh = () => {
        loadFolders(true);
    };

    if (loading && folders.length === 0) {
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

    if (folders.length === 0) {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-gray-500 dark:text-gray-400">
                    <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                    <h3 className="text-xl font-medium mb-1">No collections found</h3>
                    <p>No media folders were found in the gallery.</p>
                </div>
            </div>
        );
    }

    const renderViewToggle = () => (
        <div className="flex items-center gap-3">
            <button
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="Refresh Gallery"
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out h-full px-4 sm:px-6">
            <div className="flex items-center justify-between px-1 sticky top-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl py-4 z-20 border-b border-gray-100/50 dark:border-gray-800/50">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Gallery
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wider opacity-70">
                        {folders.length} Collections
                    </p>
                </div>
                {renderViewToggle()}
            </div>

            {viewMode === "grid" ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
                    {folders.map((folderObj) => (
                        <Link
                            key={folderObj.path}
                            href={`/gallery/${encodeURIComponent(folderObj.path)}`}
                            className="flex flex-col items-center justify-center p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <Folder className="h-10 w-10 text-indigo-500 dark:text-indigo-400 mb-2" strokeWidth={1.5} />
                            <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate w-full text-center">
                                {folderObj.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {folderObj.count} items
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="space-y-2 pb-10">
                    {folders.map((folderObj) => (
                        <Link
                            key={folderObj.path}
                            href={`/gallery/${encodeURIComponent(folderObj.path)}`}
                            className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700 transition-colors"
                        >
                            <Folder className="h-6 w-6 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {folderObj.name}
                                </h3>
                            </div>
                            <span className="text-xs text-gray-500">
                                {folderObj.count} items
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

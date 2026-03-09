import { useState, useEffect, useMemo, useRef } from "react";
import { fetchGallery, getStaticUrl } from "../services/api";
import type { FileItem, GalleryResponse } from "../types";
import { Image as ImageIcon, Film, PlayCircle, Folder, LayoutGrid, List, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { GalleryPreviewModal } from "./GalleryPreviewModal";
import Image from "next/image";

const isVideo = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ["mp4", "webm", "ogg", "mov", "mkv", "avi"].includes(ext);
};

export function Gallery() {
  const [mediaFiles, setMediaFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<GalleryResponse["folders"]>([]);

  // View Mode state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Navigation State
  const [viewLevel, setViewLevel] = useState<"folders" | "media">("folders");
  const [selectedFolder, setSelectedFolder] = useState<{
    path: string;
    name: string;
  } | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const lastFetchRef = useRef<{ page: number; folderPath?: string } | null>(null);

  // Sync viewMode with localStorage
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

  const loadGallery = async (pageNum: number, folderPath?: string, append: boolean = false) => {
    // If we are already fetching this exact page and folder, skip.
    if (!append && lastFetchRef.current?.page === pageNum && lastFetchRef.current?.folderPath === folderPath) {
      return;
    }
    lastFetchRef.current = { page: pageNum, folderPath };

    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await fetchGallery(pageNum, 50, folderPath);
      console.log("🚀 ~ loadGallery ~ result:", result);

      if (append) {
        setMediaFiles((prev) => [...prev, ...result.files]);
      } else {
        setMediaFiles(result.files);
      }

      setFolders(result.folders);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
      setPage(result.page);
    } catch (err) {
      console.error("Failed to load gallery:", err);
      setError("Failed to load gallery content.");
      lastFetchRef.current = null; // Reset to allow retry
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 1. Initial Load
  useEffect(() => {
    loadGallery(1);
  }, []);

  // 2. Handle Folder Selection
  const handleSelectFolder = (folder: { path: string; name: string }) => {
    setSelectedFolder(folder);
    setViewLevel("media");
    setPage(1);
    loadGallery(1, folder.path);
  };

  const handleBackToFolders = () => {
    setViewLevel("folders");
    setSelectedFolder(null);
    setPage(1);
    // Optionally reload all? Or just keep current. 
    // Usually folders are consistent, but let's refresh just in case.
    loadGallery(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      loadGallery(page + 1, selectedFolder?.path, true);
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

  if (viewLevel === "folders" && folders.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-gray-500 dark:text-gray-400">
          <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-1">No photos or videos</h3>
          <p>No media files found in the gallery.</p>
        </div>
      </div>
    );
  }

  // --- RENDER HELPERS ---

  const renderViewToggle = () => (
    <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
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
  );

  const renderFoldersView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {folders.map((folderObj) => (
            <div
              key={folderObj.path}
              onClick={() => handleSelectFolder(folderObj)}
              className="group relative flex flex-col gap-3 cursor-pointer"
            >
              {/* Modern Folder Card */}
              <div className="relative aspect-[4/5] bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-[2rem] overflow-hidden shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-gray-100 dark:border-gray-800 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30">
                {/* Glassmorphism Accents */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Folder Content Preview / Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative transform group-hover:scale-110 transition-transform duration-700 ease-out">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Folder className="h-20 w-20 text-indigo-500/80 dark:text-indigo-400/80 drop-shadow-2xl" strokeWidth={1} />
                  </div>
                </div>

                {/* Counter Badge */}
                <div className="absolute top-4 right-4 px-2.5 py-1 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md rounded-full shadow-sm border border-gray-100 dark:border-gray-800 transform group-hover:scale-110 transition-transform duration-500">
                  <span className="text-[10px] font-bold text-gray-900 dark:text-white">
                    {folderObj.count}
                  </span>
                </div>
              </div>

              {/* Folder Info */}
              <div className="px-2">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                  {folderObj.name}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-tight opacity-60">
                  Collection
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 pb-10">
          {folders.map((folderObj) => (
            <div
              key={folderObj.path}
              onClick={() => handleSelectFolder(folderObj)}
              className="group flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 group-hover:scale-110 transition-transform duration-500">
                  <Folder className="h-6 w-6 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {folderObj.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                      Folder
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      {folderObj.count} items
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-gray-300 group-hover:text-indigo-500 border border-gray-100 dark:border-gray-800 group-hover:border-indigo-100 dark:group-hover:border-indigo-900 opacity-0 group-hover:opacity-100 transition-all duration-500">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMediaView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-32">
      <div className="flex items-center justify-between px-1 sticky top-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl py-4 z-20 border-b border-gray-100/50 dark:border-gray-800/50">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToFolders}
            className="group flex items-center justify-center h-10 w-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-750 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
              {selectedFolder?.name}
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
                className="group relative aspect-square bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10"
                onClick={() => setPreviewIndex(idx)}
              >
                {/* Media Content - NO VIDEO PREVIEW */}
                <div className="w-full h-full relative overflow-hidden">
                  {isVid ? (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50/50 dark:bg-indigo-900/10 transition-colors group-hover:bg-indigo-100/50 dark:group-hover:bg-indigo-900/20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <Film className="h-10 w-10 text-indigo-500 dark:text-indigo-400 relative" strokeWidth={1.5} />
                      </div>

                      {/* Video Indicator */}
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

                {/* Glassmorphism Info Overlay */}
                <div className="absolute inset-x-2 bottom-2 p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-white/40 dark:border-gray-800/40 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
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
                className="group flex items-center gap-4 p-3 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
              >
                {/* Small Preview Icon */}
                <div className="relative w-14 h-14 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform duration-500">
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
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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

                <div className="h-8 w-8 rounded-full flex items-center justify-center text-gray-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all">
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
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
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
  );

  return (
    <div className="h-full relative px-4 sm:px-6">
      {viewLevel === "folders" && renderFoldersView()}
      {viewLevel === "media" && renderMediaView()}

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

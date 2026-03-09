import { useState, useEffect, useMemo, useRef } from "react";
import { fetchGallery, getStaticUrl } from "../services/api";
import type { FileItem, GalleryResponse } from "../types";
import { Image as ImageIcon, Film, PlayCircle, Folder, LayoutGrid, List } from "lucide-react";
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
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4 px-1 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-3 z-10 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Folders
        </h2>
        {renderViewToggle()}
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
          {folders.map((folderObj) => (
            <div
              key={folderObj.path}
              onClick={() => handleSelectFolder(folderObj)}
              className="group relative aspect-square bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500"
            >
              {/* Folder Icon Container */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-gray-900/50 group-hover:from-indigo-100/50 dark:group-hover:from-indigo-900/20 transition-colors duration-500">
                <div className="relative transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 ease-out">
                  <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-400/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Folder className="h-16 w-16 text-indigo-500 dark:text-indigo-400 drop-shadow-sm" strokeWidth={1.5} />
                </div>
              </div>

              {/* Overlay Gradient for Text */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16 flex flex-col justify-end">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/20 backdrop-blur-md rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                    <Folder className="h-3.5 w-3.5 text-indigo-300 shrink-0" strokeWidth={2.5} />
                  </div>
                  <p className="font-bold text-sm text-white truncate drop-shadow-md">
                    {folderObj.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-9">
                  <span className="text-[11px] font-medium text-white/80 drop-shadow-md">
                    {folderObj.count} items
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {folders.map((folderObj) => (
            <div
              key={folderObj.path}
              onClick={() => handleSelectFolder(folderObj)}
              className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <Folder className="h-5 w-5 text-indigo-500 dark:text-indigo-400" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {folderObj.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {folderObj.count} items
                  </p>
                </div>
              </div>
              <div className="text-gray-400 group-hover:text-indigo-500 transition-colors mr-2">
                &rarr;
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMediaView = () => (
    <div className="space-y-4 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center justify-between mb-4 px-1 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-3 z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={handleBackToFolders}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            &larr; <span className="hidden sm:inline">Back</span>
          </button>
          <div className="ml-1 pl-3 border-l border-gray-300 dark:border-gray-700 flex flex-col min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {selectedFolder?.name}
            </h2>
          </div>
        </div>
        {renderViewToggle()}
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
          {mediaFiles.map((file, idx) => {
            const isVid = isVideo(file.name);
            const srcUrl = getStaticUrl(file.path || "", file.drive);

            return (
              <div
                key={file.path || file.name}
                className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500"
                onClick={() => setPreviewIndex(idx)}
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
                    <Image
                      src={srcUrl}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>';
                        target.className =
                          "w-full h-full object-contain p-8 text-gray-400";
                      }}
                      height={100}
                      width={100}
                    />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 pt-8 flex items-end">
                  <p className="text-white text-xs font-medium truncate w-full drop-shadow-md">
                    {file.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {mediaFiles.map((file, idx) => {
            const isVid = isVideo(file.name);
            const srcUrl = getStaticUrl(file.path || "", file.drive);

            return (
              <div
                key={file.path || file.name}
                onClick={() => setPreviewIndex(idx)}
                className="group flex items-center gap-4 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
              >
                <div className="relative w-16 h-12 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {isVid ? (
                    <div className="w-full h-full relative">
                      <video src={`${srcUrl}#t=0.1`} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <PlayCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={srcUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      height={50}
                      width={70}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {file.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="uppercase">{file.extension?.replace('.', '') || 'FILE'}</span>
                    <span>•</span>
                    <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-indigo-500 transition-colors mr-2">
                  <ImageIcon className="h-4 w-4 opacity-40 group-hover:opacity-100" />
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

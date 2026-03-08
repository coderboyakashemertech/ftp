"use client";

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { LayoutGrid, List } from "lucide-react"
import { Header } from "./../components/Header"
import { Sidebar } from "./../components/Sidebar"
import { Breadcrumbs } from "./../components/Breadcrumbs"
import { FileGrid } from "./../components/FileGrid"
import { PreviewModal } from "./../components/PreviewModal"
import { fetchDirectory } from "./../services/api"
import type { BrowseResponse, ViewMode, PinnedFolder, FileItem } from "./../types"

function AppContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Use URL as the single source of truth for the directory path
  const currentPath = searchParams.get("path") || "/"

  const [data, setData] = useState<BrowseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [pinnedFolders, setPinnedFolders] = useState<PinnedFolder[]>([])
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  // Sync viewMode with localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem("viewMode") as ViewMode
    if (savedViewMode && (savedViewMode === "grid" || savedViewMode === "list")) {
      setViewMode(savedViewMode)
    }

    const savedPins = localStorage.getItem("pinnedFolders")
    if (savedPins) {
      try {
        setPinnedFolders(JSON.parse(savedPins))
      } catch (e) {
        console.error("Failed to parse pinned folders", e)
      }
    }
  }, [])

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem("viewMode", mode)
  }

  // Optimized navigation using URL parameters
  const updateUrl = useCallback((path: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (path === "/") {
      params.delete("path")
    } else {
      params.set("path", path)
    }

    const query = params.toString()
    const url = `${pathname}${query ? `?${query}` : ""}`
    router.push(url, { scroll: false })
  }, [pathname, router, searchParams])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        // Remove leading slash if any because API expects relative paths
        const apiPath = currentPath === "/" ? "" : currentPath.replace(/^\//, "")
        const res = await fetchDirectory(apiPath)
        setData(res)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Failed to load directory contents")
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentPath])

  const handleNavigate = (folderName: string) => {
    const newPath = currentPath === "/" ? `/${folderName}` : `${currentPath}/${folderName}`
    updateUrl(newPath)
  }

  const handleFileClick = (file: FileItem) => {
    setPreviewFile(file)
  }

  const handleBreadcrumbNavigate = (path: string) => {
    updateUrl(path)
  }

  const handleTogglePin = (name: string, path: string) => {
    setPinnedFolders(prev => {
      const isPinned = prev.some(p => p.path === path)
      let next: PinnedFolder[]
      if (isPinned) {
        next = prev.filter(p => p.path !== path)
      } else {
        next = [...prev, { name, path }]
      }
      localStorage.setItem("pinnedFolders", JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="font-sans min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar pinnedFolders={pinnedFolders} onNavigate={handleBreadcrumbNavigate} />

        <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-[calc(100vh-65px)] rounded-tl-xl border-t border-l border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden z-10 -ml-[1px]">
          {/* Main Content Toolbar */}
          <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-900 z-10 sticky top-0 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-normal text-gray-800 dark:text-gray-100 tracking-tight">
                {currentPath === "/" ? "My Drive" : currentPath.split("/").pop()}
              </h1>
              <Breadcrumbs path={currentPath} onNavigate={handleBreadcrumbNavigate} />
            </div>
            <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => handleSetViewMode("list")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleSetViewMode("grid")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800">
                <h3 className="font-semibold mb-2">Error connecting to server</h3>
                <p>{error}</p>
                <button
                  onClick={() => handleBreadcrumbNavigate("/")}
                  className="mt-4 px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 font-medium rounded-lg border border-red-200 dark:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : data ? (
              <FileGrid
                data={data}
                viewMode={viewMode}
                currentPath={currentPath}
                onNavigate={handleNavigate}
                onFileClick={handleFileClick}
                pinnedFolders={pinnedFolders}
                onPin={handleTogglePin}
              />
            ) : null}
          </div>
        </main>
      </div >

      <PreviewModal
        item={previewFile}
        currentPath={currentPath}
        onClose={() => setPreviewFile(null)}
      />
    </div >
  )
}

export default function App() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <AppContent />
    </Suspense>
  )
}

export interface FileItem {
    name: string
    path?: string
    folderPath?: string
    folderName?: string
    drive?: string
    thumbnail?: string | null
    extension: string | null
    size: number
    modifiedAt: string
}

export interface BrowseResponse {
    path: string
    folders: string[]
    files: FileItem[]
}

export interface GalleryResponse {
    files: FileItem[]
    folders: { name: string; path: string; count: number; preview: FileItem | null }[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export type ViewMode = "grid" | "list"

export interface PinnedFolder {
    id?: number
    name: string
    path: string
    drive?: string
}

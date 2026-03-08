export interface FileItem {
    name: string
    path?: string
    folderPath?: string
    folderName?: string
    drive?: string
    extension: string | null
    size: number
    modifiedAt: string
}

export interface BrowseResponse {
    path: string
    folders: string[]
    files: FileItem[]
}

export type ViewMode = "grid" | "list"

export interface PinnedFolder {
    id?: number
    name: string
    path: string
    drive?: string
}

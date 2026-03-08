
import { ItemCard } from "./ItemCard"
import type { BrowseResponse, ViewMode, PinnedFolder, FileItem } from "../types"

interface FileGridProps {
    data: BrowseResponse
    viewMode: ViewMode
    currentPath: string
    onNavigate: (folderName: string) => void
    onFileClick: (file: FileItem) => void
    pinnedFolders: PinnedFolder[]
    onPin: (name: string, path: string) => void
}

export function FileGrid({ data, viewMode, currentPath, onNavigate, onFileClick, pinnedFolders, onPin }: FileGridProps) {
    const hasContent = data.folders.length > 0 || data.files.length > 0

    if (!hasContent) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="mb-4">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V11H22V19Z" fill="currentColor" fillOpacity="0.1" />
                        <path d="M12 2C10.3431 2 9 3.34315 9 5V6H5C3.34315 6 2 7.34315 2 9V11H22V9C22 7.34315 20.6569 6 19 6H15V5C15 3.34315 13.6569 2 12 2Z" fill="currentColor" fillOpacity="0.2" />
                    </svg>
                </div>
                <p className="text-lg font-medium">This folder is empty</p>
                <p className="text-sm">Drag files here to upload</p>
            </div>
        )
    }

    if (viewMode === "list") {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-3">Last modified</div>
                    <div className="col-span-2">File size</div>
                    <div className="col-span-1"></div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.folders.map(folder => (
                        <ItemCard
                            key={folder}
                            item={folder}
                            isFolder={true}
                            viewMode="list"
                            currentPath={currentPath}
                            onDoubleClick={() => onNavigate(folder)}
                            onPin={onPin}
                            isPinned={pinnedFolders.some(pf => pf.path === (currentPath === "/" ? "" : currentPath.replace(/^\//, "")) + (currentPath === "/" ? "" : "/") + folder)}
                        />
                    ))}
                    {data.files.map(file => (
                        <ItemCard
                            key={file.name}
                            item={file}
                            isFolder={false}
                            viewMode="list"
                            currentPath={currentPath}
                            onDoubleClick={() => onFileClick(file)}
                        />
                    ))}
                </div>
            </div>
        )
    }

    // Grid view
    return (
        <div className="space-y-8">
            {data.folders.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 px-1">Folders</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {data.folders.map(folder => (
                            <ItemCard
                                key={folder}
                                item={folder}
                                isFolder={true}
                                viewMode="grid"
                                currentPath={currentPath}
                                onDoubleClick={() => onNavigate(folder)}
                                onPin={onPin}
                                isPinned={pinnedFolders.some(pf => pf.path === (currentPath === "/" ? "" : currentPath.replace(/^\//, "")) + (currentPath === "/" ? "" : "/") + folder)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {data.files.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 px-1">Files</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {data.files.map(file => (
                            <ItemCard
                                key={file.name}
                                item={file}
                                isFolder={false}
                                viewMode="grid"
                                currentPath={currentPath}
                                onDoubleClick={() => onFileClick(file)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

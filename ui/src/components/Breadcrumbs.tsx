import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbsProps {
    path: string
    onNavigate: (path: string) => void
}

export function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
    // Clean up path and split into parts
    const parts = path.split("/").filter(Boolean)

    return (
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            <button
                onClick={() => onNavigate("/")}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
                <Home className="h-4 w-4" />
                <span className="sr-only">Back to Home</span>
            </button>

            {parts.map((part, index) => {
                const fullPath = "/" + parts.slice(0, index + 1).join("/")
                const isLast = index === parts.length - 1

                return (
                    <div key={fullPath} className="flex items-center gap-1">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <button
                            onClick={() => !isLast && onNavigate(fullPath)}
                            disabled={isLast}
                            className={`p-1 rounded transition-colors ${isLast
                                ? "text-gray-900 dark:text-gray-100 font-semibold cursor-default"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                }`}
                        >
                            {part}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

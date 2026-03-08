"use client"

import { useState, useEffect } from "react"
import { X, Download, FileText, ImageIcon, Loader2 } from "lucide-react"
import type { FileItem } from "../types"
import { getDownloadUrl, getStaticUrl } from "../services/api"
import axios from "axios"

interface PreviewModalProps {
    item: FileItem | null
    currentPath: string
    onClose: () => void
}

export function PreviewModal({ item, currentPath, onClose }: PreviewModalProps) {
    const [textContent, setTextContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isOpen = !!item
    const extension = item?.extension?.toLowerCase() || ""
    const isImage = ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif"].includes(extension)
    const isText = ["txt", "md", "json", "js", "ts", "css", "html", "py", "sh", "tsx", "jsx", "log"].includes(extension)

    const cleanPath = currentPath === "/" ? "" : currentPath.replace(/^\//, "")
    const fullPath = cleanPath ? `${cleanPath}/${item?.name}` : (item?.name || "")
    const staticUrl = item ? getStaticUrl(fullPath) : ""
    const downloadUrl = item ? getDownloadUrl(fullPath) : ""

    useEffect(() => {
        if (isOpen && isText && staticUrl) {
            const fetchText = async () => {
                setLoading(true)
                setError(null)
                try {
                    const response = await axios.get(staticUrl, { responseType: 'text' })
                    setTextContent(response.data)
                } catch (err) {
                    console.error("Failed to fetch text content:", err)
                    setError("Failed to load file content.")
                } finally {
                    setLoading(false)
                }
            }
            fetchText()
        } else {
            setTextContent(null)
        }
    }, [isOpen, isText, staticUrl])

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 min-w-0">
                        {isImage ? (
                            <ImageIcon className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                        ) : (
                            <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        )}
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {item.name}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={downloadUrl}
                            download={item.name}
                            className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Download"
                        >
                            <Download className="h-5 w-5" />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950/50 p-1 flex items-center justify-center min-h-[300px]">
                    {isImage ? (
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={staticUrl}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain rounded shadow-sm"
                            />
                        </div>
                    ) : isText ? (
                        <div className="w-full h-full p-6 font-mono text-sm">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                    <span>Loading content...</span>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center h-full text-red-500 p-8">
                                    <p className="text-center">{error}</p>
                                </div>
                            ) : (
                                <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-inner overflow-auto max-h-[70vh]">
                                    {textContent}
                                </pre>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-gray-500 gap-4">
                            <FileText className="h-16 w-16 opacity-20" />
                            <p>No preview available for this file type.</p>
                            <a
                                href={downloadUrl}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Download to view
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer / Info */}
                <div className="px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 flex justify-between items-center">
                    <span>{extension.toUpperCase()} File</span>
                    <span>Path: {currentPath === "/" ? "/" : currentPath}/{item.name}</span>
                </div>
            </div>
        </div>
    )
}

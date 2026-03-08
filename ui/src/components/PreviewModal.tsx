"use client";

import { useState, useEffect } from "react";
import { X, Download, FileText, ImageIcon, Loader2 } from "lucide-react";
import type { FileItem } from "../types";
import { getDownloadUrl, getStaticUrl } from "../services/api";
import axios from "axios";

interface PreviewModalProps {
    item: FileItem | null;
    currentPath: string;
    onClose: () => void;
    selectedDrive?: string;
}

export function PreviewModal({
    item,
    currentPath,
    onClose,
    selectedDrive,
}: PreviewModalProps) {
    const [textContent, setTextContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isOpen = !!item;
    const extension = item?.extension?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif"].includes(
        extension,
    );
    const isText = [
        "txt",
        "md",
        "json",
        "js",
        "ts",
        "css",
        "html",
        "py",
        "sh",
        "tsx",
        "jsx",
        "log",
    ].includes(extension);

    const cleanPath = currentPath === "/" ? "" : currentPath.replace(/^\//, "");
    const fullPath = cleanPath ? `${cleanPath}/${item?.name}` : item?.name || "";
    const staticUrl = item ? getStaticUrl(fullPath, selectedDrive) : "";
    const downloadUrl = item ? getDownloadUrl(fullPath, selectedDrive) : "";

    useEffect(() => {
        if (isOpen && isText && staticUrl) {
            const fetchText = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await axios.get(staticUrl, { responseType: "text" });
                    setTextContent(response.data);
                } catch (err) {
                    console.error("Failed to fetch text content:", err);
                    setError("Failed to load file content.");
                } finally {
                    setLoading(false);
                }
            };
            fetchText();
        } else {
            setTextContent(null);
        }
    }, [isOpen, isText, staticUrl]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in zoom-in-[0.98] duration-500 ease-out">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full h-full bg-white dark:bg-gray-950 flex flex-col border-none transform transition-all duration-500 ease-out">

                {/* Subtle Top Inner Glow */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent"></div>

                {/* Header */}
                <div className="relative flex items-center justify-between px-6 py-5 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 min-w-0 pr-4 group">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0 ring-1 ring-indigo-100/50 dark:ring-indigo-500/20 shadow-sm transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-indigo-500/20">
                            {isImage ? (
                                <ImageIcon className="h-5 w-5" />
                            ) : (
                                <FileText className="h-5 w-5" />
                            )}
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50 truncate tracking-tight transition-colors duration-200">
                            {item.name}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={downloadUrl}
                            download={item.name}
                            className="p-2.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all duration-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            title="Download File"
                        >
                            <Download className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                        </a>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700/50"></div>
                        <button
                            onClick={onClose}
                            className="p-2.5 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all duration-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 outline-none"
                            title="Close Preview"
                        >
                            <X className="h-5 w-5 transition-transform hover:rotate-90" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-[#050510]/30 p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[300px] relative">
                    {/* Subtle Ambient Background Blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>

                    {isImage ? (
                        <div className="relative w-full h-full flex items-center justify-center z-10 group/image">
                            <div className="absolute inset-x-0 bottom-0 top-0 opacity-50 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen"></div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={staticUrl}
                                alt={item.name}
                                className="relative w-full h-full object-contain rounded-xl shadow-2xl transition-transform duration-700"
                            />
                        </div>
                    ) : isText ? (
                        <div className="w-full h-full mx-auto z-10 animate-in slide-in-from-bottom-4 duration-500 ease-out">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-5 text-gray-500 dark:text-gray-400">
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="font-medium animate-pulse tracking-wide text-sm">
                                        LOADING CONTENT...
                                    </span>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-10 text-rose-600 dark:text-rose-400 bg-white/80 dark:bg-rose-950/20 backdrop-blur-md rounded-3xl shadow-xl ring-1 ring-rose-200/50 dark:ring-rose-500/20">
                                    <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-full mb-4">
                                        <X className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium text-center">{error}</p>
                                </div>
                            ) : (
                                <div className="h-full w-full bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-3xl overflow-hidden flex flex-col">
                                    <pre className="flex-1 whitespace-pre-wrap text-[13px] sm:text-sm font-mono text-gray-800 dark:text-gray-300 p-6 sm:p-8 overflow-auto custom-scrollbar leading-relaxed selection:bg-indigo-500/30">
                                        {textContent}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400 gap-6 text-center max-w-md mx-auto z-10 animate-in slide-in-from-bottom-8 duration-700 ease-out flex-1">
                            <div className="relative group/icon">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl scale-150 transition-transform duration-500 group-hover/icon:scale-110 opacity-0 group-hover/icon:opacity-100"></div>
                                <div className="relative p-7 bg-white dark:bg-gray-800 rounded-full shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-500 group-hover/icon:scale-110 group-hover/icon:-translate-y-2">
                                    <FileText className="h-16 w-16 text-indigo-400 dark:text-indigo-500 drop-shadow-md" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                                    Preview Not Available
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    We can't show {extension.toUpperCase()} files in the browser yet.
                                </p>
                            </div>
                            <a
                                href={downloadUrl}
                                download={item.name}
                                className="group/btn inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 border border-transparent dark:bg-white dark:text-gray-900 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                <Download className="h-5 w-5 transition-transform group-hover/btn:-translate-y-0.5" />
                                Download File
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer / Info */}
                <div className="relative px-6 py-4 bg-white/40 dark:bg-gray-900/40 border-t border-gray-200/50 dark:border-gray-800/50 flex justify-between items-center backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 text-[11px] font-bold text-gray-600 dark:text-gray-300 tracking-widest uppercase shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                            {extension || 'FILE'}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:block"></div>
                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 hidden sm:block tracking-wide">
                            READY
                        </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono pr-2 truncate max-w-[60%] opacity-80 hover:opacity-100 transition-opacity">
                        {currentPath === "/" ? "/" : currentPath}/{item.name}
                    </span>
                </div>
            </div>
        </div>
    );
}

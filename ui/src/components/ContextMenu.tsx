"use client";

import { useEffect, useRef } from "react";
import { Download, Copy, ExternalLink, Info, Pin, PinOff } from "lucide-react";

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onDownload?: () => void;
    downloadUrl?: string;
    fileName?: string;
    onCopyLink?: () => void;
    onPin?: () => void;
    isPinned?: boolean;
    onOpen?: () => void;
    isFolder?: boolean;
}

export function ContextMenu({
    x,
    y,
    onClose,
    onDownload,
    downloadUrl,
    fileName,
    onCopyLink,
    onPin,
    isPinned,
    onOpen,
    isFolder
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleScroll = () => onClose();

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [onClose]);

    // Adjust position if menu goes off screen
    const menuWidth = 200;
    const menuHeight = isFolder ? 80 : 120; // Estimated heights

    let posX = x;
    let posY = y;

    if (typeof window !== "undefined") {
        if (x + menuWidth > window.innerWidth) posX = x - menuWidth;
        if (y + menuHeight > window.innerHeight) posY = y - menuHeight;
    }

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in duration-100"
            style={{ left: posX, top: posY }}
        >
            <button
                onClick={() => { onOpen?.(); onClose(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
            >
                <ExternalLink className="h-4 w-4" />
                {isFolder ? "Open Folder" : "Open / Preview"}
            </button>

            {!isFolder && downloadUrl && (
                <a
                    href={downloadUrl}
                    download={fileName || "file"}
                    onClick={() => onClose()}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                >
                    <Download className="h-4 w-4" />
                    Download
                </a>
            )}

            <button
                onClick={() => { onCopyLink?.(); onClose(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
            >
                <Copy className="h-4 w-4" />
                Copy Link
            </button>

            {isFolder && (
                <button
                    onClick={() => { onPin?.(); onClose(); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                >
                    {isPinned ? (
                        <>
                            <PinOff className="h-4 w-4 text-amber-500" />
                            Unpin from sidebar
                        </>
                    ) : (
                        <>
                            <Pin className="h-4 w-4 text-amber-500" />
                            Pin to sidebar
                        </>
                    )}
                </button>
            )}

            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

            <button
                className="w-full text-left px-4 py-2 text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2 cursor-default"
            >
                <Info className="h-4 w-4" />
                Properties
            </button>
        </div>
    );
}

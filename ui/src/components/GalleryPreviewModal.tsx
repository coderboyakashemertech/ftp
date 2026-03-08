"use client";

import { useState, useEffect } from "react";
import { X, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import type { FileItem } from "../types";
import { getStaticUrl } from "../services/api";

interface GalleryPreviewModalProps {
    files: FileItem[];
    initialIndex: number;
    onClose: () => void;
}

export function GalleryPreviewModal({
    files,
    initialIndex,
    onClose,
}: GalleryPreviewModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }
    };

    const handleNext = () => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Close on Escape key, navigate on arrows
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, files.length, onClose]);

    const item = files[currentIndex];
    if (!item) return null;

    const extension = (item?.extension || "").toLowerCase().replace(/^\./, "");
    const isVid = ["mp4", "webm", "ogg", "mov", "mkv", "avi"].includes(extension);

    const fullPath = item?.path || item?.name || "";
    const driveToUse = item?.drive;
    const staticUrl = item ? getStaticUrl(fullPath, driveToUse) : "";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in zoom-in-[0.98] duration-300 ease-out bg-black">
            {/* Dark Backdrop */}
            <div
                className="absolute inset-0 transition-opacity cursor-pointer"
                onClick={onClose}
            />

            {/* Navigation Buttons (Desktop) */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="absolute left-4 sm:left-8 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 z-[110] cursor-pointer hidden sm:block"
                >
                    <ChevronLeft className="h-8 w-8" />
                </button>
            )}

            {currentIndex < files.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-4 sm:right-8 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 z-[110] cursor-pointer hidden sm:block"
                >
                    <ChevronRight className="h-8 w-8" />
                </button>
            )}

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-all duration-300 z-[120] cursor-pointer"
                title="Close Preview"
            >
                <X className="h-8 w-8" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/60 font-medium text-sm z-[120] pointer-events-none tracking-widest">
                {currentIndex + 1} / {files.length}
            </div>

            {/* Fullscreen Content Area */}
            <div
                className="relative flex flex-col items-center justify-center w-full h-full z-[105]"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {isVid ? (
                    <video
                        key={staticUrl}
                        src={staticUrl}
                        className="max-w-full max-h-[100dvh] object-contain pointer-events-auto"
                        autoPlay
                        controls
                        playsInline
                    />
                ) : (
                    <img
                        key={staticUrl}
                        src={staticUrl}
                        alt={item.name}
                        className="max-w-full max-h-[100dvh] w-auto h-auto object-contain pointer-events-auto"
                        loading="eager"
                        draggable={false}
                    />
                )}
            </div>
        </div>
    );
}

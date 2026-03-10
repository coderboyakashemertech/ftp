"use client";

import { useRef, useEffect } from "react";
import { GalleryFolders } from "../../../components/gallery/GalleryFolders";

export default function GalleryPage() {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Restore scroll on mount
        const savedScroll = sessionStorage.getItem("gallery_folders_scroll");
        if (savedScroll && scrollRef.current) {
            scrollRef.current.scrollTop = parseInt(savedScroll, 10);
        }

        const handleScroll = () => {
            if (scrollRef.current) {
                sessionStorage.setItem("gallery_folders_scroll", scrollRef.current.scrollTop.toString());
            }
        };

        const el = scrollRef.current;
        if (el) {
            el.addEventListener("scroll", handleScroll);
            return () => el.removeEventListener("scroll", handleScroll);
        }
    }, []);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <GalleryFolders />
        </div>
    );
}

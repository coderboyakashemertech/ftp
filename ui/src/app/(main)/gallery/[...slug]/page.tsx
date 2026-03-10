
import { GalleryMedia } from "../../../../components/gallery/GalleryMedia";

export default async function GalleryFolderPage({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const resolvedParams = await params;
    // Map decodeURIComponent so spaces and special characters are handled correctly
    const folderPath = resolvedParams.slug.map(decodeURIComponent).join("/");

    return (
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <GalleryMedia folderPath={folderPath} />
        </div>
    );
}

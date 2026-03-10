"use client";

import { useRouter } from "next/navigation";
import { Settings } from "../../../components/Settings";

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <Settings onBack={() => router.push("/")} />
        </div>
    );
}

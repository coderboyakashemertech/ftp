"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isAuthenticated, fetchDrives, fetchPinnedFolders, logout } from "../services/api";
import type { PinnedFolder } from "../types";

interface Drive {
    name: string;
    path: string;
}

interface AppContextType {
    isAuth: boolean;
    username: string | null;
    drives: Drive[];
    selectedDrive: string;
    pinnedFolders: PinnedFolder[];
    loadingAuth: boolean;
    login: () => void;
    performLogout: () => void;
    setSelectedDrive: (drive: string) => void;
    refreshPinnedFolders: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [isAuth, setIsAuth] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [drives, setDrives] = useState<Drive[]>([]);
    const [selectedDrive, setSelectedDrive] = useState<string>("");
    const [pinnedFolders, setPinnedFolders] = useState<PinnedFolder[]>([]);
    const [loadingAuth, setLoadingAuth] = useState(true);

    const checkAuthAndLoadData = async () => {
        setLoadingAuth(true);
        const authStat = isAuthenticated();
        setIsAuth(authStat);

        if (authStat) {
            setUsername(localStorage.getItem("name") || localStorage.getItem("username"));

            try {
                const [driveList, pins] = await Promise.all([
                    fetchDrives(),
                    fetchPinnedFolders()
                ]);

                setDrives(driveList);
                if (driveList.length > 0 && !selectedDrive) {
                    setSelectedDrive(driveList[0].name);
                }
                setPinnedFolders(pins);
            } catch (err) {
                console.error("Failed to load initial data in context:", err);
            }
        }
        setLoadingAuth(false);
    };

    useEffect(() => {
        checkAuthAndLoadData();
    }, []);

    const login = () => {
        checkAuthAndLoadData();
    };

    const performLogout = () => {
        logout();
        setIsAuth(false);
        setUsername(null);
        setDrives([]);
        setSelectedDrive("");
        setPinnedFolders([]);
    };

    const refreshPinnedFolders = async () => {
        try {
            const pins = await fetchPinnedFolders();
            setPinnedFolders(pins);
        } catch (err) {
            console.error("Failed to refresh pinned folders:", err);
        }
    };

    return (
        <AppContext.Provider
            value={{
                isAuth,
                username,
                drives,
                selectedDrive,
                pinnedFolders,
                loadingAuth,
                login,
                performLogout,
                setSelectedDrive,
                refreshPinnedFolders
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
}

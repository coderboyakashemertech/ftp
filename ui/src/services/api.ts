import axios from "axios"
import type { BrowseResponse, PinnedFolder } from "../types"

// The base URL of the local Express backend, defaulting to the env variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token} ` } : {};
}

export async function fetchDirectory(path: string = "", drive?: string): Promise<BrowseResponse> {
    try {
        const response = await axios.get<BrowseResponse>(`${API_URL}/browse`, {
            params: { path, drive },
            headers: getAuthHeaders()
        })
        return response.data
    } catch (error) {
        console.error("Failed to fetch directory:", error)
        throw error
    }
}

export async function fetchDrives(): Promise<{ name: string; path: string }[]> {
    try {
        const response = await axios.get(`${API_URL}/browse/drives`, {
            headers: getAuthHeaders()
        })
        return response.data
    } catch (error) {
        console.error("Failed to fetch drives:", error)
        throw error
    }
}

export function getDownloadUrl(path: string, drive?: string): string {
    const params = new URLSearchParams({ path });
    if (drive) params.append("drive", drive);

    const token = localStorage.getItem("token");
    if (token) params.append("token", token);

    return `${API_URL}/files/download?${params.toString()}`;
}

export function getStaticUrl(path: string, drive?: string): string {
    const params = new URLSearchParams({ path });
    if (drive) params.append("drive", drive);

    const token = localStorage.getItem("token");
    if (token) params.append("token", token);

    return `${API_URL}/files/serve?${params.toString()}`;
}

export async function login(username: string, password: string): Promise<{
    two_factor_required: boolean;
    setup_required?: boolean;
    qrCode?: string;
    secret?: string;
    token?: string;
    username: string;
    name?: string;
}> {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    return response.data;
}

export async function verify2fa(username: string, code: string): Promise<{ token: string; username: string; name: string }> {
    const response = await axios.post(`${API_URL}/auth/2fa/verify`, { username, code });
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("username", response.data.username);
    localStorage.setItem("name", response.data.name);
    return response.data;
}

export async function register(username: string, password: string, name: string, email: string): Promise<void> {
    await axios.post(`${API_URL}/auth/register`, { username, password, name, email });
}

export async function getCurrentUser(): Promise<{ id: number; username: string; name: string; email: string }> {
    const response = await axios.get(`${API_URL}/user/me`, { headers: getAuthHeaders() });
    return response.data;
}

export async function updateProfile(name: string, email: string): Promise<void> {
    await axios.put(`${API_URL}/user/profile`, { name, email }, { headers: getAuthHeaders() });
    localStorage.setItem("name", name);
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = localStorage.getItem("token")
    await axios.put(`${API_URL}/user/password`, { currentPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export async function fetchPinnedFolders(): Promise<PinnedFolder[]> {
    const token = localStorage.getItem("token")
    const response = await axios.get(`${API_URL}/pinned`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
}

export async function addPinnedFolder(name: string, path: string, drive?: string): Promise<PinnedFolder> {
    const token = localStorage.getItem("token")
    const response = await axios.post(`${API_URL}/pinned`, { name, path, drive }, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
}

export async function removePinnedFolder(id: number): Promise<void> {
    const token = localStorage.getItem("token")
    await axios.delete(`${API_URL}/pinned/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export async function removePinnedFolderByPath(path: string, drive?: string): Promise<void> {
    const token = localStorage.getItem("token")
    await axios.delete(`${API_URL}/pinned`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { path, drive }
    })
}


export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
}

export function isAuthenticated() {
    return !!localStorage.getItem("token");
}

import axios from "axios"
import type { BrowseResponse } from "../types"

// The base URL of the local Express backend, defaulting to the env variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

export async function fetchDirectory(path: string = ""): Promise<BrowseResponse> {
    try {
        const response = await axios.get<BrowseResponse>(`${API_URL}/browse`, {
            params: { path }
        })
        return response.data
    } catch (error) {
        console.error("Failed to fetch directory:", error)
        throw error
    }
}

export function getDownloadUrl(path: string): string {
    return `${API_URL}/files/download?path=${encodeURIComponent(path)}`
}

export function getStaticUrl(path: string): string {
    const staticBase = API_URL.replace(/\/api$/, "/api/static")
    return `${staticBase}/${path.replace(/^\//, "")}`
}

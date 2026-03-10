"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Login } from "../../components/Login";
import { isAuthenticated } from "../../services/api";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated()) {
            router.push("/");
        }
    }, [router]);

    const handleLoginSuccess = () => {
        router.push("/");
    };

    return <Login onLoginSuccess={handleLoginSuccess} />;
}

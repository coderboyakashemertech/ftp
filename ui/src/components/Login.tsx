"use client";

import { useState } from "react";
import { login, register, verify2fa } from "../services/api";
import { Loader2, LogIn, UserPlus, ShieldCheck, Mail, User, KeyRound, ArrowRight, ShieldQuestion } from "lucide-react";

interface LoginProps {
    onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState<"auth" | "2fa">("auth");

    // Auth fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // 2FA fields
    const [otpCode, setOtpCode] = useState("");
    const [setupInfo, setSetupInfo] = useState<{ qrCode?: string; secret?: string } | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const res = await login(username, password);
                if (res.two_factor_required) {
                    setStep("2fa");
                    if (res.setup_required) {
                        setSetupInfo({ qrCode: res.qrCode, secret: res.secret });
                    }
                }
            } else {
                await register(username, password, name, email);
                setIsLogin(true);
                setError("Registration successful! Please login.");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handle2faVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await verify2fa(username, otpCode);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || "Invalid 2FA code");
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setStep("auth");
        setSetupInfo(null);
        setOtpCode("");
        setError(null);
    };

    if (step === "2fa") {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 backdrop-blur-md p-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all duration-500 ease-out animate-in zoom-in-95 fade-in">
                    <div className="p-8">
                        <div className="flex flex-col items-center mb-8">
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl mb-4 text-indigo-600 dark:text-indigo-400">
                                {setupInfo ? <ShieldQuestion className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {setupInfo ? "Setup 2FA" : "Two-Factor Auth"}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-center text-sm px-4">
                                {setupInfo
                                    ? "Scan the QR code with your authenticator app to enable mandatory 2FA."
                                    : "Enter the 6-digit verification code from your authenticator app."
                                }
                            </p>
                        </div>

                        {setupInfo && (
                            <div className="flex flex-col items-center mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <img src={setupInfo.qrCode} alt="QR Code" className="w-48 h-48 rounded-lg mb-4 bg-white p-2" />
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Manual Entry Code</p>
                                    <code className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-indigo-600 dark:text-indigo-400 font-mono text-sm tracking-widest">
                                        {setupInfo.secret}
                                    </code>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handle2faVerify} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Authentication Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-500/50 rounded-2xl transition-all outline-none text-gray-900 dark:text-white text-3xl font-bold tracking-[0.5em] text-center"
                                    placeholder="000000"
                                    required
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl text-sm font-medium bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || otpCode.length !== 6}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <>
                                        Verify & Login
                                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <button
                            onClick={resetFlow}
                            className="w-full mt-6 text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            Back to login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all duration-500 ease-out animate-in zoom-in-95 fade-in">
                <div className="p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl mb-4 text-indigo-600 dark:text-indigo-400">
                            {isLogin ? <LogIn className="h-8 w-8" /> : <UserPlus className="h-8 w-8" />}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {isLogin ? "Welcome" : "Get Started"}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-center text-sm">
                            {isLogin ? "Log in with your credentials to continue" : "Join us today and enjoy secure storage"}
                        </p>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 rounded-xl transition-all outline-none text-gray-900 dark:text-white"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 rounded-xl transition-all outline-none text-gray-900 dark:text-white"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 rounded-xl transition-all outline-none text-gray-900 dark:text-white"
                                    placeholder="your_unique_id"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 rounded-xl transition-all outline-none text-gray-900 dark:text-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${error.includes("successful") ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800'}`}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:grayscale group"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                <>
                                    {isLogin ? "Sign In" : "Register Account"}
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all uppercase tracking-widest"
                        >
                            {isLogin ? "Need an account?" : "Already a member?"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

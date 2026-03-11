"use client";
import { useState, useContext } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChatContext } from "../context/chatcontext";
import api from "../apicall";
import { User, Lock, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { setMyUsername, setLogin, updatePremium } = useContext(ChatContext);

    const validate = () => {
        const newErrors = {};
        if (!username.trim()) newErrors.username = "Username humein zaroori chahiye";
        if (!password) newErrors.password = "Password zaroori hai dost";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setErrors({}); // Reset general errors

        try {
            const { data } = await api.post("/log", {
                username: username.toLowerCase(),
                password,
            });

            if (data.token) localStorage.setItem("tokenn", data.token);
            if (data.user?.username) {
                localStorage.setItem("username", data.user.username);
                setMyUsername(data.user.username);
            }

            if (data.userdata) {
                if (data.userdata.premiumExpiry)
                    localStorage.setItem("premiumExpiry", data.userdata.premiumExpiry);
                if (data.userdata.isPremium !== undefined) {
                    localStorage.setItem("isPremium", data.userdata.isPremium.toString());
                    updatePremium(data.userdata.isPremium, data.userdata.premiumExpiry);
                }
            }

            setLogin(true);
            router.push("/chatlist");
        } catch (err) {
            console.error(err);
            setErrors({ general: "Username ya Password galat hai. Phir se check karein." });
        } finally {
            setLoading(false);
        }
    };

    return (
        // Deep Blue/Black Gradient with movement animation (tailwind.config update needed)
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-black animate-background">

            {/* Absolute Decorative Glow Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Main Container - Responsive Widths */}
            <div className="relative w-full sm:max-w-[440px] md:max-w-[480px] lg:max-w-[500px]">

                {/* The Card - Modern Glassmorphism with Smooth Transitions */}
                <div className="relative p-6 sm:p-8 md:p-10 transition-all duration-500 ease-out bg-slate-900/60 backdrop-blur-3xl border border-slate-800 rounded-3xl shadow-[0_0_60px_-10px_rgba(0,0,0,0.6)] group">

                    {/* subtle glow border effect on hover */}
                    <div className="absolute inset-0 rounded-3xl border border-blue-500/0 group-hover:border-blue-500/20 transition-colors duration-500 pointer-events-none" />

                    {/* Header Section */}
                    <div className="flex flex-col items-center mb-9 text-center">
                        <div className="relative w-20 h-20 mb-5 p-1 rounded-3xl bg-slate-800/50 border border-slate-700 shadow-inner group-hover:scale-105 transition-transform duration-300">
                            <Image
                                src='/login.jpg' // Use your real logo path here
                                alt="App Logo"
                                fill
                                className="object-cover rounded-2xl"
                            />
                            <div className="absolute -top-2 -right-2 p-1 bg-blue-600 rounded-full shadow-lg">
                                <Sparkles size={14} className="text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">Welcome Back</span>
                        </h1>
                        <p className="text-sm md:text-base text-slate-400 mt-2 max-w-[280px]">Continue your conversations. Sign in to your account.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* General Error (if login fails) */}
                        {errors.general && (
                            <div className="p-4 text-sm font-medium text-center text-red-300 bg-red-950/40 border border-red-800 rounded-xl animate-pulse">
                                {errors.general}
                            </div>
                        )}

                        {/* Username Input Field */}
                        <div className="space-y-2.5">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">
                                <User size={14} className="text-blue-400" />
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="e.g. rahul_dev"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        setErrors({}); // Reset error on typing
                                    }}
                                    className="w-full px-5 py-4 bg-slate-800/40 border border-slate-700/80 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-500/60 transition-all shadow-inner"
                                />
                            </div>
                            {errors.username && <p className="text-red-400 text-xs ml-1 pt-1 animate-fadeIn">{errors.username}</p>}
                        </div>

                        {/* Password Input Field */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
                                    <Lock size={14} className="text-blue-400" />
                                    Password
                                </label>
                                <button type="button" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">Forgot?</button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setErrors({}); // Reset error on typing
                                    }}
                                    className="w-full px-5 py-4 bg-slate-800/40 border border-slate-700/80 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-500/60 transition-all shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs ml-1 pt-1 animate-fadeIn">{errors.password}</p>}
                        </div>

                        {/* Login Button - Prominent & Premium */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full py-4.5 overflow-hidden font-extrabold text-white transition-all duration-300 bg-blue-600 rounded-2xl hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)]"
                        >
                            {/* Subtle shining light effect on button hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />

                            <span className="flex items-center justify-center gap-2.5 text-base">
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>Sign In to Chat</>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer Sign Up Link */}
                    <div className="mt-10 text-center">
                        <p className="text-sm text-slate-500">
                            New here?{" "}
                            <button
                                onClick={() => router.push("/singupp")}
                                className="font-bold text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
                            >
                                Create an account
                            </button>
                        </p>
                    </div>
                </div>

                {/* Dynamic decorative elements around the card (visible on larger screens) */}
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/10 rounded-full blur-3xl opacity-0 lg:opacity-100" />
                <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-3xl opacity-0 lg:opacity-100" />
            </div>
        </div>
    );
}
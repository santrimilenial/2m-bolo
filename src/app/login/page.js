"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data.error || "Gagal melakukan login.");
      } else {
        router.push("/");
      }
    } catch (err) {
      setLoading(false);
      setError("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-[#8C3BEA] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-[#1EB7A6] rounded-full blur-[120px] opacity-20" style={{ animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}></div>
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-[#E42E61] rounded-full blur-[100px] opacity-10"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="w-full max-w-md relative z-10 px-6">
        
        {/* Brand/Logo Area */}
        <div className="text-center mb-10 flex flex-col items-center">
           <div className="w-16 h-16 mb-4 relative drop-shadow-[0_0_30px_rgba(30,183,166,0.3)]">
              <Image src="/logo.png" alt="Clicco Logo" fill className="object-contain rounded-2xl" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-white mb-2">CV Clicco Niroga</h1>
           <p className="text-sm text-pos-textMuted bg-white/5 px-4 py-1.5 rounded-full border border-white/5 inline-flex backdrop-blur-md">
              Secure Owner Portal
           </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#121827]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1EB7A6] via-[#4153B8] to-[#8C3BEA]"></div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-pos-textMuted uppercase tracking-wider pl-1">Username</label>
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-pos-textMuted group-focus-within:text-[#1EB7A6] transition-colors" />
                 </div>
                 <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1EB7A6]/50 focus:border-[#1EB7A6] transition-all placeholder:text-white/20"
                    placeholder="Masukkan username (owner)"
                 />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center pr-1">
                 <label className="text-xs font-semibold text-pos-textMuted uppercase tracking-wider pl-1">Password</label>
                 <a href="#" className="text-xs text-[#1EB7A6] hover:text-[#1EB7A6]/80 transition-colors">Lupa sandi?</a>
              </div>
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-pos-textMuted group-focus-within:text-[#1EB7A6] transition-colors" />
                 </div>
                 <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1EB7A6]/50 focus:border-[#1EB7A6] transition-all placeholder:text-white/20"
                    placeholder="Masukkan password"
                 />
                 <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-pos-textMuted hover:text-white transition-colors"
                 >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#E42E61]/10 border border-[#E42E61]/20 rounded-lg p-3 flex items-center space-x-2 animate-fade-in">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#E42E61]"></div>
                 <p className="text-xs text-[#E42E61]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full relative group overflow-hidden bg-white text-black font-bold text-sm py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed mt-4"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <div className="relative flex items-center justify-center space-x-2">
                 {loading ? (
                    <>
                       <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                       <span>Memverifikasi...</span>
                    </>
                 ) : (
                    <>
                       <span>Login Sekarang</span>
                       <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                 )}
              </div>
            </button>
          </form>

        </div>

        <div className="mt-8 text-center">
           <p className="text-xs text-white/40 flex items-center justify-center">
              <Lock size={12} className="mr-1" />
              End-to-end encrypted session
           </p>
        </div>
      </div>
    </div>
  );
}

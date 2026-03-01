"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Video, ShieldCheck, Mail, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const login = useAuthStore(state => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (isLogin) {
            // Login: username OR email + password
            try {
                await login({
                    username: formData.username || undefined,
                    email: formData.email || undefined,
                    password: formData.password,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Login failed. Please try again.");
            } finally {
                setLoading(false);
            }
        } else {
            // Signup: call backend directly then auto-login
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: formData.username || undefined,
                        email: formData.email || undefined,
                        password: formData.password,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Signup failed");

                // Auto-login after successful signup
                await login({
                    username: formData.username || undefined,
                    email: formData.email || undefined,
                    password: formData.password,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] -z-10" />

            <Link href="/">
                <Button variant="ghost" className="absolute top-8 left-8 text-white/60 hover:text-white hover:bg-white/5 gap-2 rounded-full">
                    <ArrowLeft className="w-4 h-4" /> Back to home
                </Button>
            </Link>

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-2xl shadow-primary/20 mb-6">
                        <Video className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-white/50 text-sm">
                        {isLogin ? 'Enter your details to continue your vibe' : 'Join the world\'s most connected community'}
                    </p>
                </div>

                <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-2xl shadow-2xl rounded-[32px]">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                    placeholder="Username"
                                    className="pl-12 h-14 rounded-2xl bg-white/5 border-white/5 focus:border-primary/50 transition-all text-white placeholder:text-white/20"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    className="pl-12 h-14 rounded-2xl bg-white/5 border-white/5 focus:border-primary/50 transition-all text-white placeholder:text-white/20"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    className="pl-12 h-14 rounded-2xl bg-white/5 border-white/5 focus:border-primary/50 transition-all text-white placeholder:text-white/20"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            size="lg"
                            className="w-full h-14 rounded-2xl font-bold text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="text-sm font-medium text-white/50 hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? Join now" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </Card>

                <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-white/20 font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    Secure Authentication via NextAuth
                </div>
            </div>
        </div>
    );
}

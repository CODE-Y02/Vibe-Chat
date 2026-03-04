"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Video, ShieldCheck, Mail, Lock, User, ArrowLeft, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '' });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const login = useAuthStore(state => state.login);
    const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.email) {
            setError("Email is required");
            return;
        }

        if (!isLogin) {
            if (!formData.username) {
                setError("Username is required for signup");
                return;
            }
            if (!acceptedTerms) {
                setError("You must accept the Terms of Service and Privacy Policy to join.");
                return;
            }
        }

        setLoading(true);

        if (isLogin) {
            try {
                await login(formData.email);
            } catch (err: any) {
                const message = err?.response?.data?.error || err?.message || "Login failed.";
                setError(typeof message === 'string' ? message : JSON.stringify(message));
            } finally {
                setLoading(false);
            }
        } else {
            try {
                // Supabase magic links treat Sign Up and Sign In structurally the same, 
                // but we can pass `full_name` as user_metadata upon their first registration loop!
                await login(formData.email, formData.username);
            } catch (err: any) {
                const message = err?.response?.data?.error || err?.message || "Signup failed.";
                setError(typeof message === 'string' ? message : JSON.stringify(message));
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 inset-x-0 h-full -z-10 pointer-events-none">
            <div className="absolute top-0 inset-x-0 h-full -z-10 pointer-events-none">
                <motion.div
                    animate={{ opacity: [0.08, 0.12, 0.08] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[140px]"
                />
                <motion.div
                    animate={{ opacity: [0.04, 0.07, 0.04] }}
                    transition={{ duration: 20, repeat: Infinity, delay: 2, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"
                />
            </div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="absolute top-8 left-8 z-50">
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 rounded-2xl px-6 h-12 backdrop-blur-xl border border-border/50">
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-12">
                    <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl shadow-glow-lg mb-8"
                    >
                        <Video className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tight mb-3 uppercase italic leading-none px-4">
                        {isLogin ? 'Welcome Back' : 'Join the Vibe'}
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-black tracking-[0.3em] uppercase opacity-50">
                        Secure · Encrypted · Instant
                    </p>
                </div>

                <Card className="p-10 glass-card rounded-[40px] shadow-glow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? 'login-fields' : 'signup-fields'}
                                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                                className="space-y-4"
                            >
                                {!isLogin && (
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            name="username"
                                            id="username"
                                            placeholder="Username"
                                            autoComplete="username"
                                            className="pl-12 pr-12 h-16 rounded-2xl bg-muted/30 border-border focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground/30"
                                            value={formData.username}
                                            onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                        />
                                    </div>
                                )}

                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="email"
                                        name="email"
                                        id="email"
                                        placeholder="Email address"
                                        autoComplete="email"
                                        className="pl-12 h-16 rounded-2xl bg-muted/30 border-border focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground/30"
                                        value={formData.email}
                                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>



                                {!isLogin && (
                                    <div className="flex items-start gap-3 mt-4 px-2">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="terms"
                                                type="checkbox"
                                                checked={acceptedTerms}
                                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                                className="w-4 h-4 bg-white/[0.03] border-white/10 rounded focus:ring-primary/50 focus:ring-2 accent-primary"
                                            />
                                        </div>
                                        <div className="text-xs text-white/40 leading-relaxed">
                                            <label htmlFor="terms" className="font-medium">
                                                By signing up, you confirm you have read and agree to our{' '}
                                                <Link href="/terms" target="_blank" className="text-primary hover:underline font-bold">Terms of Service</Link>
                                                {' '}and{' '}
                                                <Link href="/privacy" target="_blank" className="text-primary hover:underline font-bold">Privacy Policy</Link>.
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-xs font-bold uppercase tracking-wider"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                type="submit"
                                disabled={loading}
                                size="lg"
                                className="w-full h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary shadow-glow transition-all"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> SENDING MAGIC LINK
                                    </span>
                                ) : (isLogin ? 'SEND MAGIC LINK' : 'CREATE ACCOUNT')}
                            </Button>
                        </motion.div>

                        <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-border"></div>
                                <span className="shrink-0 px-6 text-muted-foreground/40 text-[10px] font-black uppercase tracking-widest">or continue with</span>
                                <div className="flex-grow border-t border-border"></div>
                            </div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={loading}
                                    onClick={() => loginWithGoogle()}
                                    size="lg"
                                    className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest bg-muted/30 border border-border hover:bg-muted/50 transition-all text-foreground"
                                >
                                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.01 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                GOOGLE
                            </Button>
                        </motion.div>
                    </form>

                    <div className="mt-10 pt-10 border-t border-white/5 text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                            {isLogin ? "New here? Join the world" : "Already human? Sign in"}
                        </button>
                    </div>
                </Card>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-10 flex items-center justify-center gap-2 text-[10px] text-white/20 font-black uppercase tracking-[0.3em]"
                >
                    <ShieldCheck className="w-4 h-4" />
                    Secure P2P Protocol v2.0
                </motion.div>
            </motion.div>
        </div>
    );
}


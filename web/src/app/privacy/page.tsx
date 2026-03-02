import { Navbar } from "@/components/layout/Navbar";
import { Shield, Lock, FileText, CheckCircle } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#020202] text-white selection:bg-primary/30 font-sans mesh-gradient">
            <Navbar className="bg-transparent border-none" />

            <main className="container mx-auto px-6 pt-32 pb-24 max-w-4xl">
                <div className="glass-card p-8 md:p-12 rounded-[2rem] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-vibe-gradient" />

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tight">Privacy Policy</h1>
                            <p className="text-white/40 font-medium tracking-widest text-sm uppercase mt-1">Last Updated: March 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none space-y-8 text-white/70">
                        <section>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                                <Lock className="w-5 h-5 text-emerald-400" /> 1. Peer-to-Peer (P2P) Video Architecture
                            </h2>
                            <p>
                                VibeChat is built on a privacy-first WebRTC architecture. When you connect with another user in the Anonymous Chat, your video and audio streams are transmitted <strong>directly from your device to theirs</strong>.
                                Our servers merely act as a signaling bridge to introduce your devices. We do not proxy, record, or have the technical capability to view your live video or audio feeds.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5 text-primary" /> 2. Client-Side AI Moderation
                            </h2>
                            <p>
                                To keep our community safe without compromising your privacy, VibeChat utilizes <strong>Client-Side Artificial Intelligence</strong> (TensorFlow.js / NSFWJS).
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4 text-white/80">
                                <li>Moderation happens entirely on your local device's hardware.</li>
                                <li>Video frames are periodically scanned locally and then instantly destroyed from memory.</li>
                                <li><strong>Zero Retention Policy:</strong> Video frames are NEVER uploaded, transmitted, or saved to our servers or any third-party service.</li>
                                <li>If inappropriate content is detected, your device will silently send an anonymous telemetry flag (containing only necessary metadata like device fingerprint and timestamp) to our backend to safeguard the platform.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Data We Collect</h2>
                            <p>We collect the minimum data necessary to operate the service:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li><strong>Account Information:</strong> If you choose to log in via OAuth, we store your basic profile information (Name, Email, Avatar).</li>
                                <li><strong>Device Fingerprints:</strong> We generate cryptographic hashes of your device characteristics strictly for anti-abuse and shadowbanning purposes, allowing us to ban malicious actors without requiring invasive tracking.</li>
                                <li><strong>Chat Metadata:</strong> We store Direct Messages (DMs) between established friends. Messages sent in Anonymous mode are ephemeral and are not stored.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. GDPR & CCPA Compliance</h2>
                            <p>
                                Under the GDPR (Article 6.1.f), we collect necessary telemetry and violation data under the basis of "Legitimate Interest" to prevent fraud, abuse, and illegal content on our platform. You have the right to request deletion of your account and associated DMs at any time by contacting support.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

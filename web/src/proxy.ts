export { auth as middleware } from "@/auth"

export const config = {
    matcher: ["/chat/:path*", "/feed/:path*", "/friends/:path*", "/dms/:path*"],
}

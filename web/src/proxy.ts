export { auth as proxy } from "@/auth"

export const config = {
    matcher: ["/chat/:path*", "/feed/:path*", "/friends/:path*", "/dms/:path*"],
}

import {getToken} from "next-auth/jwt"
import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"

// 1. Add "/api/auth" to this list to prevent blocking login requests
const PUBLIC_PATHS = [
    "/_next",
    "/favicon.ico",
    "/robots.txt",
    "/api/public",
    "/api/health",
    "/public",
    "/api/auth", // <--- CRITICAL FIX: Allow NextAuth routes
]

const ROLE_REQUIRED: Record<string, string> = {
    "/dashboard/verifier": "VERIFIER",
    "/dashboard/ambassador": "AMBASSADOR",
    "/admin": "AMBASSADOR",
}

const VERIFICATION_REQUIRED = [
    "/dashboard/secure",
    "/donation/create"
]

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

function getRequiredRole(pathname: string): string | undefined {
    const entry = Object.entries(ROLE_REQUIRED).find(
        ([prefix]) => pathname.startsWith(prefix)
    )
    return entry?.[1]
}

function requiresVerification(pathname: string): boolean {
    return VERIFICATION_REQUIRED.some(path => pathname.startsWith(path))
}

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname

    // 2. Handle Public Paths FIRST (Skip all auth checks)
    if (isPublicPath(pathname)) {
        return NextResponse.next()
    }

    // Retrieve the token
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET
    })

    const isAuthenticated = !!token

    // 3. AUTH PAGE RESTRICTION
    // If user is logged in, redirect them away from signin/signup
    if (pathname === "/signin" || pathname === "/signup") {
        if (isAuthenticated) {
            if (req.method !== 'POST') {
                return NextResponse.redirect(new URL("/dashboard", req.url))
            }
        }
        return NextResponse.next()
    }

    // 4. PROTECTED ROUTES RESTRICTION
    if (!isAuthenticated) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                {error: "Unauthorized", message: "Authentication required"},
                {status: 401}
            )
        }
        const url = new URL("/signin", req.url)
        url.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(url)
    }

    // 5. BLOCKED USER CHECK
    if (token?.blockedFromPlatform) {
        if (pathname !== "/signout") {
            return NextResponse.redirect(new URL("/signout", req.url))
        }
    }

    // 6. ROLE-BASED ACCESS CONTROL
    const requiredRole = getRequiredRole(pathname)
    if (requiredRole) {
        if (token?.role !== requiredRole) {
            if (pathname.startsWith("/api/")) {
                return NextResponse.json({error: "Forbidden"}, {status: 403})
            }
            const url = new URL("/dashboard", req.url) // Redirect to dashboard if forbidden
            return NextResponse.redirect(url)
        }
    }

    // 7. VERIFICATION STATUS CHECK
    if (requiresVerification(pathname)) {
        if (!token?.verificationStatus || token.verificationStatus === "PENDING") {
            if (pathname.startsWith("/api/")) {
                return NextResponse.json({error: "Verification required"}, {status: 403})
            }
            return NextResponse.redirect(new URL("/verify-account", req.url))
        }
    }

    // 8. HEADER INJECTION
    const response = NextResponse.next()
    if (token?.id) {
        response.headers.set("x-user-id", String(token.id))
        response.headers.set("x-user-role", String(token.role))
    }

    return response
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
}
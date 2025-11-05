import { withAuth } from "next-auth/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const PUBLIC_PATHS = [
    "/_next/",
    "/favicon.ico",
    "/robots.txt",
    "/api/public/",
    "/api/health",
    "/public/",
] as const

const ROLE_REQUIRED: Record<string, string> = {
    "/dashboard/verifier": "VERIFIER",
    "/dashboard/ambassador": "AMBASSADOR",
    "/admin": "ADMIN",
}

const VERIFICATION_REQUIRED = [
    "/dashboard/secure",
    "/donation/create"
] as const

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

function respondUnauthorized(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
            { error: "Unauthorized", message: "Authentication required" },
            { status: 401 }
        )
    }
    const url = new URL("/signin", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
}

function respondForbidden(request: NextRequest, message: string = "Access denied") {
    if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
            { error: "Forbidden", message },
            { status: 403 }
        )
    }
    const url = new URL("/forbidden", request.url)
    url.searchParams.set("reason", message)
    return NextResponse.redirect(url)
}

export default withAuth(
    async function middleware(req: NextRequest) {
        const pathname = req.nextUrl.pathname
        const token = (req as any).nextauth?.token

        if (isPublicPath(pathname)) {
            return NextResponse.next()
        }

        if (pathname === "/signin") {
            if (token) {
                return NextResponse.redirect(new URL("/dashboard", req.url))
            }
            return NextResponse.next()
        }

        if (pathname === "/signout") {
            return NextResponse.next()
        }

        if (!token) {
            return respondUnauthorized(req)
        }

        if (token.blockedFromPlatform) {
            if (pathname === "/signout") {
                return NextResponse.next()
            }
            return respondForbidden(req, "Your account has been suspended")
        }

        const requiredRole = getRequiredRole(pathname)
        if (requiredRole) {
            if (token.role !== requiredRole) {
                return respondForbidden(
                    req,
                    `This page requires ${requiredRole} role. You have: ${token.role}`
                )
            }
        }

        if (requiresVerification(pathname)) {
            if (
                !token.verificationStatus ||
                token.verificationStatus === "PENDING"
            ) {
                if (pathname.startsWith("/api/")) {
                    return respondForbidden(req, "Account verification required")
                }
                const url = new URL("/verify-account", req.url)
                url.searchParams.set("redirectTo", pathname)
                return NextResponse.redirect(url)
            }

            if (token.verificationStatus === "REJECTED") {
                return respondForbidden(
                    req,
                    "Your account verification was rejected"
                )
            }
        }

        const response = NextResponse.next()

        if (token.id) {
            response.headers.set("x-user-id", String(token.id))
        }

        if (token.role) {
            response.headers.set("x-user-role", String(token.role))
        }

        if (token.verificationStatus) {
            response.headers.set("x-verification-status", String(token.verificationStatus))
        }

        response.headers.set(
            "x-blocked-status",
            String(token.blockedFromPlatform || false)
        )

        return response
    },
    {
        callbacks: {
            authorized: () => true,
        },
        pages: {
            signIn: "/signin",
            error: "/error",
        },
    }
)

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/api/protected/:path*",
        "/api/donation/:path*",
        "/api/verify/:path*",
        "/signin",
        "/signout",
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
}
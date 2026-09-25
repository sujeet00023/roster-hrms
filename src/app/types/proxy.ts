import { NextResponse, type NextRequest } from "next/server";
import {jwtVerify} from "jose";
import { redirect } from "next/dist/server/api-utils";

const SESSION_COOKIE = "hrms_session";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function isPublic(pathname: string): boolean {
    return (
        PUBLIC_PATHS.includes(pathname) || 
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon")
    );
}

export async function proxy(req:NextRequest) {
    const {pathname} = req.nextUrl;
    if(isPublic(pathname)) return NextResponse.next();

    const token = req.cookies.get(SESSION_COOKIE)?.value;

    if(!token) return redirectToLogin(req);

    try {
        const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
        await jwtVerify(token, secret);
        return NextResponse.next(); 
    }catch {
        return redirectToLogin(req);
    }

}

function redirectToLogin(req: NextRequest) {
    if(req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Not authenticated"} , {status:401});

    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ["/((?!_next/static|_next\image|favicon.ico).*)"],
};
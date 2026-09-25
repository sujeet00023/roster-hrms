import bcrypt from "bcryptjs";
import {SignJWT, jwtVerify } from "jose";
import {cookies} from "next/headers";

const SESSION_COOKIE = "hrms_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8 //8 hours session

function getSecret(): Uint8Array {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32 ) {
        throw new Error (
            "SESSION_SECRET is missing or too short. Set a random 32+ character string in .env.local."

        );
         }
        return new TextEncoder().encode(secret);   
}

    export async function hashPassowrd(plain: string): Promise<string> {
        return bcrypt.hash(plain, 12);
        
    }

    export async function verifyPassword(plain:string, hash: string): Promise<boolean> {
        return bcrypt.compare(plain, hash);
    }

    export interface SessionPayload {
        employeeId: string;
        [key: string]: unknown;
    }

    export async function createSession(employeeId: string): Promise<void> {
        const token = await new SignJWT ({ employeeId })
        .setProtectedHeader({alg: "HS256"})
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
        .sign(getSecret());

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_TTL_SECONDS,

        });
        
    }

    export async function destroySession(): Promise<void> {
        const cookieStore = await cookies();
        cookieStore.delete(SESSION_COOKIE);
    }
    
/** Reads and verifies the session cookie for the current request. Returns null if absent or invalid. */
    export async function getSession(): Promise<SessionPayload | null > {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE)?.value;
        if(!token) return null;

        try{
            const {payload } = await jwtVerify(token, getSecret());
            if(typeof payload.employeeId !== "string") return null;
            return {employeeId:payload.employeeId };
        }catch {
            return null;
        }
    }

    export {SESSION_COOKIE};

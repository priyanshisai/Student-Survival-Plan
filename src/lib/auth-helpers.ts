import bcrypt from "bcryptjs";

const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "iiitm.ac.in";

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
}

export function isValidCollegeEmail(email: string): boolean {
    return email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}
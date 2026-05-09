// In-memory store for OTPs, persisted across reloads in development
const globalForOtp = global as unknown as { otpStore: Map<string, { otp: string, expiry: number }> };
const otpStore = globalForOtp.otpStore || new Map<string, { otp: string, expiry: number }>();

if (process.env.NODE_ENV !== 'production') globalForOtp.otpStore = otpStore;

export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveOTP(email: string, otp: string) {
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email, { otp, expiry });
}

export function verifyOTP(email: string, otp: string, deleteAfter: boolean = true): boolean {
    const stored = otpStore.get(email);
    
    if (!stored) {
        console.log(`[OTP] No OTP found for email: ${email}`);
        return false;
    }
    
    if (Date.now() > stored.expiry) {
        console.log(`[OTP] OTP expired for email: ${email}`);
        otpStore.delete(email);
        return false;
    }
    
    const isValid = stored.otp === otp;
    if (isValid) {
        console.log(`[OTP] Verification successful for email: ${email} (deleteAfter: ${deleteAfter})`);
        if (deleteAfter) {
            otpStore.delete(email); // One-time use
        }
    } else {
        console.log(`[OTP] Incorrect OTP for ${email}. Expected: ${stored.otp}, Received: ${otp}`);
    }
    return isValid;
}

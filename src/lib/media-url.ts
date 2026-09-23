/**
 * Resolves an image path coming from the API.
 *
 * Uploaded files are stored as paths relative to the API origin, not as
 * absolute URLs: an absolute URL baked into a row is only correct until the
 * deployment moves, and then every stored image is permanently broken. The
 * origin is applied here, at read time, where it is always current.
 *
 * Anything already absolute (an externally hosted image a barber pasted in)
 * is returned untouched.
 */
const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const mediaUrl = (value?: string | null): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
    return `${API}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

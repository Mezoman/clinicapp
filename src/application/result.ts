/**
 * Result Pattern for Application Layer.
 * Ensures consistent response structure and avoids leaking exceptions to the UI.
 */
export type AppResult<T> =
    | { success: true; data: T; error?: never }
    | { success: false; data?: never; error: string };

export function success<T>(data: T): AppResult<T> {
    return { success: true, data };
}

export function failure<T>(error: string): AppResult<T> {
    return { success: false, error };
}

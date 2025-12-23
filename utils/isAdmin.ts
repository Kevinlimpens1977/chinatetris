/**
 * Admin utility functions
 * Only Kevlimpens@gmail.com has admin access
 */

export const ADMIN_EMAIL = "Kevlimpens@gmail.com";

/**
 * Check if a user email matches the admin email
 * @param email - User's email address (case-insensitive comparison)
 */
export const isAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

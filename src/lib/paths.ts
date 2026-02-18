export const SIGN_IN_PATH = "/signin";

export function isProtectedAppPath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}

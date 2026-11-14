// Valida que un APK venga únicamente del bucket público de actualizaciones del proyecto.
export function isTrustedReleaseUrl(value, supabaseUrl) {
  try {
    const base = new URL(supabaseUrl);
    const apk = new URL(value);
    const expectedPath = "/storage/v1/object/public/app-releases/";

    return (
      base.protocol === "https:" &&
      apk.protocol === "https:" &&
      apk.origin === base.origin &&
      !apk.username &&
      !apk.password &&
      apk.pathname.startsWith(expectedPath) &&
      apk.pathname.toLowerCase().endsWith(".apk")
    );
  } catch {
    return false;
  }
}

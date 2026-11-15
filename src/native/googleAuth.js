import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/api/supabaseClient";
import { withBase } from "@/lib/withBase";

// Este es el Web Client ID. El Android Client ID se registra en Google Cloud
// junto al package name y SHA-1; no se coloca aquí.
const GOOGLE_WEB_CLIENT_ID =
  "853457170386-s1u80712ctel3mps63sk3dkermd3lauk.apps.googleusercontent.com";

let initialization;

async function initializeGoogle() {
  if (!initialization) {
    initialization = SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        mode: "online",
      },
    }).catch((error) => {
      initialization = null;
      throw error;
    });
  }
  await initialization;
}

function createRawNonce() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export async function loginWithGoogleNative(returnTo = "/dashboard") {
  await initializeGoogle();

  // Supabase recibe el nonce original; Google recibe su hash SHA-256.
  const rawNonce = createRawNonce();
  const nonceDigest = await sha256(rawNonce);

  const response = await SocialLogin.login({
    provider: "google",
    options: {
      nonce: nonceDigest,
      filterByAuthorizedAccounts: false,
      autoSelectEnabled: false,
    },
  });

  const result = response?.result;
  if (result?.responseType !== "online" || !result?.idToken) {
    throw new Error("Google no devolvió un ID token. Inténtalo de nuevo.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: result.idToken,
    nonce: rawNonce,
  });

  if (error) throw error;

  window.location.assign(withBase(returnTo));
}

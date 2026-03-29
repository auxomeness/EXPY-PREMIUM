const DEFAULT_GOOGLE_CLIENT_ID =
  "734017015749-jg7245u08a076soic9eu70laifa83pk1.apps.googleusercontent.com";

const GOOGLE_SCRIPT_ID = "expy-google-identity";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

let googleScriptPromise: Promise<void> | null = null;

export type GoogleAuthMode = "login" | "signup";

export type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleAccountsOauth2 = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: { type?: string }) => void;
  }) => GoogleTokenClient;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOauth2;
      };
    };
  }
}

function getGoogleClientId() {
  return DEFAULT_GOOGLE_CLIENT_ID;
}

async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to fetch Google account details");
  }

  const payload = (await response.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!payload.sub || !payload.email || !payload.name) {
    throw new Error("Google account details were incomplete");
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified: Boolean(payload.email_verified),
  } satisfies GoogleProfile;
}

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Google Identity Services")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google Identity Services"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function startGoogleAuth() {
  await loadGoogleIdentityScript();

  const googleOauth = window.google?.accounts?.oauth2;

  if (!googleOauth) {
    throw new Error("Google Identity Services is unavailable");
  }

  return await new Promise<GoogleProfile>((resolve, reject) => {
    const tokenClient = googleOauth.initTokenClient({
      client_id: getGoogleClientId(),
      scope: "openid email profile",
      callback: (tokenResponse) => {
        if (tokenResponse.error || !tokenResponse.access_token) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error || "Google sign-in failed"));
          return;
        }

        void fetchGoogleProfile(tokenResponse.access_token)
          .then(resolve)
          .catch(reject);
      },
      error_callback: (error) => {
        reject(new Error(error.type || "Google sign-in was cancelled"));
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  });
}

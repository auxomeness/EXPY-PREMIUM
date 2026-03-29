import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { ForgotPassword } from "./ForgotPassword";
import { loadGoogleIdentityScript, startGoogleAuth, type GoogleAuthMode, type GoogleProfile } from "../utils/googleAuth";

type AuthScreenProps = {
  onLogin: (username: string) => void;
  onSignup: (username: string, password: string) => void;
  onGoogleAuth: (profile: GoogleProfile, mode: GoogleAuthMode) => void;
};

export function AuthScreen({ onLogin, onSignup, onGoogleAuth }: AuthScreenProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void loadGoogleIdentityScript()
      .then(() => {
        if (!isMounted) return;

        setGoogleReady(true);
        setGoogleError(false);
      })
      .catch(() => {
        if (!isMounted) return;

        setGoogleReady(false);
        setGoogleError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGoogleButtonClick = async (mode: GoogleAuthMode) => {
    if (!googleReady) {
      toast.error("Google sign-in is still loading");
      return;
    }

    setIsGoogleLoading(true);

    try {
      const profile = await startGoogleAuth();
      onGoogleAuth(profile, mode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to continue with Google right now";

      if (message !== "popup_closed" && message !== "access_denied") {
        toast.error(message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    
    // Check if account exists
    if (!users[username]) {
      toast.error("Account does not exist");
      return;
    }
    
    // Check if password is correct
    if (users[username].password !== password) {
      toast.error("Wrong username or password");
      return;
    }
    
    // Reactivate account if it was deactivated
    if (users[username].isActive === false) {
      users[username].isActive = true;
      localStorage.setItem("expy_users", JSON.stringify(users));
      toast.success("Account reactivated!");
    }
    
    onLogin(username);
    toast.success("Welcome back!");
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (username.length > 10) {
      toast.error("Username must be 10 characters or less");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Check for at least one capital letter, one number, and one special character
    const hasCapital = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasCapital) {
      toast.error("Password must contain at least one capital letter");
      return;
    }

    if (!hasNumber) {
      toast.error("Password must contain at least one number");
      return;
    }

    if (!hasSpecial) {
      toast.error("Password must contain at least one special character");
      return;
    }

    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    
    if (users[username]) {
      toast.error("Username already exists");
      return;
    }

    // Pass to security questions setup
    onSignup(username, password);
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword 
        onBack={() => setShowForgotPassword(false)} 
        onSuccess={() => {
          setShowForgotPassword(false);
          toast.success("You can now log in with your new password");
        }}
      />
    );
  }

  return (
    <div className="mobile-shell mobile-canvas justify-center px-5 py-8">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-[0_22px_44px_-24px_rgba(3,2,19,0.95)]">
            <Wallet className="h-10 w-10 text-primary-foreground" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Personal Finance</p>
          <h1 className="mt-2 text-[2.4rem] font-semibold tracking-[-0.05em]">Expy</h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            Track your expenses, savings, and separate wallets with a cleaner mobile routine.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-5 pt-5">
            <div className="grid grid-cols-2 rounded-2xl border border-border/70 bg-muted/30 p-1">
              <Button
                type="button"
                variant={isSignup ? "ghost" : "default"}
                className="h-10"
                onClick={() => {
                  setIsSignup(false);
                  setUsername("");
                  setPassword("");
                }}
              >
                Log In
              </Button>
              <Button
                type="button"
                variant={isSignup ? "default" : "ghost"}
                className="h-10"
                onClick={() => {
                  setIsSignup(true);
                  setUsername("");
                  setPassword("");
                }}
              >
                Sign Up
              </Button>
            </div>

            <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
              <div className="space-y-4">
                <FloatingLabelInput
                  type="text"
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={10}
                />
                <FloatingLabelInput
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              {isSignup && (
                <div className="space-y-1.5 rounded-2xl border border-border/60 bg-muted/25 px-4 py-3 text-xs leading-5 text-muted-foreground">
                  <p>Username: max 10 characters.</p>
                  <p>Password: minimum 6 characters with one capital letter, one number, and one special character.</p>
                </div>
              )}
              
              <Button type="submit" className="w-full h-12 text-base">
                {isSignup ? "Sign Up" : "Log In"}
              </Button>
            </form>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full justify-center gap-3 rounded-2xl border-[#030213]/14 bg-white text-[#030213] shadow-none hover:bg-white dark:border-white/18 dark:bg-white dark:text-[#030213] dark:hover:bg-white"
              onClick={() => void handleGoogleButtonClick(isSignup ? "signup" : "login")}
              disabled={!googleReady || isGoogleLoading || googleError}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-[#030213]">
                <path
                  fill="currentColor"
                  d="M21.35 11.1H12v2.98h5.37c-.24 1.52-1.97 4.46-5.37 4.46-3.24 0-5.88-2.68-5.88-5.99s2.64-5.99 5.88-5.99c1.84 0 3.08.79 3.78 1.46l2.58-2.49C16.72 4 14.57 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.59-.05-1.03-.15-1.5Z"
                />
              </svg>
              <span>{isGoogleLoading ? "Opening Google..." : isSignup ? "Signup with Google" : "Log In with Google"}</span>
            </Button>

            {googleError && (
              <p className="text-center text-xs text-muted-foreground">
                Google sign-in is unavailable right now.
              </p>
            )}

            {!isSignup && (
              <div>
                <Button 
                  variant="link" 
                  className="w-full text-sm text-muted-foreground hover:text-primary"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

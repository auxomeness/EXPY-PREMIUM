import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { ForgotPassword } from "./ForgotPassword";

type AuthScreenProps = {
  onLogin: (username: string) => void;
  onSignup: (username: string, password: string) => void;
};

export function AuthScreen({ onLogin, onSignup }: AuthScreenProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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

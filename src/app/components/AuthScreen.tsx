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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl mb-2">Expy</h1>
          <p className="text-muted-foreground text-center">Track your expenses with ease</p>
        </div>

        <Card>
          <CardContent className="pt-6">
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
                <div className="text-xs text-muted-foreground space-y-1 -mt-2">
                  <p>• Username: Max 10 characters</p>
                  <p>• Password: Min 6 characters, must include:</p>
                  <p className="ml-4">- At least one capital letter</p>
                  <p className="ml-4">- At least one number</p>
                  <p className="ml-4">- At least one special character</p>
                </div>
              )}
              
              <Button type="submit" className="w-full h-12 text-base">
                {isSignup ? "Sign Up" : "Log In"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <Button 
                variant="outline" 
                className="w-full h-12 text-base"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setUsername("");
                  setPassword("");
                }}
              >
                {isSignup ? "Already have an account? Log In" : "Create New Account"}
              </Button>
            </div>

            {!isSignup && (
              <div className="mt-4">
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

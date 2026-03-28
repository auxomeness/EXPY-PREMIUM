import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { toast } from "sonner";
import { KeyRound, ArrowLeft, Lock } from "lucide-react";
import type { UserData } from "../App";

type ForgotPasswordProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [step, setStep] = useState<"username" | "verify" | "reset">("username");
  const [username, setUsername] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    const user = users[username];

    if (!user) {
      toast.error("Account not found");
      return;
    }

    if (!user.securityQuestions) {
      toast.error("This account doesn't have security questions set up");
      return;
    }

    setUserData(user);
    setStep("verify");
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretCode) {
      toast.error("Secret code is required");
      return;
    }

    // Check if secret code matches
    if (userData.securityQuestions.secretCode !== secretCode.trim()) {
      toast.error("Incorrect secret code");
      return;
    }

    // Check if at least one backup answer is provided and correct
    let backupCorrect = false;
    let backupProvided = false;

    if (nickname) {
      backupProvided = true;
      if (userData.securityQuestions.nickname === nickname.toLowerCase().trim()) {
        backupCorrect = true;
      }
    }

    if (birthdate) {
      backupProvided = true;
      if (userData.securityQuestions.birthdate === birthdate.trim()) {
        backupCorrect = true;
      }
    }

    if (favoriteColor) {
      backupProvided = true;
      if (userData.securityQuestions.favoriteColor === favoriteColor.toLowerCase().trim()) {
        backupCorrect = true;
      }
    }

    if (!backupProvided) {
      toast.error("Please answer at least one backup question");
      return;
    }

    if (!backupCorrect) {
      toast.error("At least one backup answer must be correct");
      return;
    }

    setStep("reset");
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    // Update password
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username].password = newPassword;
    localStorage.setItem("expy_users", JSON.stringify(users));

    toast.success("Password reset successfully");
    onSuccess();
  };

  return (
    <div className="mobile-shell mobile-canvas justify-center px-5 py-8">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
            <CardTitle>
              {step === "username" && "Forgot Password"}
              {step === "verify" && "Verify Identity"}
              {step === "reset" && "Reset Password"}
            </CardTitle>
          </div>
          <CardDescription>
            {step === "username" && "Enter your username to continue"}
            {step === "verify" && "Answer your security questions"}
            {step === "reset" && "Create a new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "username" && (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <FloatingLabelInput
                type="text"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Continue
                </Button>
              </div>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-3 text-primary">
                  Required: Secret Code
                </p>
                <FloatingLabelInput
                  type="password"
                  label="Secret code *"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  required
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">
                  Backup Questions (answer at least one correctly)
                </p>
                <div className="space-y-3">
                  <FloatingLabelInput
                    type="text"
                    label="What is your nickname?"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  <FloatingLabelInput
                    type="date"
                    label="What is your birthdate?"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                  />
                  <FloatingLabelInput
                    type="text"
                    label="What is your favorite color?"
                    value={favoriteColor}
                    onChange={(e) => setFavoriteColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Verify
                </Button>
              </div>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <FloatingLabelInput
                type="password"
                label="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <FloatingLabelInput
                type="password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters
              </p>
              <Button type="submit" className="w-full h-12">
                <Lock className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

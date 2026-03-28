import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { toast } from "sonner";
import { Shield, ArrowRight } from "lucide-react";
import { createDefaultUserData } from "../utils/userData";

type SecurityQuestionsSetupProps = {
  username: string;
  password: string;
  onComplete: () => void;
};

export function SecurityQuestionsSetup({ username, password, onComplete }: SecurityQuestionsSetupProps) {
  const [nickname, setNickname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [secretCode, setSecretCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretCode) {
      toast.error("Secret code is required");
      return;
    }

    if (!nickname && !birthdate && !favoriteColor) {
      toast.error("Please answer at least one backup question");
      return;
    }

    // Save user with security questions
    const users = JSON.parse(localStorage.getItem("expy_users") || "{}");
    users[username] = {
      ...createDefaultUserData(username, password),
      securityQuestions: {
        nickname: nickname.toLowerCase().trim(),
        birthdate: birthdate.trim(),
        favoriteColor: favoriteColor.toLowerCase().trim(),
        secretCode: secretCode.trim(),
      },
    };
    localStorage.setItem("expy_users", JSON.stringify(users));
    
    toast.success("Security questions saved");
    onComplete();
  };

  return (
    <div className="mobile-shell mobile-canvas justify-center px-5 py-8">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <CardTitle>Account Recovery Setup</CardTitle>
          </div>
          <CardDescription>
            Set up security questions to recover your account if you forget your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
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
                <p className="text-xs text-muted-foreground mt-1">
                  This is your primary recovery method
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">
                  Backup Questions (answer at least one)
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
            </div>

            <Button type="submit" className="w-full h-12">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

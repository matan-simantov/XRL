import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { hashPassword, verifyPassword, isEmailLike } from "@/lib/crypto";
import { createUser, getUser, setSession, updateLastLogin, getSession } from "@/lib/storage";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useButtonColor } from "@/hooks/use-button-color";

const Auth = () => {
  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { getTextClass } = useButtonColor();

  useEffect(() => {
    const session = getSession();
    if (session?.username) {
      navigate("/dashboard/new-form", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError("");
    if (!username || !password) {
      setAuthError("Please enter your username and password.");
      setIsSubmitting(false);
      return;
    }
    const user = await getUser(username);
    if (!user) {
      setAuthError("The credentials were not recognized. You can try again or register a new account.");
      setIsSubmitting(false);
      return;
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      setAuthError("The credentials were not recognized. You can try again or register a new account.");
      setIsSubmitting(false);
      return;
    }
    await updateLastLogin(user.username);
    setSession(user.username);
    toast.success("Signed in successfully!", {
      duration: 2000,
    });
    // Use setTimeout to ensure session is set before navigation
    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 100);
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError("");
    if (!username || !password) {
      setAuthError("Please enter a username and password.");
      setIsSubmitting(false);
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      setIsSubmitting(false);
      return;
    }
    const email = isEmailLike(username) ? username : null;
    try {
      const passwordHash = await hashPassword(password);
      await createUser({ username, email, passwordHash } as any);
      setSession(username);
      toast.success("Account created successfully!", {
        duration: 2000,
      });
      // Use setTimeout to ensure session is set before navigation
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
    } catch (e: any) {
      if (e?.message === "USERNAME_TAKEN") {
        setAuthError("Username already registered.");
      } else {
        setAuthError("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold ${getTextClass()} mb-2`}>XRL Platform</h1>
          <p className="text-muted-foreground">AI-Driven Decision Support</p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Login or register to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-4 w-full justify-center">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username or Email</Label>
                    <Input id="login-username" type="text" value={username} onChange={(e) => { setUsername(e.target.value); if (authError) setAuthError(""); }} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(""); }} placeholder="••••••••" />
                  </div>
                  {authError && (
                    <div
                      className="flex items-center gap-2 text-[13px] mt-2 text-[#D92D20]"
                      aria-live="polite"
                      role="status"
                      tabIndex={0}
                    >
                      <span className="flex-1">{authError}</span>
                      <button
                        type="button"
                        className="underline text-[#2563EB] hover:text-[#1E40AF]"
                        onClick={() => setTab("register")}
                      >
                        Register
                      </button>
                    </div>
                  )}
                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username or Email</Label>
                    <Input id="reg-username" type="text" value={username} onChange={(e) => { setUsername(e.target.value); if (authError) setAuthError(""); }} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(""); }} placeholder="Minimum 6 characters" />
                  </div>
                  {authError && (
                    <div
                      className="text-[13px] mt-2 text-[#D92D20]"
                      aria-live="polite"
                      role="status"
                      tabIndex={0}
                    >
                      {authError}
                    </div>
                  )}
                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Creating…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;

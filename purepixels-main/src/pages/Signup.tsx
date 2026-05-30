import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Mail, Lock, Eye, EyeOff, User, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"details" | "verify">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { login, apiBaseUrl } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/signup/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("verify");
        toast({
          title: "Verification code sent",
          description: `Enter the 6-digit code sent to ${data.email || email}.`,
        });
      } else {
        toast({ title: "Signup Failed", description: data.message || "Could not register account.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Signup request failed:", error);
      toast({ title: "Connection Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();

    if (!/^\d{6}$/.test(trimmedOtp)) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit code from your email.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/signup/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: trimmedOtp }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        toast({ title: "Email verified!", description: `Welcome to PurePixels, ${data.user.name}!` });
        navigate("/dashboard");
      } else {
        toast({ title: "Verification Failed", description: data.message || "Could not verify code.", variant: "destructive" });
      }
    } catch (error) {
      console.error("OTP verification request failed:", error);
      toast({ title: "Connection Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/signup/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: "New code sent", description: "Check your email for the latest verification code." });
      } else {
        toast({ title: "Could not resend code", description: data.message || "Please try again.", variant: "destructive" });
      }
    } catch (error) {
      console.error("OTP resend request failed:", error);
      toast({ title: "Connection Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  const editDetails = () => {
    setStep("details");
    setOtp("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        className="w-full max-w-md p-8 rounded-3xl bg-card shadow-elevated border border-border"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-6">
            <img src={logo} alt="PurePixels" className="h-14 w-auto" />
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {step === "details" ? "Create your account" : "Verify your email"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "details" ? "Start removing backgrounds for free" : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === "details" ? (
          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 rounded-xl h-11"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl h-11"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-xl h-11"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              className="w-full rounded-2xl h-11 bg-primary hover:bg-navy-light font-semibold text-white flex items-center justify-center gap-2"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div className="rounded-2xl border border-pixel/20 bg-pixel/10 p-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-pixel mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Enter the code from your inbox to finish creating your account.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium text-foreground">Verification Code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="rounded-xl h-12 text-center text-lg font-semibold tracking-[0.4em]"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              className="w-full rounded-2xl h-11 bg-primary hover:bg-navy-light font-semibold text-white flex items-center justify-center gap-2"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="ghost" className="rounded-xl flex-1 gap-2" onClick={editDetails} disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4" />
                Edit Details
              </Button>
              <Button type="button" variant="outline" className="rounded-xl flex-1" onClick={handleResendOtp} disabled={isResending || isSubmitting}>
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-pixel hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

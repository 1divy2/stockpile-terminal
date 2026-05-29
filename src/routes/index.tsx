import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Github, LockKeyhole, Mail, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useState } from "react";
import * as React from "react";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth-store";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, GithubAuthProvider } from "firebase/auth";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, initialized } = useAuthStore();

  React.useEffect(() => {
    if (initialized && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, initialized, navigate]);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (providerName: "google" | "github") => {
    setLoading(true);
    setError("");
    try {
      const provider = providerName === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message || `Failed to log in with ${providerName}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="panel-elevated relative overflow-hidden p-8">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 via-transparent to-transparent" />

        <div className="relative">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan">
            Welcome Back
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Access StockPile</h1>

          <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
            Enter your credentials to continue into the AI market intelligence environment.
          </p>

          <div className="mt-8 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 text-[13px] text-negative bg-negative/10 border border-negative/30 rounded-lg">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-muted-foreground">Email Address</label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-panel px-4 transition-colors focus-within:border-cyan/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="alex@stockpile.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-muted-foreground">Password</label>
                <button className="text-[12px] text-cyan transition-opacity hover:opacity-80">
                  Forgot password?
                </button>
              </div>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-panel px-4 transition-colors focus-within:border-cyan/50">
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Login Button */}
            <motion.button
              whileTap={{ scale: 0.985 }}
              whileHover={{ y: -1 }}
              onClick={handleEmailLogin}
              disabled={loading}
              className="glow-positive mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-medium text-primary-foreground transition-all disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to Platform"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </motion.button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-panel-elevated px-3 text-[11px] text-muted-foreground">
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            {/* OAuth */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleProviderLogin("github")}
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-panel transition-colors hover:border-cyan/40 disabled:opacity-50"
              >
                <Github className="h-4 w-4" />
                <span className="text-sm">GitHub</span>
              </button>

              <button 
                onClick={() => handleProviderLogin("google")}
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-panel transition-colors hover:border-cyan/40 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm">Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

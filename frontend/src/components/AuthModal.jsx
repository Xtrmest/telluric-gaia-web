import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail, api } from "../lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";

export const AuthModal = ({ open, onOpenChange }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setError("");
      setBusy(false);
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Signal locked. Welcome back.");
      } else {
        await register(name, email, password);
        toast.success("Account initialized.");
      }
      onOpenChange(false);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = async () => {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle();
      toast.success("Signal locked via Google.");
      onOpenChange(false);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-[#1E2330] bg-[#0F1117] sm:max-w-md"
        data-testid="auth-modal"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold uppercase tracking-tight">
            {mode === "login" ? "Access Lab" : "Initialize ID"}
          </DialogTitle>
        </DialogHeader>

        <button
          onClick={googleLogin}
          data-testid="google-auth-btn"
          className="flex w-full items-center justify-center gap-3 rounded-md border border-[#2A3245] bg-[#171A23] px-4 py-3 text-sm font-medium text-slate-100 transition-colors hover:border-[color:var(--thermo)]"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="h-5 w-5" />
          Continue with Google
        </button>

        <div className="my-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#1E2330]" />
          <span className="font-mono text-[10px] uppercase tracking-mono text-slate-500">or</span>
          <div className="h-px flex-1 bg-[#1E2330]" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-mono text-slate-400">Name</Label>
              <Input
                data-testid="auth-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-[#1E2330] bg-[#07080C]"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-mono text-slate-400">Email</Label>
            <Input
              data-testid="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-[#1E2330] bg-[#07080C]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-mono text-slate-400">Password</Label>
            <Input
              data-testid="auth-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-[#1E2330] bg-[#07080C]"
            />
          </div>

          {error && (
            <p data-testid="auth-error" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={busy}
            data-testid="auth-submit-btn"
            className="w-full bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C] hover:opacity-90"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Authenticate" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400">
          {mode === "login" ? "No credentials yet?" : "Already registered?"}{" "}
          <button
            data-testid="auth-toggle-mode"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="font-medium text-[color:var(--thermo)] hover:underline"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

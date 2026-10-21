import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

// Handles the Emergent Google OAuth callback (session_id in URL fragment).
export const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;

    const run = async () => {
      if (!sessionId) {
        navigate("/", { replace: true });
        return;
      }
      try {
        const { data } = await api.post(
          "/auth/google-session",
          {},
          { headers: { "X-Session-ID": sessionId } }
        );
        setAuthToken(data.token);
        setUser(data.user);
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/account", { replace: true });
      } catch {
        navigate("/", { replace: true });
      }
    };
    run();
  }, [navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080C]" data-testid="auth-callback">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--thermo)" }} />
        <p className="font-mono text-xs uppercase tracking-mono text-slate-400">Establishing session…</p>
      </div>
    </div>
  );
};

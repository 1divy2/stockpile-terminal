import { useNavigate, Link } from "@tanstack/react-router";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  if (!user) {
    return null;
  }

  // Fallback to email prefix if displayName is missing
  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden xl:flex flex-col items-end leading-tight">
        <div className="text-[12px] font-medium">{displayName}</div>
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          Member
        </div>
      </div>

      <Link to="/profile" className="flex items-center gap-2 rounded-xl border border-border/60 bg-panel px-2 py-1.5 transition hover:border-cyan/50 hover:bg-panel-elevated cursor-pointer">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-primary text-[12px] font-semibold text-background">
          {initials}
        </div>
        <div className="hidden lg:flex items-center gap-1 text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
        </div>
      </Link>

      <button
        onClick={async () => {
          await logout();
          navigate({ to: "/" });
        }}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-panel transition-colors hover:border-negative/40 hover:text-negative"
      >
        <LogOut className="h-4 w-4" />
      </button>


    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, MetricCard } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { useAuthStore } from "@/store/auth-store";
import { ShieldCheck, Mail, Key, Activity, Clock, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile · StockPile" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuthStore();
  
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();
  const joinedDate = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="User Profile"
        subtitle="Manage your personal information and preferences"
        right={
          <Pill tone="positive">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Verified Member
          </Pill>
        }
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          <div className="panel-elevated p-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cyan to-primary flex items-center justify-center text-3xl font-semibold text-background mb-4 shadow-lg shadow-cyan/20">
              {initials}
            </div>
            
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <div className="text-[13px] text-muted-foreground mt-1 flex items-center gap-1.5 justify-center">
              <Mail className="h-3.5 w-3.5" />
              {user?.email || "No email provided"}
            </div>
            
            <div className="w-full mt-6 grid grid-cols-2 gap-3 border-t border-border/40 pt-6">
              <div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase mb-1">Status</div>
                <div className="text-[13px] font-semibold text-positive flex items-center justify-center gap-1">
                  <Activity className="h-3.5 w-3.5" /> Active
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase mb-1">Member Since</div>
                <div className="text-[13px] font-semibold text-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {joinedDate}
                </div>
              </div>
            </div>
          </div>
          
          <MetricCard
            label="API Rate Limit"
            value="4,950 / 5,000"
            hint="Reset in 12 hrs"
            accent="cyan"
            icon={<Zap className="h-4 w-4" />}
          />
        </div>

        <div className="xl:col-span-8 space-y-6">
          <div className="panel-elevated p-6">
            <h3 className="text-[14px] font-semibold mb-4 text-cyan uppercase tracking-wider">Account Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Display Name</label>
                  <input 
                    type="text" 
                    defaultValue={displayName}
                    className="w-full bg-panel/50 border border-border/60 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={user?.email || ""}
                    disabled
                    className="w-full bg-background border border-border/40 text-muted-foreground rounded-md px-3 py-2 text-[13px] outline-none cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Bio / Description</label>
                <textarea 
                  rows={3}
                  defaultValue="Quantitative analyst and algorithmic trader focusing on tech equities."
                  className="w-full bg-panel/50 border border-border/60 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan transition resize-none"
                />
              </div>
              
              <div className="pt-2 flex justify-end">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-[13px] font-medium transition hover:opacity-90">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
          
          <div className="panel-elevated p-6">
            <h3 className="text-[14px] font-semibold mb-4 text-cyan uppercase tracking-wider">Security & Access</h3>
            
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-border/40 pb-5">
                <div>
                  <div className="text-[14px] font-medium">Password</div>
                  <div className="text-[12px] text-muted-foreground mt-1">Last changed 3 months ago</div>
                </div>
                <button className="border border-border/60 hover:bg-panel transition rounded-md px-3 py-1.5 text-[12px] font-medium flex items-center gap-2">
                  <Key className="h-3.5 w-3.5" /> Change Password
                </button>
              </div>
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[14px] font-medium">Two-Factor Authentication</div>
                  <div className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-warn" />
                    Not enabled
                  </div>
                </div>
                <button className="border border-cyan/40 text-cyan hover:bg-cyan/10 transition rounded-md px-3 py-1.5 text-[12px] font-medium">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

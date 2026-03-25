import { Switch, Route, Router, Link, useRoute } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppFooter } from "@/components/AppFooter";
import { TierProvider } from "@/lib/tier";
import { UpgradeModal } from "@/components/upgrade-modal";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import WorkoutPage from "@/pages/workout";
import History from "@/pages/history";
import SettingsPage from "@/pages/settings-page";
import {
  LayoutDashboard,
  History as HistoryIcon,
  Settings,
} from "lucide-react";

function NavItem({
  href,
  icon: Icon,
  label,
  matchPaths,
}: {
  href: string;
  icon: any;
  label: string;
  matchPaths?: string[];
}) {
  const [isActive] = useRoute(href);
  const extraMatches = matchPaths?.map((p) => {
    const [m] = useRoute(p);
    return m;
  });
  const active = isActive || extraMatches?.some(Boolean);

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs transition-colors ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
      data-testid={`nav-${label.toLowerCase()}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function AppRouter() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-24">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/workout/:dayNumber" component={WorkoutPage} />
          <Route path="/history" component={History} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-1">
          <NavItem href="/" icon={LayoutDashboard} label="Today" matchPaths={["/workout/:dayNumber"]} />
          <NavItem href="/history" icon={HistoryIcon} label="History" />
          <NavItem href="/settings" icon={Settings} label="Settings" />
        </div>
        <AppFooter />
      </nav>

      {/* Upgrade modal */}
      <UpgradeModal />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TierProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TierProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

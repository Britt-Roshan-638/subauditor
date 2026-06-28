// components/header.tsx — top app-bar for /dashboard, /settings, /onboarding.

"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
}

export function Header({
  userName = "Auditor",
  userEmail = "you@subauditor.app",
}: HeaderProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-br from-violet via-violet-glow to-cyan-glow">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,.4),transparent)]" />
              <span className="absolute inset-0 grid place-items-center font-display text-base text-primary-foreground">
                S
         </span>
       </div>
            <span className="font-display text-xl tracking-tightest text-foreground hidden sm:inline">
              SubAuditor
       </span>
     </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/dashboard"
              className="chip-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              DASHBOARD
       </Link>
            <Link
              href="/settings"
              className="chip-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5"
            >
              <Settings className="h-3.5 w-3.5" />
              SETTINGS
       </Link>
     </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-violet to-violet-dim text-primary-foreground text-sm font-semibold">
                    {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
          </Link>
        </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
          </Link>
        </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
    </div>
    </div>
  </header>
  );
}

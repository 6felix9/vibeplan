"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Compass,
  History,
  Info,
  Menu,
  Search,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useHistory } from "@/lib/hooks/useHistory";
import IconLogo from "@/app/assets/Icon Logo.png";
import FullLogo from "@/app/assets/Full Logo.png";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return "1 week ago";
  return `${diffWeeks} weeks ago`;
}

const primaryLinks = [
  { href: "/", label: "Discover", icon: Search },
  { href: "/explore", label: "Explore", icon: Compass },
];

function LogoLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="flex items-end" onClick={onClick}>
      <div className="relative h-8 w-8 shrink-0">
        <Image
          src={IconLogo}
          alt="VibePlan Icon"
          fill
          sizes="32px"
          className="object-contain"
        />
      </div>
      <div className="relative h-6 w-32">
        <Image
          src={FullLogo}
          alt="VibePlan"
          fill
          sizes="128px"
          className="object-contain object-left"
        />
      </div>
    </Link>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopHistoryOpen, setDesktopHistoryOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(true);
  const pathname = usePathname();

  const { user, historyItems, fetchHistory } = useHistory();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const isActive = (path: string) => pathname === path;
  const profileLabel =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "Profile";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-primary/15 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <LogoLink />

        <nav className="hidden items-center gap-1 md:flex">
          {primaryLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all hover:bg-primary/10",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-primary/75"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="relative">
            <Button
              type="button"
              variant={isActive("/history") ? "default" : "ghost"}
              className="h-10 rounded-full px-4"
              onClick={() => setDesktopHistoryOpen((open) => !open)}
            >
              <History className="mr-2 h-4 w-4" />
              History
              <ChevronDown
                className={cn(
                  "ml-2 h-4 w-4 transition-transform",
                  desktopHistoryOpen && "rotate-180"
                )}
              />
            </Button>

            {desktopHistoryOpen && (
              <div className="absolute left-1/2 top-12 w-80 -translate-x-1/2 rounded-lg border border-primary/15 bg-white p-2 shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Recent searches
                </div>
                <div className="space-y-1">
                  {historyItems.length > 0 ? (
                    historyItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/results?id=${item.id}`}
                        onClick={() => setDesktopHistoryOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/5"
                      >
                        <p className="truncate font-medium">
                          {item.query || "Untitled itinerary"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(item.created_at)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="px-3 py-3 text-sm text-muted-foreground">
                      No recent searches
                    </p>
                  )}
                </div>
                <Link
                  href="/history"
                  onClick={() => setDesktopHistoryOpen(false)}
                  className="mt-1 block rounded-md px-3 py-2 text-sm font-medium text-primary underline underline-offset-4 hover:bg-primary/5"
                >
                  View all history
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/about"
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all hover:bg-primary/10",
              isActive("/about")
                ? "bg-primary text-primary-foreground"
                : "text-primary/75"
            )}
          >
            <Info className="h-4 w-4" />
            About
          </Link>

          <Link
            href="/profile"
            className={cn(
              "inline-flex h-10 max-w-48 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all hover:bg-primary/10",
              isActive("/profile")
                ? "bg-primary text-primary-foreground"
                : "text-primary/75"
            )}
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="h-5 w-5 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="truncate">{profileLabel}</span>
          </Link>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[86vw] max-w-sm">
            <SheetHeader>
              <SheetTitle className="text-left">
                <LogoLink onClick={() => setMobileOpen(false)} />
              </SheetTitle>
              <SheetDescription className="sr-only">
                Main navigation links, recent history, and account pages.
              </SheetDescription>
            </SheetHeader>

            <nav className="mt-8 flex flex-col gap-2">
              {primaryLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className="w-full justify-start rounded-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="mr-2 h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}

              <Collapsible
                open={mobileHistoryOpen}
                onOpenChange={setMobileHistoryOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant={isActive("/history") ? "default" : "ghost"}
                    className="w-full justify-between rounded-full"
                  >
                    <span className="flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      History
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        mobileHistoryOpen && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1 border-l border-primary/15 pl-4">
                  {historyItems.length > 0 ? (
                    historyItems.slice(0, 5).map((item) => (
                      <Link
                        key={item.id}
                        href={`/results?id=${item.id}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/5"
                      >
                        <p className="truncate font-medium">
                          {item.query || "Untitled itinerary"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(item.created_at)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      No recent searches
                    </p>
                  )}
                  <Link
                    href="/history"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-primary underline underline-offset-4"
                  >
                    View all history
                  </Link>
                </CollapsibleContent>
              </Collapsible>

              <div className="my-3 h-px bg-primary/15" />

              <Link href="/about">
                <Button
                  variant={isActive("/about") ? "default" : "ghost"}
                  className="w-full justify-start rounded-full"
                  onClick={() => setMobileOpen(false)}
                >
                  <Info className="mr-2 h-5 w-5" />
                  About
                </Button>
              </Link>

              <Link href="/profile">
                <Button
                  variant={isActive("/profile") ? "default" : "ghost"}
                  className="w-full justify-start gap-2 rounded-full"
                  onClick={() => setMobileOpen(false)}
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="h-5 w-5 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="truncate">{profileLabel}</span>
                </Button>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, User } from "lucide-react";
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
import IconLogo from "@/app/assets/Icon Logo.png";
import FullLogo from "@/app/assets/Full Logo.png";

const primaryLinks = [
  { href: "/", label: "Discover", icon: Search },
  { href: "/saved", label: "Saved", icon: Heart },
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
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-primary/15 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex md:flex-1 justify-start">
          <LogoLink />
        </div>

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
        </nav>

        <div className="flex md:flex-1 justify-end items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="/profile"
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all hover:bg-primary/10",
                isActive("/profile")
                  ? "bg-primary text-primary-foreground"
                  : "text-primary/75"
              )}
            >
              <User className="h-4 w-4" />
              Profile
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
                  Main navigation links.
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

                <div className="my-3 h-px bg-primary/15" />

                <Link href="/profile">
                  <Button
                    variant={isActive("/profile") ? "default" : "ghost"}
                    className="w-full justify-start rounded-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="mr-2 h-5 w-5" />
                    Profile
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

"use client";

export const dynamic = "force-dynamic";

import { Calendar, Mail, User } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

const mockProfile = {
  name: "Demo Planner",
  email: "demo@vibeplan.local",
  memberSince: "May 18, 2026",
  planCount: 2,
};

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <MobileNav />

        <main className="container mx-auto max-w-4xl p-6 md:p-8">
          <div className="mb-8">
            <h1 className="mb-2 font-serif text-4xl italic md:text-5xl">
              Profile
            </h1>
            <p className="text-lg text-muted-foreground">
              Mock profile for local demo mode
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif italic">
                Demo Account
              </CardTitle>
              <CardDescription>
                Static profile details while backend services are being rebuilt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="flex h-20 w-20 items-center justify-center bg-primary text-2xl font-semibold text-primary-foreground">
                  DP
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold">{mockProfile.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Mock local account
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm">{mockProfile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Member Since
                    </p>
                    <p className="text-sm">{mockProfile.memberSince}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <User className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Saved Mock Itineraries
                    </p>
                    <p className="text-sm">{mockProfile.planCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

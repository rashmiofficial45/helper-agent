"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedIn, UserButton } from "@clerk/nextjs";

export function NavActions() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="hidden font-medium text-muted-foreground md:inline-block">
        Edit Oct 08
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Star />
      </Button>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}

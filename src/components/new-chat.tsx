"use client";

import * as React from "react";

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Plus } from "lucide-react";

export function NewPageChat() {
  return (
    <SidebarMenu className="flex flex-row items-center justify-between">
      <SidebarMenuItem>Menubar</SidebarMenuItem>
      <div className="flex flex-row items-center justify-center w-6 h-6 bg-transparent rounded-md hover:bg-muted">
        <Plus className="text-muted-foreground" />
      </div>
    </SidebarMenu>
  );
}

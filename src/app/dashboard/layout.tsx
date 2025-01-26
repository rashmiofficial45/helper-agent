"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { NavActions } from "@/components/nav-actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // State to handle the editable breadcrumb
  const [breadcrumbText, setBreadcrumbText] = useState(
    "Need to something regarding this"
  );
  const [isEditing, setIsEditing] = useState(false);

  // Function to handle double click to edit
  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  // Function to handle input blur (save changes)
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setBreadcrumbText(event.target.value);
    setIsEditing(false);
  };

  // Function to handle key press (Enter to save)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setBreadcrumbText(event.currentTarget.value);
      setIsEditing(false);
    }
  };

  return (
    <div>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {isEditing ? (
                      // Editable input field with mac-like behavior
                      <motion.input
                        className="min-w-96 font-semibold text-muted-foreground  cursor-text px-1 bg-transparent outline-none overflow-visible"
                        initial={{ opacity: 0.8, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        autoFocus
                        defaultValue={breadcrumbText}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                      />
                    ) : (
                      // Non-editable breadcrumb text
                      <motion.div
                        className="w-full line-clamp-1 cursor-pointer rounded-md px-1 flex-1"
                        onDoubleClick={handleDoubleClick}
                        initial={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <BreadcrumbPage className="font-semibold text-muted-foreground">
                          {breadcrumbText}
                        </BreadcrumbPage>
                      </motion.div>
                    )}
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-3">
              <NavActions />
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

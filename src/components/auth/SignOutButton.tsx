"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { AlertModal } from "@/components/ui/modal";

type SignOutButtonProps = {
  role: "ADMIN" | "STUDENT";
  collapsed?: boolean;
  compact?: boolean;
};

/**
 * Shared sign-out action.
 * Keeping confirmation here prevents the framework's default /api/auth/signout
 * page from replacing the application's visual language.
 */
export function SignOutButton({
  role,
  collapsed = false,
  compact = false,
}: SignOutButtonProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleConfirm = async () => {
    setSigningOut(true);
    await signOut({
      callbackUrl: role === "STUDENT" ? "/student/login" : "/admin/login",
    });
  };

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="glass-control w-9 h-9 rounded-xl border border-border bg-surface/70 text-muted hover:text-foreground flex items-center justify-center"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
        <AlertModal
          isOpen={open}
          onClose={() => !signingOut && setOpen(false)}
          onConfirm={handleConfirm}
          title="Signout"
          description="Are you sure you want to sign out?"
          confirmText="Sign out"
          cancelText="Cancel"
          loading={signingOut}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`glass-control flex items-center ${
          collapsed ? "justify-center" : "gap-3"
        } w-full px-3 py-2.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover font-medium text-[14px]`}
        aria-label="Sign out"
        title={collapsed ? "Sign out" : undefined}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        {!collapsed && <span>Sign out</span>}
      </button>

      <AlertModal
        isOpen={open}
        onClose={() => !signingOut && setOpen(false)}
        onConfirm={handleConfirm}
        title="Signout"
        description="Are you sure you want to sign out?"
        confirmText="Sign out"
        cancelText="Cancel"
        loading={signingOut}
      />
    </>
  );
}

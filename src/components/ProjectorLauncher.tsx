"use client"

import { QrCode } from "lucide-react"
import { useProjectorModal } from "@/components/projector/ProjectorContext"

export function ProjectorLauncher({ collapsed = false }: { collapsed?: boolean }) {
  const { openProjectorModal } = useProjectorModal()

  return (
    <button
      type="button"
      onClick={openProjectorModal}
      title="Launch Projector"
      className={`flex items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover font-medium text-[14px] transition-all duration-150 active:scale-[0.98] cursor-pointer ${
        collapsed
          ? "justify-center w-full p-2.5"
          : "space-x-3 w-full px-3 py-2"
      }`}
    >
      <QrCode className="w-4 h-4 text-primary shrink-0" />
      {!collapsed && <span className="truncate">Launch Projector</span>}
    </button>
  )
}

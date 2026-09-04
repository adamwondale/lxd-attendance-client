"use client"

import React, { createContext, useContext, useState } from "react"
import { ProjectorModal } from "./ProjectorModal"

interface ProjectorContextType {
  openProjectorModal: () => void
  closeProjectorModal: () => void
  isProjectorModalOpen: boolean
}

const ProjectorContext = createContext<ProjectorContextType>({
  openProjectorModal: () => {},
  closeProjectorModal: () => {},
  isProjectorModalOpen: false,
})

export function useProjectorModal() {
  return useContext(ProjectorContext)
}

export function ProjectorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ProjectorContext.Provider
      value={{
        openProjectorModal: () => setIsOpen(true),
        closeProjectorModal: () => setIsOpen(false),
        isProjectorModalOpen: isOpen,
      }}
    >
      {children}
      <ProjectorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </ProjectorContext.Provider>
  )
}

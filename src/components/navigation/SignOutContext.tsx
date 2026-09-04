"use client"

import React, { createContext, useContext, useState } from "react"
import { SignOutModal } from "./SignOutModal"

interface SignOutContextType {
  openSignOut: () => void
  closeSignOut: () => void
}

const SignOutContext = createContext<SignOutContextType>({
  openSignOut: () => {},
  closeSignOut: () => {},
})

export function useSignOutModal() {
  return useContext(SignOutContext)
}

export function SignOutProvider({
  children,
  isStudent = false,
}: {
  children: React.ReactNode
  isStudent?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SignOutContext.Provider
      value={{
        openSignOut: () => setIsOpen(true),
        closeSignOut: () => setIsOpen(false),
      }}
    >
      {children}
      <SignOutModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isStudent={isStudent}
      />
    </SignOutContext.Provider>
  )
}

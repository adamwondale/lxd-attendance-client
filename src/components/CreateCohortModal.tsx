"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CreateCohortModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="relative z-10 w-full max-w-md p-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Create Cohort</CardTitle>
                <p className="text-[13px] font-mono text-[var(--color-muted)] uppercase mt-1">
                  New System Entry
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[13px] font-mono uppercase text-[var(--color-muted)]">Cohort Name</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded-[var(--radius-none)] text-[14px]"
                    placeholder="e.g. Fall 2026 Graphics"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[13px] font-mono uppercase text-[var(--color-muted)]">Duration (Months)</label>
                    <input
                      type="number"
                      className="w-full h-10 px-3 border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded-[var(--radius-none)] text-[14px]"
                      placeholder="6"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[13px] font-mono uppercase text-[var(--color-muted)]">Late Penalty (ETB)</label>
                    <input
                      type="number"
                      className="w-full h-10 px-3 border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded-[var(--radius-none)] text-[14px]"
                      placeholder="25"
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end space-x-2">
                  <Button variant="ghost" onClick={onClose}>Cancel</Button>
                  <Button onClick={() => {
                    // TODO: trigger mutation
                    onClose()
                  }}>Initialize</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

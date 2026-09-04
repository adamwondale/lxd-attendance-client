"use client"

import { useState } from "react"
import { useQuery } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { QrCode, Loader2, Play, AlertCircle, ArrowUpRight } from "lucide-react"
import { Modal, ModalHeader, ModalBody } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

type ProjectorCohort = {
  id: string
  name: string
  sessions: Array<{ id: string; name: string }>
}
type ProjectorData = { publicActiveCohorts: ProjectorCohort[] }

const LIST_PUBLIC_COHORTS = gql`
  query ProjectorCohorts {
    publicActiveCohorts {
      id
      name
      sessions {
        id
        name
      }
    }
  }
`

interface ProjectorModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectorModal({ isOpen, onClose }: ProjectorModalProps) {
  const [activeSession, setActiveSession] = useState<{
    cohortId: string
    sessionId: string
    sessionName: string
  } | null>(null)

  const { data, loading } = useQuery<ProjectorData>(LIST_PUBLIC_COHORTS, {
    skip: !isOpen,
    fetchPolicy: "cache-and-network",
  })

  const handleSessionClick = (
    cohortId: string,
    sessionId: string,
    sessionName: string,
  ) => {
    const active = localStorage.getItem(`activeProjector_${sessionId}`)
    if (active) {
      setActiveSession({ cohortId, sessionId, sessionName })
    } else {
      handleLaunch(cohortId, sessionId, sessionName)
    }
  }

  const handleLaunch = (
    cohortId: string,
    sessionId: string,
    sessionName: string,
  ) => {
    const launchedAt = Date.now()
    localStorage.setItem(
      `activeProjector_${sessionId}`,
      JSON.stringify({ cohortId, sessionId, launchedAt, sessionName }),
    )
    window.open(
      `/scan/projector?cohortId=${cohortId}&sessionId=${sessionId}&launchedAt=${launchedAt}`,
      "_blank",
    )
    setActiveSession(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-lg">
      <ModalHeader
        title="Launch Projector"
        subtitle="Live QR Display"
        onClose={onClose}
      />
      <ModalBody className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        {activeSession ? (
          <div className="bg-danger-surface border border-danger/30 p-5 sm:p-6 rounded-2xl text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 border border-danger/20 text-danger flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground">
                Active Session Detected
              </h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                Session{" "}
                <strong className="text-foreground">
                  {activeSession.sessionName}
                </strong>{" "}
                is already active on a projector screen.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                type="button"
                variant="danger"
                onClick={() =>
                  handleLaunch(
                    activeSession.cohortId,
                    activeSession.sessionId,
                    activeSession.sessionName,
                  )
                }
                className="flex-1 justify-center rounded-xl h-11 text-xs font-mono uppercase tracking-wider shadow-sm active:scale-[0.98]"
              >
                Overwrite &amp; Launch New
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveSession(null)}
                className="justify-center rounded-xl h-11 text-xs font-mono uppercase tracking-wider active:scale-[0.98]"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-xs font-mono uppercase tracking-widest">
              Loading active cohorts...
            </p>
          </div>
        ) : data?.publicActiveCohorts?.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-border rounded-2xl text-muted space-y-2">
            <QrCode className="w-8 h-8 mx-auto opacity-40" />
            <p className="font-mono text-xs uppercase tracking-widest">
              No active cohorts found.
            </p>
            <p className="text-xs text-muted/70">
              Create a cohort and session first to launch attendance projector.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted font-sans">
              Select a session below to display the live QR code on the projector screen:
            </p>
            {data?.publicActiveCohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="rounded-2xl border border-border/80 bg-surface-subtle/50 p-4 space-y-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-medium text-[16px] text-foreground">
                    {cohort.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted bg-surface px-2 py-0.5 rounded-md border border-border/60">
                    {cohort.sessions.length}{" "}
                    {cohort.sessions.length === 1 ? "session" : "sessions"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {cohort.sessions.length === 0 ? (
                    <p className="text-xs text-muted font-mono italic px-1 py-1">
                      No sessions created for this cohort.
                    </p>
                  ) : (
                    cohort.sessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() =>
                          handleSessionClick(cohort.id, session.id, session.name)
                        }
                        className="group flex items-center justify-between px-3.5 py-3 text-sm text-foreground bg-surface border border-border/80 hover:border-primary/50 hover:bg-primary/5 hover:text-primary rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.99] shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                          </div>
                          <span className="font-medium text-[14px] truncate">
                            {session.name}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-muted group-hover:text-primary transition-colors flex items-center gap-1 shrink-0 ml-2">
                          Launch
                          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBody>
    </Modal>
  )
}

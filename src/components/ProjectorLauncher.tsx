"use client"

import { useState } from "react"
import { useQuery } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { QrCode, Loader2 } from "lucide-react"

type ProjectorCohort = { id: string; name: string; sessions: Array<{ id: string; name: string }> }
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

export function ProjectorLauncher({ collapsed = false }: { collapsed?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSession, setActiveSession] = useState<{ cohortId: string; sessionId: string; sessionName: string } | null>(null)

  const { data, loading } = useQuery<ProjectorData>(LIST_PUBLIC_COHORTS, {
    skip: !isOpen
  })

  const openLauncher = () => {
    setActiveSession(null)
    setIsOpen(true)
  }

  const handleSessionClick = (cohortId: string, sessionId: string, sessionName: string) => {
    const active = localStorage.getItem(`activeProjector_${sessionId}`)
    if (active) {
      setActiveSession({ cohortId, sessionId, sessionName })
    } else {
      handleLaunch(cohortId, sessionId, sessionName)
    }
  }

  const handleLaunch = (cohortId: string, sessionId: string, sessionName: string) => {
    const launchedAt = Date.now()
    localStorage.setItem(`activeProjector_${sessionId}`, JSON.stringify({ cohortId, sessionId, launchedAt, sessionName }))
    window.open(`/scan/projector?cohortId=${cohortId}&sessionId=${sessionId}&launchedAt=${launchedAt}`, '_blank')
    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={openLauncher}
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface/95 backdrop-blur-2xl border border-border/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border/70 flex justify-between items-center">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Launch Projector</h2>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-surface transition-colors text-xl font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {activeSession ? (
                <div className="bg-danger-surface border border-danger/30 p-5 rounded-xl text-center space-y-3">
                  <div className="font-semibold text-danger">Active Session Open</div>
                  <div className="text-sm text-muted-foreground">
                    Session <strong className="text-foreground">{activeSession.sessionName}</strong> is currently active on a projector.
                  </div>
                  <button 
                    onClick={() => handleLaunch(activeSession.cohortId!, activeSession.sessionId!, activeSession.sessionName)}
                    className="w-full bg-danger text-danger-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-danger/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                  >
                    Close older session and start new
                  </button>
                  <button 
                    onClick={() => setActiveSession(null)}
                    className="w-full border border-border/80 bg-surface px-4 py-2.5 rounded-xl text-sm text-foreground hover:bg-surface-hover active:scale-[0.98] transition-all font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : loading ? (
                <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : data?.publicActiveCohorts?.length === 0 ? (
                <div className="text-center text-muted-foreground font-mono text-xs py-4">No active cohorts found.</div>
              ) : (
                data?.publicActiveCohorts.map((cohort: any) => (
                  <div key={cohort.id} className="space-y-2">
                    <div className="font-medium text-sm text-foreground">{cohort.name}</div>
                    <div className="space-y-1 pl-3 border-l-2 border-border/80">
                      {cohort.sessions.map((session: any) => (
                        <button
                          key={session.id}
                          onClick={() => handleSessionClick(cohort.id, session.id, session.name)}
                          className="block w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                        >
                          Launch {session.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

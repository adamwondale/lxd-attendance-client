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

export function ProjectorLauncher() {
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
        onClick={openLauncher}
        className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-text hover:bg-black/5 font-medium text-[14px] transition-colors"
      >
        <QrCode className="w-4 h-4" />
        <span>Launch Projector</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h2 className="font-serif text-xl">Launch Projector</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-black font-bold px-2 py-1">&times;</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {activeSession ? (
                <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-center space-y-4">
                  <div className="font-medium text-red-800">You already have an open session!</div>
                  <div className="text-sm text-red-600">
                    Session <strong>{activeSession.sessionName}</strong> is currently active on a projector.
                  </div>
                  <button 
                    onClick={() => handleLaunch(activeSession.cohortId!, activeSession.sessionId!, activeSession.sessionName)}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium"
                  >
                    Close older session and start a new one
                  </button>
                  <button 
                    onClick={() => setActiveSession(null)}
                    className="w-full bg-transparent text-gray-600 border border-gray-300 px-4 py-2 rounded text-sm hover:bg-black/5 font-medium mt-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : loading ? (
                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : data?.publicActiveCohorts?.length === 0 ? (
                <div className="text-center text-gray-500 font-mono text-xs">No active cohorts found.</div>
              ) : (
                data?.publicActiveCohorts.map((cohort: any) => (
                  <div key={cohort.id} className="space-y-2">
                    <div className="font-medium text-sm">{cohort.name}</div>
                    <div className="space-y-1 pl-2 border-l-2 border-black/10">
                      {cohort.sessions.map((session: any) => (
                        <button
                          key={session.id}
                          onClick={() => handleSessionClick(cohort.id, session.id, session.name)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5 rounded"
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

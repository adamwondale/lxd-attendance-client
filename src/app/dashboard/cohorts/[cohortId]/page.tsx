"use client"

import { use, useState } from "react"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Modal, ModalHeader, ModalBody, ModalFooter, AlertModal } from "@/components/ui/modal"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

const COHORT_DETAILS = gql`
  query CohortDetails($id: String!) {
    cohortDetails(id: $id) {
      id
      name
      pin
      sessions {
        id
        name
        startTime
        gracePeriodMinutes
        recurrenceDays
        latePenaltyAmount
        escalationThresholdMinutes
        escalationRate
        escalationIntervalMinutes
      }
    }
  }
`

type CohortSessionData = {
  cohortDetails: { id: string; name: string; pin: string; sessions: Array<{ id: string; name: string; startTime: string; gracePeriodMinutes: number; recurrenceDays: string[]; latePenaltyAmount: number; escalationThresholdMinutes: number; escalationRate: number; escalationIntervalMinutes: number }> } | null
}

const CREATE_SESSION = gql`
  mutation CreateCohortSession($cohortId: String!, $name: String!, $startTime: String!, $gracePeriodMinutes: Int!, $recurrenceDays: [String!]!, $latePenaltyAmount: Int!, $escalationThresholdMinutes: Int, $escalationRate: Int, $escalationIntervalMinutes: Int) {
    createCohortSession(cohortId: $cohortId, name: $name, startTime: $startTime, gracePeriodMinutes: $gracePeriodMinutes, recurrenceDays: $recurrenceDays, latePenaltyAmount: $latePenaltyAmount, escalationThresholdMinutes: $escalationThresholdMinutes, escalationRate: $escalationRate, escalationIntervalMinutes: $escalationIntervalMinutes)
  }
`

const UPDATE_SESSION = gql`
  mutation UpdateCohortSession($sessionId: String!, $name: String, $startTime: String, $gracePeriodMinutes: Int, $recurrenceDays: [String!], $latePenaltyAmount: Int, $escalationThresholdMinutes: Int, $escalationRate: Int, $escalationIntervalMinutes: Int) {
    updateCohortSession(sessionId: $sessionId, name: $name, startTime: $startTime, gracePeriodMinutes: $gracePeriodMinutes, recurrenceDays: $recurrenceDays, latePenaltyAmount: $latePenaltyAmount, escalationThresholdMinutes: $escalationThresholdMinutes, escalationRate: $escalationRate, escalationIntervalMinutes: $escalationIntervalMinutes)
  }
`

const DELETE_SESSION = gql`
  mutation DeleteCohortSession($sessionId: String!) {
    deleteCohortSession(sessionId: $sessionId)
  }
`

export default function CohortDetailsPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const unwrappedParams = use(params)
  const { data: cohortData, loading: cohortLoading, refetch } = useQuery<CohortSessionData>(COHORT_DETAILS, { 
    variables: { id: unwrappedParams.cohortId },
    fetchPolicy: "cache-and-network"
  })

  const [createSession, { loading: creating }] = useMutation(CREATE_SESSION)
  const [updateSession, { loading: updating }] = useMutation(UPDATE_SESSION)
  const [deleteSession, { loading: deleting }] = useMutation(DELETE_SESSION)

  const [editingSession, setEditingSession] = useState<any>(null)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [lateTime, setLateTime] = useState("09:15")
  const [latePenaltyAmount, setLatePenaltyAmount] = useState(25)
  const [escalationThresholdMinutes, setEscalationThresholdMinutes] = useState(15)
  const [escalationRate, setEscalationRate] = useState(5)
  const [escalationIntervalMinutes, setEscalationIntervalMinutes] = useState(5)
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(['EVERYDAY'])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sessionPage, setSessionPage] = useState(1)
  const SESSION_PAGE_SIZE = 7

  const openEdit = (session: any) => {
    setEditingSession(session)
    setSessionName(session.name)
    setStartTime(session.startTime)
    const [h, m] = session.startTime.split(':').map(Number)
    const totalM = h * 60 + m + session.gracePeriodMinutes
    const lateH = Math.floor(totalM / 60) % 24
    const lateM = totalM % 60
    setLateTime(`${lateH.toString().padStart(2, '0')}:${lateM.toString().padStart(2, '0')}`)
    setLatePenaltyAmount(session.latePenaltyAmount ?? 25)
    setEscalationThresholdMinutes(session.escalationThresholdMinutes ?? 15)
    setEscalationRate(session.escalationRate ?? 5)
    setEscalationIntervalMinutes(session.escalationIntervalMinutes ?? 5)
    setRecurrenceDays(session.recurrenceDays || ['EVERYDAY'])
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingSession(null)
    setSessionName("")
    setStartTime("09:00")
    setLateTime("09:15")
    setLatePenaltyAmount(25)
    setEscalationThresholdMinutes(15)
    setEscalationRate(5)
    setEscalationIntervalMinutes(5)
    setRecurrenceDays(['EVERYDAY'])
  }

  const handleDelete = async () => {
    if (!deletingSessionId) return;
    try {
      await deleteSession({ variables: { sessionId: deletingSessionId } })
      toast.success("Session deleted successfully")
      setDeletingSessionId(null)
      refetch()
    } catch (e: any) {
      toast.error("Failed to delete: " + e.message)
    }
  }

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calculate grace period from start time and late time
    const [startH, startM] = startTime.split(':').map(Number)
    const [lateH, lateM] = lateTime.split(':').map(Number)
    const startTotal = startH * 60 + startM
    const lateTotal = lateH * 60 + lateM
    let gracePeriodMinutes = lateTotal - startTotal
    
    // Handle overnight wrap-around just in case
    if (gracePeriodMinutes < 0) {
      gracePeriodMinutes += 24 * 60
    }

    try {
      if (editingSession) {
        await updateSession({
          variables: {
            sessionId: editingSession.id,
            name: sessionName,
            startTime: startTime,
            gracePeriodMinutes: gracePeriodMinutes,
            recurrenceDays: recurrenceDays,
            latePenaltyAmount: latePenaltyAmount,
            escalationThresholdMinutes,
            escalationRate,
            escalationIntervalMinutes,
          }
        })
      } else {
        await createSession({
          variables: {
            cohortId: unwrappedParams.cohortId,
            name: sessionName,
            startTime: startTime,
            gracePeriodMinutes: gracePeriodMinutes,
            recurrenceDays: recurrenceDays,
            latePenaltyAmount: latePenaltyAmount,
            escalationThresholdMinutes,
            escalationRate,
            escalationIntervalMinutes,
          }
        })
      }
      closeDialog()
      refetch()
      toast.success(editingSession ? "Session updated" : "Session created")
    } catch (error: any) {
      toast.error(`Failed to save session: ${error.message}`)
    }
  }

  if (cohortLoading) return <div className="p-10">Loading cohort details...</div>

  const cohort = cohortData?.cohortDetails
  const sessions = cohort?.sessions || []
  const sessionTotalPages = Math.max(1, Math.ceil(sessions.length / SESSION_PAGE_SIZE))
  const safeSessionPage = Math.min(sessionPage, sessionTotalPages)
  const pagedSessions = sessions.slice((safeSessionPage - 1) * SESSION_PAGE_SIZE, safeSessionPage * SESSION_PAGE_SIZE)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-8 relative">
      <div className="mb-4">
        <Link href="/dashboard/cohorts" className="text-sm font-mono uppercase tracking-widest text-[#878786] hover:text-black flex items-center gap-2 transition-all duration-300 hover:-translate-x-0.5">
          <ArrowLeft className="w-4 h-4" /> Back to Cohorts
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 break-words max-w-[200px] sm:max-w-none">{cohort?.name}</h1>
          <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase">
            PIN: {cohort?.pin}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Link
            href={`/scan/projector?cohortId=${unwrappedParams.cohortId}${sessions[0]?.id ? `&sessionId=${sessions[0].id}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto bg-white border border-gray-200 text-black hover:bg-gray-50 flex items-center justify-center gap-2">
              Launch Projector
            </Button>
          </Link>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto bg-black text-white hover:bg-black/80 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> New Session
          </Button>

          <Modal isOpen={isDialogOpen} onClose={closeDialog} className="sm:max-w-2xl">
            <ModalHeader title={editingSession ? "Edit Session" : "Create Session"} subtitle="Session Configuration" onClose={closeDialog} />
            <ModalBody>
              <form id="session-form" onSubmit={handleSaveSession} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Session Name</label>
                  <input 
                    id="name"
                    type="text"
                    value={sessionName}
                    onChange={(e: any) => setSessionName(e.target.value)}
                    placeholder="e.g. Day 1: React Basics" 
                    required 
                    className="flex h-11 w-full border border-[#E5E5E4] bg-[#F9F9F8] px-3 py-2 text-[14px] font-sans placeholder:text-[#878786]/50 focus:border-[#0A0A0A] outline-none transition-colors rounded-xl"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="startTime" className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Start Time</label>
                    <input 
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e: any) => setStartTime(e.target.value)}
                      required 
                      className="flex h-11 w-full border border-[#E5E5E4] bg-[#F9F9F8] px-3 py-2 text-[14px] font-sans focus:border-[#0A0A0A] outline-none transition-colors rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lateTime" className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Late Time</label>
                    <input 
                      id="lateTime"
                      type="time"
                      value={lateTime}
                      onChange={(e: any) => setLateTime(e.target.value)}
                      required 
                      className="flex h-11 w-full border border-[#E5E5E4] bg-[#F9F9F8] px-3 py-2 text-[14px] font-sans focus:border-[#0A0A0A] outline-none transition-colors rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="penalty" className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Late Penalty Amount (ETB)</label>
                  <input 
                    id="penalty"
                    type="number"
                    min="0"
                    value={latePenaltyAmount}
                    onChange={(e: any) => setLatePenaltyAmount(parseInt(e.target.value))}
                    required 
                    className="flex h-11 w-full border border-[#E5E5E4] bg-[#F9F9F8] px-3 py-2 text-[14px] font-sans focus:border-[#0A0A0A] outline-none transition-colors rounded-xl"
                  />
                  <p className="text-[11px] text-[#878786] font-mono uppercase tracking-wide">Scans after the late time will automatically receive the cohort's penalty.</p>
                </div>
                
                <div className="pt-4 border-t border-[#E5E5E4]">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#878786] mb-4">Escalation Policy</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <label className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#878786]">Threshold (min)</span>
                      <input type="number" min="0" value={escalationThresholdMinutes} onChange={e=>setEscalationThresholdMinutes(Number(e.target.value))} className="h-11 w-full border border-[#E5E5E4] bg-[#F9F9F8] px-3 text-[14px] font-sans focus:border-[#0A0A0A] outline-none transition-colors rounded-xl" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#878786]">+ ETB</span>
                      <input type="number" min="0" value={escalationRate} onChange={e=>setEscalationRate(Number(e.target.value))} className="h-11 w-full border border-[#E5E5E4] bg-[#F9F9F8] px-3 text-[14px] font-sans focus:border-[#0A0A0A] outline-none transition-colors rounded-xl" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#878786]">Every (min)</span>
                      <input type="number" min="1" value={escalationIntervalMinutes} onChange={e=>setEscalationIntervalMinutes(Number(e.target.value))} className="h-11 w-full border border-[#E5E5E4] bg-[#F9F9F8] px-3 text-[14px] font-sans focus:border-[#0A0A0A] outline-none transition-colors rounded-xl" />
                    </label>
                  </div>
                  <p className="text-[11px] text-[#878786] font-mono uppercase tracking-wide mt-2">After the threshold, penalty increases by rate for each interval.</p>
                </div>

                <div className="pt-4 border-t border-[#E5E5E4] space-y-2">
                  <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Recurrence</label>
                  <div className="flex flex-wrap gap-2">
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => (
                      <label key={day} className={`flex items-center justify-center h-10 px-3 text-[11px] font-mono uppercase tracking-widest border cursor-pointer transition-colors ${recurrenceDays.includes(day) || recurrenceDays.includes('EVERYDAY') ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-[#F9F9F8] border-[#E5E5E4] text-[#878786] hover:bg-white'}`}>
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={recurrenceDays.includes(day) || recurrenceDays.includes('EVERYDAY')}
                          onChange={(e) => {
                            if (recurrenceDays.includes('EVERYDAY')) {
                              setRecurrenceDays([day]);
                            } else {
                              if (e.target.checked) setRecurrenceDays([...recurrenceDays, day]);
                              else setRecurrenceDays(recurrenceDays.filter(d => d !== day));
                            }
                          }}
                        />
                        {day.slice(0, 3)}
                      </label>
                    ))}
                    <label className={`flex items-center justify-center h-10 px-3 text-[11px] font-mono uppercase tracking-widest border cursor-pointer transition-colors font-bold ${recurrenceDays.includes('EVERYDAY') ? 'bg-[#E54D2E] text-white border-[#E54D2E]' : 'bg-[#F9F9F8] border-[#E5E5E4] text-[#878786] hover:bg-white'}`}>
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={recurrenceDays.includes('EVERYDAY')}
                        onChange={(e) => {
                          if (e.target.checked) setRecurrenceDays(['EVERYDAY']);
                          else setRecurrenceDays([]);
                        }}
                      />
                      ALL
                    </label>
                  </div>
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <button type="button" onClick={closeDialog} className="hidden sm:block flex-1 sm:flex-none h-14 px-6 border border-[#E5E5E4] bg-white text-[#0A0A0A] font-mono text-[13px] uppercase tracking-widest hover:bg-[#F9F9F8] transition-colors rounded-xl order-2 sm:order-1">Cancel</button>
              <button type="submit" form="session-form" disabled={creating || updating} className="flex-1 sm:flex-auto h-14 px-6 bg-[#0A0A0A] text-white font-mono text-[13px] uppercase tracking-widest hover:bg-[#1C1C1C] disabled:opacity-50 transition-colors rounded-xl flex items-center justify-center gap-2 order-1 sm:order-2">
                {(creating || updating) ? "Saving..." : "Save Session"}
              </button>
            </ModalFooter>
          </Modal>
        </div>
      </div>

      <AlertModal
        isOpen={!!deletingSessionId}
        onClose={() => setDeletingSessionId(null)}
        onConfirm={handleDelete}
        title="Delete Session"
        description="Are you sure you want to delete this session? This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
      />

      <div className="rounded-2xl border border-[#E5E5E4] bg-white overflow-hidden">
      <Table>
        <TableHeader className="hidden sm:table-header-group">
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedSessions.map((session: any) => {
            const [h, m] = session.startTime.split(':').map(Number)
            const totalM = h * 60 + m + session.gracePeriodMinutes
            const lateH = Math.floor(totalM / 60) % 24
            const lateM = totalM % 60
            const lateTimeStr = `${lateH.toString().padStart(2, '0')}:${lateM.toString().padStart(2, '0')}`

            return (
              <TableRow key={session.id}>
                <TableCell>
                  <Link href={`/dashboard/cohorts/${unwrappedParams.cohortId}/sessions/${session.id}`} className="font-medium hover:underline text-[15px]">
                    {session.name}
                  </Link>
                  <div className="sm:hidden text-[13px] text-black/50 flex flex-wrap items-center gap-2 mt-1">
                    <span>{session.startTime} (Late: {lateTimeStr})</span>
                    <span className="text-[var(--color-accent)] font-mono">{session.latePenaltyAmount} ETB</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="text-[14px] text-black/70 flex items-center gap-2">
                    <span>{session.startTime} (Late: {lateTimeStr})</span>
                    <span className="text-[var(--color-accent)] text-xs font-mono">{session.latePenaltyAmount} ETB</span>
                  </div>
                </TableCell>
                <TableCell className="text-right flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(session)} className="h-8">Edit</Button>
                  <Button variant="outline" size="sm" className="h-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => setDeletingSessionId(session.id)}>Delete</Button>
                  <Link
                    href={`/scan/projector?cohortId=${unwrappedParams.cohortId}&sessionId=${session.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="h-8">Projector</Button>
                  </Link>
                  <Link href={`/dashboard/cohorts/${unwrappedParams.cohortId}/sessions/${session.id}`}>
                    <Button variant="outline" size="sm" className="h-8">Live View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center p-8 text-[var(--color-muted)] font-mono text-[13px] uppercase">
                No sessions created yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
      {sessions.length > SESSION_PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#E5E5E4] bg-white px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#878786]">Page {safeSessionPage} of {sessionTotalPages} · {sessions.length} sessions</span>
          <div className="flex items-center gap-2">
            <button aria-label="Previous sessions page" disabled={safeSessionPage === 1} onClick={() => setSessionPage((p) => Math.max(1, p - 1))} className="h-9 w-9 rounded-xl border border-[#E5E5E4] hover:bg-[#F9F9F8] disabled:opacity-30 transition-all">‹</button>
            <button aria-label="Next sessions page" disabled={safeSessionPage === sessionTotalPages} onClick={() => setSessionPage((p) => Math.min(sessionTotalPages, p + 1))} className="h-9 w-9 rounded-xl border border-[#E5E5E4] hover:bg-[#F9F9F8] disabled:opacity-30 transition-all">›</button>
          </div>
        </div>
      )}
    </div>
  )
}

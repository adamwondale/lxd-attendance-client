"use client"

import { use, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

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
  const { data: cohortData, loading: cohortLoading, refetch } = useQuery(COHORT_DETAILS, { 
    variables: { id: unwrappedParams.cohortId },
    fetchPolicy: "network-only"
  })

  const [createSession, { loading: creating }] = useMutation(CREATE_SESSION)
  const [updateSession, { loading: updating }] = useMutation(UPDATE_SESSION)
  const [deleteSession] = useMutation(DELETE_SESSION)

  const [editingSession, setEditingSession] = useState<any>(null)
  const [sessionName, setSessionName] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [lateTime, setLateTime] = useState("09:15")
  const [latePenaltyAmount, setLatePenaltyAmount] = useState(25)
  const [escalationThresholdMinutes, setEscalationThresholdMinutes] = useState(15)
  const [escalationRate, setEscalationRate] = useState(5)
  const [escalationIntervalMinutes, setEscalationIntervalMinutes] = useState(5)
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(['EVERYDAY'])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

  const handleDelete = async (sessionId: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteSession({ variables: { sessionId } })
        refetch()
      } catch (e: any) {
        alert("Failed to delete: " + e.message)
      }
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
    } catch (error: any) {
      alert(`Failed to save session: ${error.message}`)
    }
  }

  if (cohortLoading) return <div className="p-10">Loading cohort details...</div>

  const cohort = cohortData?.cohortDetails
  const sessions = cohort?.sessions || []

  return (
    <div className="p-10 space-y-8 relative">
      <div className="mb-4">
        <Link href="/dashboard/cohorts" className="text-sm font-mono uppercase tracking-widest text-[#878786] hover:text-black flex items-center gap-2">
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
          <Link href={`/scan/projector?cohortId=${unwrappedParams.cohortId}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-white border border-gray-200 text-black hover:bg-gray-50 flex items-center justify-center gap-2">
              Launch Projector
            </Button>
          </Link>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto bg-black text-white hover:bg-black/80 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> New Session
          </Button>

          {isDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-serif text-2xl">{editingSession ? "Edit Session" : "Create Session"}</h2>
                  <button onClick={closeDialog} className="text-gray-500 hover:text-black">
                    &times;
                  </button>
                </div>
                <form onSubmit={handleSaveSession} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-mono uppercase text-[#878786]">Session Name</label>
                    <input 
                      id="name"
                      type="text"
                      value={sessionName}
                      onChange={(e: any) => setSessionName(e.target.value)}
                      placeholder="e.g. Day 1: React Basics" 
                      required 
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="startTime" className="text-sm font-mono uppercase text-[#878786]">Start Time</label>
                      <input 
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e: any) => setStartTime(e.target.value)}
                        required 
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lateTime" className="text-sm font-mono uppercase text-[#878786]">Late Time</label>
                      <input 
                        id="lateTime"
                        type="time"
                        value={lateTime}
                        onChange={(e: any) => setLateTime(e.target.value)}
                        required 
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="penalty" className="text-sm font-mono uppercase text-[#878786]">Late Penalty Amount (ETB)</label>
                    <input 
                      id="penalty"
                      type="number"
                      min="0"
                      value={latePenaltyAmount}
                      onChange={(e: any) => setLatePenaltyAmount(parseInt(e.target.value))}
                      required 
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="space-y-2"><span className="text-[10px] font-mono uppercase text-[#878786]">Threshold</span><input type="number" min="0" value={escalationThresholdMinutes} onChange={e=>setEscalationThresholdMinutes(Number(e.target.value))} className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm" /></label>
                    <label className="space-y-2"><span className="text-[10px] font-mono uppercase text-[#878786]">+ ETB</span><input type="number" min="0" value={escalationRate} onChange={e=>setEscalationRate(Number(e.target.value))} className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm" /></label>
                    <label className="space-y-2"><span className="text-[10px] font-mono uppercase text-[#878786]">Every min</span><input type="number" min="1" value={escalationIntervalMinutes} onChange={e=>setEscalationIntervalMinutes(Number(e.target.value))} className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm" /></label>
                  </div>
                  <p className="text-xs text-black/45">After the threshold, the penalty increases by the configured amount for each interval.</p>
                  <div className="space-y-2">
                    <label className="text-sm font-mono uppercase text-[#878786]">Recurrence</label>
                    <div className="flex flex-wrap gap-2">
                      {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => (
                        <label key={day} className="flex items-center gap-2 text-sm border p-2 rounded hover:bg-gray-50 cursor-pointer">
                          <input 
                            type="checkbox"
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
                      <label className="flex items-center gap-2 text-sm border p-2 rounded hover:bg-gray-50 cursor-pointer font-bold">
                        <input 
                          type="checkbox"
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
                  <p className="text-xs text-muted-foreground">Scans after the late time will automatically receive the cohort's penalty.</p>
                  <Button type="submit" disabled={creating || updating} className="w-full bg-black text-white hover:bg-black/80">
                    {creating || updating ? "Saving..." : "Save Session"}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-[var(--color-border)] hidden sm:block">
          <div className="grid grid-cols-4 text-[13px] font-mono text-[var(--color-muted)] uppercase items-center">
            <div className="col-span-2">Session</div>
            <div>Time</div>
            <div className="text-right">Actions</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-[var(--color-border)]">
            <AnimatePresence initial={false}>
              {sessions.map((session: any) => {
                // calculate late time string for display
                const [h, m] = session.startTime.split(':').map(Number)
                const totalM = h * 60 + m + session.gracePeriodMinutes
                const lateH = Math.floor(totalM / 60) % 24
                const lateM = totalM % 60
                const lateTimeStr = `${lateH.toString().padStart(2, '0')}:${lateM.toString().padStart(2, '0')}`

                return (
                  <motion.li
                    key={session.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-4 p-4 items-start sm:items-center gap-4 sm:gap-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
                      <Link href={`/dashboard/cohorts/${unwrappedParams.cohortId}/sessions/${session.id}`} className="font-medium hover:underline text-lg sm:text-base">
                        {session.name}
                      </Link>
                      <div className="sm:hidden text-sm text-gray-500 flex flex-wrap items-center gap-2">
                        <span>{session.startTime} (Late: {lateTimeStr})</span>
                        <span className="text-[#E54D2E] text-xs font-mono">{session.latePenaltyAmount} ETB</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex text-sm text-gray-500 items-center gap-2">
                      <span>{session.startTime} (Late: {lateTimeStr})</span>
                      <span className="text-[#E54D2E] text-xs font-mono">{session.latePenaltyAmount} ETB</span>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end w-full sm:w-auto">
                      <Button variant="outline" size="sm" onClick={() => openEdit(session)} className="flex-1 sm:flex-none">Edit</Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(session.id)}>Delete</Button>
                      <Link href={`/dashboard/cohorts/${unwrappedParams.cohortId}/sessions/${session.id}`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">Live View</Button>
                      </Link>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
            {sessions.length === 0 && (
              <li className="p-8 text-center text-[var(--color-muted)] font-mono text-[13px] uppercase">
                No sessions created yet
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

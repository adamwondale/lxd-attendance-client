"use client"

import { useState } from "react"
import { useQuery, useMutation, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Loader2, ArrowRight, X, Users, Search } from "lucide-react"
import { toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"

const MY_COHORTS = gql`
  query MyCohorts {
    myCohorts {
      id
      name
      startDate
      durationMonths
      isActive
    }
  }
`

const AVAILABLE_COHORTS = gql`
  query AvailableCohorts {
    availableCohorts {
      id
      name
      startDate
      durationMonths
      isActive
    }
  }
`

const JOIN_COHORT = gql`
  mutation JoinCohort($cohortId: String!, $pin: String!) {
    joinCohort(cohortId: $cohortId, pin: $pin)
  }
`

const ON_COHORTS_UPDATED = gql`
  subscription OnCohortsUpdated {
    onCohortsUpdated
  }
`

export default function StudentCohortsPage() {
  const { data: myCohortsData, loading: myCohortsLoading, refetch: refetchMyCohorts } = useQuery<{ myCohorts: any[] }>(MY_COHORTS, { fetchPolicy: "network-only" })
  const { data: availableCohortsData, loading: availableCohortsLoading, refetch: refetchAvailableCohorts } = useQuery<{ availableCohorts: any[] }>(AVAILABLE_COHORTS, { fetchPolicy: "network-only" })
  
  useSubscription(ON_COHORTS_UPDATED, {
    onData: () => {
      refetchMyCohorts()
      refetchAvailableCohorts()
    }
  })
  
  const [joinCohort, { loading: joining }] = useMutation(JOIN_COHORT)
  
  const [joiningCohort, setJoiningCohort] = useState<any>(null)
  const [pin, setPin] = useState("")

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joiningCohort) return

    try {
      await joinCohort({ variables: { cohortId: joiningCohort.id, pin } })
      toast.success(`Successfully joined ${joiningCohort.name}!`)
      setJoiningCohort(null)
      setPin("")
      refetchMyCohorts()
      refetchAvailableCohorts()
    } catch (err: any) {
      toast.error(err.message || "Failed to join cohort. Check your PIN.")
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-8">

      {/* Header Area */}
      <div>
        <h2 className="font-serif text-2xl tracking-tight mb-1">Your Classes</h2>
        <p className="text-[14px] text-[var(--color-muted)] font-sans">Manage your enrollments and discover new cohorts.</p>
      </div>

      {/* My Cohorts */}
      <section className="space-y-3">
        <h3 className="font-sans font-medium text-[15px] px-1 flex items-center gap-2">
          <Users className="w-4 h-4 text-black/50" />
          Enrolled Cohorts
        </h3>
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          {myCohortsLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[var(--color-muted)]" /></div>
          ) : myCohortsData?.myCohorts?.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {myCohortsData.myCohorts.map((cohort: any) => (
                <li key={cohort.id} className="p-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors">
                  <div>
                    <h4 className="font-medium text-[15px]">{cohort.name}</h4>
                    <p className="text-[13px] text-[var(--color-muted)] mt-0.5">Started: {new Date(cohort.startDate).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                    Active
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-black/20" />
              </div>
              <p className="text-[14px] text-black/60">Not enrolled in any cohorts.</p>
            </div>
          )}
        </div>
      </section>

      {/* Available Cohorts */}
      <section className="space-y-3">
        <h3 className="font-sans font-medium text-[15px] px-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-black/50" />
          Available to Join
        </h3>
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          {availableCohortsLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[var(--color-muted)]" /></div>
          ) : availableCohortsData?.availableCohorts?.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {availableCohortsData.availableCohorts.map((cohort: any) => (
                <li key={cohort.id} className="p-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors group">
                  <div>
                    <h4 className="font-medium text-[15px]">{cohort.name}</h4>
                    <p className="text-[13px] text-[var(--color-muted)] mt-0.5">{cohort.durationMonths} Months Duration</p>
                  </div>
                  <button 
                    onClick={() => setJoiningCohort(cohort)}
                    className="h-8 px-4 rounded-full bg-black text-white text-[12px] font-medium flex items-center gap-1 active:scale-95 transition-transform"
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-[var(--color-muted)] text-[14px]">No new cohorts available at the moment.</div>
          )}
        </div>
      </section>

      {/* Join Cohort Modal */}
      <AnimatePresence>
        {joiningCohort && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setJoiningCohort(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-md p-6 shadow-2xl rounded-t-3xl sm:rounded-2xl border border-black/5 pb-10 sm:pb-6"
            >
              <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-6 sm:hidden" />

              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl">Join Cohort</h2>
                <button onClick={() => setJoiningCohort(null)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 hover:text-black">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-[14px] text-[var(--color-muted)] leading-relaxed">
                  You are about to join <strong className="text-black">{joiningCohort.name}</strong>. Please enter the secure PIN provided by your instructor.
                </p>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-mono uppercase tracking-widest text-black/50">Secure PIN</label>
                  <input 
                    type="password" 
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter PIN"
                    className="w-full h-14 px-4 text-lg border border-black/10 rounded-xl focus:border-black outline-none transition-colors text-center tracking-widest"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={joining || !pin}
                  className="w-full h-14 text-[15px] font-medium bg-black text-white hover:bg-black/90 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Join"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

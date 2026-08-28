"use client"

import { useState } from "react"
import { useQuery, useMutation, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

const LIST_COHORTS = gql`
  query ListCohorts {
    listCohorts {
      id
      name
      pin
      durationMonths
      latePenaltyAmount
      isActive
    }
  }
`

const CREATE_COHORT = gql`
  mutation CreateCohort($name: String!, $pin: String!, $durationMonths: Int!, $latePenaltyAmount: Int!) {
    createCohort(name: $name, pin: $pin, durationMonths: $durationMonths, latePenaltyAmount: $latePenaltyAmount)
  }
`

const ON_COHORTS_UPDATED = gql`
  subscription OnCohortsUpdated {
    onCohortsUpdated
  }
`

export default function CohortsPage() {
  const { data, loading, refetch } = useQuery(LIST_COHORTS)
  const [createCohort, { loading: creating }] = useMutation(CREATE_COHORT)
  
  useSubscription(ON_COHORTS_UPDATED, { onData: () => refetch() })
  
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ name: "", pin: "", durationMonths: "3", latePenaltyAmount: "50" })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCohort({
        variables: {
          name: formData.name,
          pin: formData.pin,
          durationMonths: parseInt(formData.durationMonths),
          latePenaltyAmount: parseInt(formData.latePenaltyAmount)
        }
      })
      toast.success("Cohort created successfully")
      setIsCreating(false)
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Failed to create cohort")
    }
  }

  return (
    <div className="p-10 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl mb-2">Cohorts</h1>
          <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase">
            Manage training programs
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? "Cancel" : "+ New Cohort"}
        </Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mb-8 border-black">
              <CardHeader className="bg-[var(--color-background)] border-b border-[var(--color-border)]">
                <CardTitle className="font-mono text-sm uppercase tracking-widest">Create New Cohort</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px]" placeholder="e.g. Summer 2026 Batch" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Join PIN</label>
                    <input required type="text" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px]" placeholder="e.g. LXD-26" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Duration (Months)</label>
                    <input required type="number" min="1" value={formData.durationMonths} onChange={e => setFormData({...formData, durationMonths: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Late Penalty (ETB)</label>
                    <input required type="number" min="0" value={formData.latePenaltyAmount} onChange={e => setFormData({...formData, latePenaltyAmount: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px]" />
                  </div>
                  <div className="col-span-2 pt-2 flex justify-end">
                    <Button type="submit" disabled={creating} className="bg-black text-white hover:bg-black/80">
                      {creating ? "Creating..." : "Save Cohort"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full h-32 animate-pulse bg-black/5 rounded-md" />
        ) : data?.listCohorts?.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed border-[var(--color-border)] text-[var(--color-muted)] font-mono text-[13px] uppercase">
            No cohorts found. Create one above.
          </div>
        ) : (
          data?.listCohorts?.map((cohort: any) => (
            <Link key={cohort.id} href={`/dashboard/cohorts/${cohort.id}`} className="block">
              <Card className="group hover:border-black transition-colors cursor-pointer relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${cohort.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl tracking-tight pr-4">{cohort.name}</CardTitle>
                  <p className="font-mono text-[11px] uppercase text-[#878786]">PIN: {cohort.pin}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#878786]">{cohort.durationMonths} Months</span>
                    <span className="font-mono text-[#E54D2E]">{cohort.latePenaltyAmount} ETB Penalty</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useQuery, useMutation, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"

const LIST_COHORTS = gql`
  query ListCohorts {
    listCohorts {
      id
      name
      pin
      startDate
      endDate
      isActive
      durationMonths
    }
  }
`

const CREATE_COHORT = gql`
  mutation CreateCohort($name: String!, $pin: String!, $startDate: String!, $endDate: String!, $durationMonths: Int) {
    createCohort(name: $name, pin: $pin, startDate: $startDate, endDate: $endDate, durationMonths: $durationMonths)
  }
`

const UPDATE_COHORT = gql`
  mutation UpdateCohort($id: String!, $name: String, $pin: String, $startDate: String, $endDate: String, $isActive: Boolean, $durationMonths: Int) {
    updateCohort(cohortId: $id, name: $name, pin: $pin, startDate: $startDate, endDate: $endDate, isActive: $isActive, durationMonths: $durationMonths)
  }
`

const DELETE_COHORT = gql`
  mutation DeleteCohort($id: String!) {
    deleteCohort(cohortId: $id)
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
  const [updateCohort, { loading: updating }] = useMutation(UPDATE_COHORT)
  const [deleteCohort, { loading: deleting }] = useMutation(DELETE_COHORT)
  
  useSubscription(ON_COHORTS_UPDATED, { onData: () => refetch() })
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCohort, setEditingCohort] = useState<any>(null)
  
  const [formData, setFormData] = useState({ 
    name: "", 
    pin: "", 
    startDate: "", 
    endDate: "",
    isActive: true,
    durationMonths: 3
  })

  const openCreateDialog = () => {
    setEditingCohort(null)
    setFormData({ name: "", pin: "", startDate: "", endDate: "", isActive: true })
    setIsDialogOpen(true)
  }

  const openEditDialog = (cohort: any) => {
    setEditingCohort(cohort)
    setFormData({ 
      name: cohort.name, 
      pin: cohort.pin, 
      startDate: new Date(cohort.startDate).toISOString().split('T')[0], 
      endDate: new Date(cohort.endDate).toISOString().split('T')[0],
      isActive: cohort.isActive,
      durationMonths: cohort.durationMonths || 3
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCohort) {
        await updateCohort({
          variables: {
            id: editingCohort.id,
            name: formData.name,
            pin: formData.pin,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            isActive: formData.isActive,
            durationMonths: Number(formData.durationMonths)
          }
        })
        toast.success("Cohort updated successfully")
      } else {
        await createCohort({
          variables: {
            name: formData.name,
            pin: formData.pin,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            durationMonths: Number(formData.durationMonths)
          }
        })
        toast.success("Cohort created successfully")
      }
      setIsDialogOpen(false)
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Failed to save cohort")
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    if (!confirm("Are you sure you want to delete (deactivate) this cohort?")) return;
    try {
      await deleteCohort({ variables: { id } })
      toast.success("Cohort deactivated successfully")
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete cohort")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
        <Button onClick={() => setIsDialogOpen(!isDialogOpen)}>
          {isDialogOpen ? "Cancel" : "+ New Cohort"}
        </Button>
      </div>

      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mb-8 border-black">
              <CardHeader className="bg-[var(--color-background)] border-b border-[var(--color-border)]">
                <CardTitle className="font-mono text-sm uppercase tracking-widest">
                  {editingCohort ? 'Edit Cohort' : 'Create New Cohort'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px]" placeholder="e.g. Summer 2026 Batch" />
                  </div>
                  
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Join PIN</label>
                    <input required type="text" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px]" placeholder="e.g. LXD-26" />
                    <select value={formData.durationMonths} onChange={e => setFormData({...formData, durationMonths: Number(e.target.value)})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px]"><option value={3}>3 months</option><option value={6}>6 months</option></select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Start Date</label>
                    <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px]" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">End Date</label>
                    <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-black outline-none font-sans text-[14px]" />
                  </div>

                  {editingCohort && (
                     <div className="flex items-center gap-2 md:col-span-2 mt-2">
                        <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4" />
                        <label htmlFor="isActive" className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Cohort is Active</label>
                     </div>
                  )}

                  <div className="md:col-span-2 mt-4">
                    <Button type="submit" disabled={creating || updating} className="w-full h-11 bg-black text-white hover:bg-black/80 font-sans text-[15px]">
                      {creating || updating ? "Saving..." : (editingCohort ? "Update Cohort" : "Create Cohort")}
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
              <Card className={`group hover:border-black transition-colors cursor-pointer relative overflow-hidden h-full ${!cohort.isActive ? 'opacity-50' : ''}`}>
                <div className="absolute top-0 right-0 p-3 flex gap-2">
                  <span className={`w-2 h-2 rounded-full inline-block ${cohort.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl tracking-tight pr-4">{cohort.name}</CardTitle>
                  <p className="font-mono text-[11px] uppercase text-[#878786]">PIN: {cohort.pin}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mt-2 mb-6 text-sm text-[var(--color-muted)]">
                     <span>{formatDate(cohort.startDate)}</span>
                     <span>→</span>
                     <span>{formatDate(cohort.endDate)}</span>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); openEditDialog(cohort); }} className="flex-1 h-8 text-[11px] uppercase tracking-widest font-mono">
                        <Pencil className="w-3 h-3 mr-2" /> Edit
                     </Button>
                     <Button variant="outline" size="sm" onClick={(e) => handleDelete(e, cohort.id)} disabled={deleting} className="flex-1 h-8 text-[11px] uppercase tracking-widest font-mono text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3 h-3 mr-2" /> Delete
                     </Button>
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

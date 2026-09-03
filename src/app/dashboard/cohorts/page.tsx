"use client"

import { useState } from "react"
import { useQuery, useMutation, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Modal, ModalHeader, ModalBody, ModalFooter, AlertModal } from "@/components/ui/modal"

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

type CohortListItem = { id: string; name: string; pin: string; startDate: string; endDate: string; isActive: boolean; durationMonths?: number | null }
type CohortListData = { listCohorts: CohortListItem[] }

const CREATE_COHORT = gql`
  mutation CreateCohort($name: String!, $pin: String!, $startDate: String!, $endDate: String!) {
    createCohort(name: $name, pin: $pin, startDate: $startDate, endDate: $endDate)
  }
`

const UPDATE_COHORT = gql`
  mutation UpdateCohort($id: String!, $name: String, $pin: String, $startDate: String, $endDate: String, $isActive: Boolean) {
    updateCohort(cohortId: $id, name: $name, pin: $pin, startDate: $startDate, endDate: $endDate, isActive: $isActive)
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
  const { data, loading, refetch } = useQuery<CohortListData>(LIST_COHORTS, { fetchPolicy: "cache-and-network" })
  const [createCohort, { loading: creating }] = useMutation(CREATE_COHORT)
  const [updateCohort, { loading: updating }] = useMutation(UPDATE_COHORT)
  const [deleteCohort, { loading: deleting }] = useMutation(DELETE_COHORT)
  
  useSubscription(ON_COHORTS_UPDATED, { onData: () => refetch() })
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCohort, setEditingCohort] = useState<any>(null)
  const [deletingCohortId, setDeletingCohortId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({ 
    name: "", 
    pin: "", 
    startDate: "", 
    endDate: "",
    isActive: true
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
      isActive: cohort.isActive 
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.startDate || !formData.endDate) {
      toast.error("Start date and end date are required")
      return
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date must be on or after the start date")
      return
    }

    try {
      if (editingCohort) {
        await updateCohort({
          variables: {
            id: editingCohort.id,
            name: formData.name,
            pin: formData.pin,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            isActive: formData.isActive
          }
        })
        toast.success("Cohort updated successfully")
      } else {
        await createCohort({
          variables: {
            name: formData.name,
            pin: formData.pin,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString()
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

  const handleDelete = async () => {
    if (!deletingCohortId) return;
    try {
      await deleteCohort({ variables: { id: deletingCohortId } })
      toast.success("Cohort deactivated successfully")
      setDeletingCohortId(null)
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete cohort")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl mb-2">Cohorts</h1>
          <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase">
            Manage training programs
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-black text-white hover:bg-black/80 font-mono text-[11px] uppercase tracking-widest h-11 px-5 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Cohort
        </Button>
      </div>

      <Modal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} className="sm:max-w-xl">
        <ModalHeader title={editingCohort ? 'Edit Cohort' : 'Create New Cohort'} subtitle="Cohorts" onClose={() => setIsDialogOpen(false)} />
        <ModalBody>
          <form id="cohort-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-[#0A0A0A] outline-none font-sans text-[14px] transition-colors rounded-xl" placeholder="e.g. Summer 2026 Batch" />
            </div>
            
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Join PIN</label>
              <input required type="text" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-[#0A0A0A] outline-none font-sans text-[14px] transition-colors rounded-xl mb-3" placeholder="e.g. LXD-26" />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Start Date</label>
              <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-[#0A0A0A] outline-none font-sans text-[14px] transition-colors rounded-xl" />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">End Date</label>
              <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] focus:border-[#0A0A0A] outline-none font-sans text-[14px] transition-colors rounded-xl" />
            </div>

            {editingCohort && (
               <div className="flex items-center gap-2 md:col-span-2 mt-2 p-4 bg-[#F9F9F8] border border-[#E5E5E4]">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 accent-[#0A0A0A] rounded-xl" />
                  <label htmlFor="isActive" className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Cohort is Active (Visible to students)</label>
               </div>
            )}
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={() => setIsDialogOpen(false)} className="hidden sm:block flex-1 sm:flex-none h-14 px-6 border border-[#E5E5E4] bg-white text-[#0A0A0A] font-mono text-[13px] uppercase tracking-widest hover:bg-[#F9F9F8] transition-colors rounded-xl order-2 sm:order-1">Cancel</button>
          <button type="submit" form="cohort-form" disabled={creating || updating} className="flex-1 sm:flex-auto h-14 px-6 bg-[#0A0A0A] text-white font-mono text-[13px] uppercase tracking-widest hover:bg-[#1C1C1C] disabled:opacity-50 transition-colors rounded-xl flex items-center justify-center gap-2 order-1 sm:order-2">
            {(creating || updating) ? "Saving..." : (editingCohort ? "Update Cohort" : "Create Cohort")}
          </button>
        </ModalFooter>
      </Modal>

      <AlertModal
        isOpen={!!deletingCohortId}
        onClose={() => setDeletingCohortId(null)}
        onConfirm={handleDelete}
        title="Deactivate Cohort"
        description="Are you sure you want to deactivate this cohort? It will no longer accept new attendance scans."
        confirmText="Deactivate"
        loading={deleting}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse relative overflow-hidden h-full border-black/5">
                <CardHeader>
                  <div className="h-8 w-48 bg-black/5 rounded mb-2"></div>
                  <div className="h-3 w-20 bg-black/5 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-40 bg-black/5 rounded mt-2 mb-6"></div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 bg-black/5 rounded-xl"></div>
                    <div className="flex-1 h-8 bg-black/5 rounded-xl"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
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
                     <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); setDeletingCohortId(cohort.id); }} disabled={deleting} className="flex-1 h-8 text-[11px] uppercase tracking-widest font-mono text-red-500 hover:text-red-600 hover:bg-red-50">
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

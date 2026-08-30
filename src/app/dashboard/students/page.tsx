"use client"

import { useState } from "react"
import { useQuery, useMutation, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Edit2, Trash2, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"

const LIST_STUDENTS = gql`
  query ListStudents {
    listStudents {
      id
      name
      email
      username
      memberships {
        cohortId
        sessionId
        status
        cohort {
          name
        }
        session {
          name
        }
      }
    }
  }
`

const LIST_COHORTS = gql`
  query ListCohortsForStudents {
    listCohorts {
      id
      name
      sessions {
        id
        name
      }
    }
  }
`

const UPDATE_STUDENT = gql`
  mutation AdminUpdateStudent($id: String!, $name: String, $email: String) {
    adminUpdateStudent(id: $id, name: $name, email: $email) {
      id
      name
      email
    }
  }
`

const DELETE_STUDENT = gql`
  mutation AdminDeleteStudent($id: String!) {
    adminDeleteStudent(id: $id)
  }
`

const ENROLL_STUDENT = gql`
  mutation AdminEnrollStudent($userId: String!, $cohortId: String!, $sessionId: String!) {
    adminEnrollStudent(userId: $userId, cohortId: $cohortId, sessionId: $sessionId)
  }
`

const UPDATE_MEMBERSHIP = gql`
  mutation AdminUpdateStudentMembership($userId: String!, $cohortId: String!, $sessionId: String!) {
    adminUpdateStudentMembership(userId: $userId, cohortId: $cohortId, sessionId: $sessionId)
  }
`

const REMOVE_FROM_COHORT = gql`
  mutation AdminRemoveStudentFromCohort($userId: String!, $cohortId: String!) {
    adminRemoveStudentFromCohort(userId: $userId, cohortId: $cohortId)
  }
`

const ON_STUDENTS_UPDATED = gql`
  subscription OnStudentsUpdated {
    onStudentsUpdated
  }
`

export default function StudentsPage() {
  const { data, loading, refetch } = useQuery<{ listStudents: any[] }>(LIST_STUDENTS, { fetchPolicy: "network-only" })
  const { data: cohortData } = useQuery(LIST_COHORTS, { fetchPolicy: "network-only" })
  
  const [updateStudent, { loading: updating }] = useMutation(UPDATE_STUDENT)
  const [deleteStudent, { loading: deleting }] = useMutation(DELETE_STUDENT)
  const [enrollStudent] = useMutation(ENROLL_STUDENT)
  const [updateMembership] = useMutation(UPDATE_MEMBERSHIP)
  const [removeMembership] = useMutation(REMOVE_FROM_COHORT)

  useSubscription(ON_STUDENTS_UPDATED, { onData: () => refetch() })

  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "" })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [newEnrollment, setNewEnrollment] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState("")
  const [selectedSession, setSelectedSession] = useState("")

  const handleEditClick = (student: any) => {
    setEditingStudent(student)
    setEditForm({ name: student.name, email: student.email })
    setNewEnrollment(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return

    try {
      await updateStudent({
        variables: { id: editingStudent.id, name: editForm.name, email: editForm.email }
      })
      toast.success("Student basic info updated")
      setEditingStudent(null)
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Failed to update student")
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}? This action cannot be undone.`)) return

    try {
      setDeletingId(id)
      await deleteStudent({ variables: { id } })
      toast.success("Student removed successfully")
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Failed to remove student")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEnroll = async () => {
    if (!selectedCohort || !selectedSession || !editingStudent) return;
    try {
      await enrollStudent({ variables: { userId: editingStudent.id, cohortId: selectedCohort, sessionId: selectedSession } })
      toast.success("Student enrolled in cohort")
      setNewEnrollment(false)
      setSelectedCohort("")
      setSelectedSession("")
      refetch()
      // manually update editingStudent view
      setEditingStudent({
        ...editingStudent,
        memberships: [...(editingStudent.memberships || []), { cohortId: selectedCohort, sessionId: selectedSession }]
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll student")
    }
  }

  const handleUpdateSession = async (cohortId: string, newSessionId: string) => {
    if (!editingStudent) return;
    try {
      await updateMembership({ variables: { userId: editingStudent.id, cohortId, sessionId: newSessionId } })
      toast.success("Session updated")
      refetch()
    } catch(err: any) {
      toast.error(err.message || "Failed to update session")
    }
  }

  const handleRemoveCohort = async (cohortId: string) => {
    if (!editingStudent || !confirm("Remove student from this cohort?")) return;
    try {
      await removeMembership({ variables: { userId: editingStudent.id, cohortId } })
      toast.success("Student removed from cohort")
      refetch()
      setEditingStudent({
        ...editingStudent,
        memberships: editingStudent.memberships.filter((m: any) => m.cohortId !== cohortId)
      })
    } catch(err: any) {
      toast.error(err.message || "Failed to remove from cohort")
    }
  }

  return (
    <div className="p-10 space-y-8">
      <div>
        <h1 className="font-serif text-4xl mb-2">Students</h1>
        <p className="font-mono text-[13px] text-[var(--color-muted)] uppercase">Manage all enrolled students</p>
      </div>

      <Card>
        <CardHeader className="border-b border-[var(--color-border)]">
          <div className="grid grid-cols-4 text-[13px] font-mono text-[var(--color-muted)] uppercase">
            <div className="col-span-2">Name & Email</div>
            <div>Enrolled Cohorts</div>
            <div className="text-right">Actions</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-muted)]" />
            </div>
          ) : data?.listStudents?.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {data.listStudents.map((student: any) => (
                <li key={student.id} className="grid grid-cols-4 p-4 items-center hover:bg-black/[0.02]">
                  <div className="col-span-2">
                    <div className="font-medium text-[15px]">{student.name}</div>
                    <div className="text-[13px] text-[var(--color-muted)]">{student.email}</div>
                  </div>
                  <div className="text-[14px] text-[var(--color-muted)] flex flex-wrap gap-1">
                    {student.memberships && student.memberships.length > 0 ? (
                      student.memberships.map((m: any) => (
                        <span key={m.cohortId} className="bg-black/5 px-2 py-1 rounded text-xs">
                          {m.cohort?.name || "Unknown"}
                        </span>
                      ))
                    ) : (
                      <span className="opacity-50">—</span>
                    )}
                  </div>
                  <div className="text-right flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditClick(student)}
                      className="h-8 text-xs font-mono tracking-widest uppercase"
                    >
                      <Edit2 className="w-3 h-3 mr-2" /> Manage
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(student.id, student.name)}
                      disabled={deleting && deletingId === student.id}
                      className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      {deleting && deletingId === student.id ? (
                        <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-[var(--color-muted)] font-mono text-[13px] uppercase">
              No students found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal Overlay */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setEditingStudent(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl shadow-2xl rounded-xl border border-black/5 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-black/5">
                <h2 className="font-serif text-2xl">Manage Student</h2>
                <button onClick={() => setEditingStudent(null)} className="text-black/50 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {/* Basic Info */}
                <form id="basic-info" onSubmit={handleUpdate} className="space-y-4">
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#878786] border-b pb-2">Basic Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[12px] font-sans text-black/60">Full Name</label>
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                        className="w-full h-10 px-3 border border-black/10 focus:border-black outline-none transition-colors rounded-md text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[12px] font-sans text-black/60">Email Address</label>
                      <input 
                        type="email" 
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                        className="w-full h-10 px-3 border border-black/10 focus:border-black outline-none transition-colors rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" className="bg-black text-white hover:bg-black/90">
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                    </Button>
                  </div>
                </form>

                {/* Enrollments */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">Cohort Enrollments</h3>
                    {!newEnrollment && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setNewEnrollment(true)}>
                        <Plus className="w-3 h-3 mr-1" /> Add Enrollment
                      </Button>
                    )}
                  </div>

                  {newEnrollment && (
                    <div className="bg-black/5 p-4 rounded-lg flex gap-3 items-end mb-4 border border-black/10">
                      <div className="flex-1 space-y-1">
                        <label className="text-[11px] uppercase font-mono tracking-widest text-black/60">Cohort</label>
                        <select 
                          className="w-full h-9 border rounded px-2 text-sm"
                          value={selectedCohort}
                          onChange={e => { setSelectedCohort(e.target.value); setSelectedSession(""); }}
                        >
                          <option value="">Select Cohort...</option>
                          {cohortData?.listCohorts?.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[11px] uppercase font-mono tracking-widest text-black/60">Session</label>
                        <select 
                          className="w-full h-9 border rounded px-2 text-sm"
                          value={selectedSession}
                          onChange={e => setSelectedSession(e.target.value)}
                          disabled={!selectedCohort}
                        >
                          <option value="">Select Session...</option>
                          {cohortData?.listCohorts?.find((c: any) => c.id === selectedCohort)?.sessions?.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button onClick={handleEnroll} disabled={!selectedCohort || !selectedSession} size="sm" className="bg-black text-white h-9">
                        Enroll
                      </Button>
                      <Button onClick={() => setNewEnrollment(false)} variant="outline" size="sm" className="h-9 px-2 text-black/50">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {editingStudent.memberships && editingStudent.memberships.length > 0 ? (
                    <div className="space-y-3">
                      {editingStudent.memberships.map((m: any) => {
                        const cohort = cohortData?.listCohorts?.find((c: any) => c.id === m.cohortId);
                        return (
                          <div key={m.cohortId} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                            <div>
                              <div className="font-medium text-[14px]">{m.cohort?.name || (cohort ? cohort.name : "Unknown Cohort")}</div>
                              <div className="text-[12px] text-[var(--color-muted)]">Current: {m.session?.name || "Unknown Session"}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <select 
                                className="h-8 text-xs border rounded px-2 outline-none w-32"
                                value={m.sessionId}
                                onChange={e => handleUpdateSession(m.cohortId, e.target.value)}
                              >
                                {cohort?.sessions?.map((s: any) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                              <Button variant="outline" size="sm" onClick={() => handleRemoveCohort(m.cohortId)} className="h-8 text-red-500 hover:bg-red-50 border-red-200">
                                Remove
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-[var(--color-muted)] font-mono uppercase">
                      Student is not enrolled in any cohorts.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

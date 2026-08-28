"use client"

import { useState } from "react"
import { useQuery, useMutation, useSubscription } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Edit2, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"

const LIST_STUDENTS = gql`
  query ListStudents {
    listStudents {
      id
      name
      email
      username
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

const ON_STUDENTS_UPDATED = gql`
  subscription OnStudentsUpdated {
    onStudentsUpdated
  }
`

export default function StudentsPage() {
  const { data, loading, refetch } = useQuery<{ listStudents: any[] }>(LIST_STUDENTS, { fetchPolicy: "network-only" })
  const [updateStudent, { loading: updating }] = useMutation(UPDATE_STUDENT)
  const [deleteStudent, { loading: deleting }] = useMutation(DELETE_STUDENT)

  useSubscription(ON_STUDENTS_UPDATED, { onData: () => refetch() })

  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "" })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEditClick = (student: any) => {
    setEditingStudent(student)
    setEditForm({ name: student.name, email: student.email })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return

    try {
      await updateStudent({
        variables: { id: editingStudent.id, name: editForm.name, email: editForm.email }
      })
      toast.success("Student updated successfully")
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
            <div>Username</div>
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
                  <div className="text-[14px] text-[var(--color-muted)]">
                    {student.username || "—"}
                  </div>
                  <div className="text-right flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditClick(student)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4 text-black" />
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
              className="relative bg-white w-full max-w-md p-6 shadow-2xl rounded-xl border border-black/5"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl">Edit Student</h2>
                <button onClick={() => setEditingStudent(null)} className="text-black/50 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-mono uppercase tracking-widest text-black/50">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full h-11 px-3 border border-black/10 focus:border-black outline-none transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[12px] font-mono uppercase tracking-widest text-black/50">Email Address</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    className="w-full h-11 px-3 border border-black/10 focus:border-black outline-none transition-colors"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingStudent(null)}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-black text-white hover:bg-black/90 min-w-[100px]">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

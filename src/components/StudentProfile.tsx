"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Edit2, Check, X, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      username
    }
  }
`

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $username: String) {
    updateProfile(name: $name, username: $username) {
      id
      name
      username
    }
  }
`

export function StudentProfile() {
  const { data, loading, error } = useQuery<{ me: any }>(ME_QUERY)
  const [updateProfile, { loading: saving }] = useMutation<{ updateProfile: any }>(UPDATE_PROFILE)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editUsername, setEditUsername] = useState("")

  if (loading) return <div className="h-20 animate-pulse bg-black/5 rounded-md" />
  if (error || !data?.me) return <div className="text-red-500 font-mono text-sm">Failed to load profile.</div>

  const handleEdit = () => {
    setEditName(data.me.name || "")
    setEditUsername(data.me.username || "")
    setIsEditing(true)
  }

  const handleSave = async () => {
    if ((!editName.trim() && !editUsername.trim()) || 
        (editName === data.me.name && editUsername === data.me.username)) {
      setIsEditing(false)
      return
    }
    
    try {
      await updateProfile({
        variables: { 
          name: editName.trim() || undefined,
          username: editUsername.trim() || undefined
        },
        update: (cache, { data: { updateProfile } }) => {
          cache.writeQuery({
            query: ME_QUERY,
            data: { me: { ...data.me, name: updateProfile.name, username: updateProfile.username } }
          })
        }
      })
      toast.success("Profile updated")
      setIsEditing(false)
    } catch (err) {
      toast.error("Failed to update profile")
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[11px] text-[var(--color-muted)] uppercase tracking-widest">
        {data.me.email}
      </p>
      
      <div className="h-10 flex items-center">
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-3 group"
            >
              <div className="flex flex-col gap-1">
                <h2 className="font-serif text-4xl text-[var(--color-text)] tracking-tight">
                  {data.me.name}
                </h2>
                {data.me.username && (
                  <p className="font-mono text-sm text-[#878786]">@{data.me.username}</p>
                )}
              </div>
              <button 
                onClick={handleEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[var(--color-muted)] hover:text-black"
                aria-label="Edit name"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-2"
            >
              <div className="flex flex-col gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Full Name"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') setIsEditing(false)
                  }}
                  disabled={saving}
                  className="font-serif text-3xl tracking-tight bg-transparent border-b border-black outline-none px-1 py-0 placeholder:text-black/30"
                />
                <div className="flex items-center gap-1 font-mono text-sm">
                  <span className="text-[#878786]">@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSave()
                      if (e.key === 'Escape') setIsEditing(false)
                    }}
                    disabled={saving}
                    className="bg-transparent border-b border-[#E5E5E4] focus:border-black outline-none px-1 py-0 placeholder:text-black/20"
                  />
                </div>
              </div>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

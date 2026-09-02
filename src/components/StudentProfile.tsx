"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Edit2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal"

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
  if (error || !data?.me) return <div className="text-[#E54D2E] font-mono text-sm">Failed to load profile.</div>

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
        update: (cache, { data: mutationData }) => {
          if (!mutationData?.updateProfile) return;
          cache.writeQuery({
            query: ME_QUERY,
            data: { me: { ...(data as any).me, name: mutationData.updateProfile.name, username: mutationData.updateProfile.username } }
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
      <p className="font-mono text-[11px] text-[#878786] uppercase tracking-widest">
        {data.me.email}
      </p>
      
      <div className="flex items-center gap-3 group mt-1">
        <div className="flex flex-col gap-1 flex-1">
          <h2 className="font-serif text-4xl text-[#0A0A0A] tracking-tight break-all sm:break-normal">
            {data.me.name}
          </h2>
          {data.me.username && (
            <p className="font-mono text-[13px] text-[#878786]">@{data.me.username}</p>
          )}
        </div>
        <button 
          onClick={handleEdit}
          className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 h-10 px-4 border border-[#E5E5E4] bg-white text-[#0A0A0A] font-mono text-[10px] uppercase tracking-widest hover:bg-[#F9F9F8] rounded-none shrink-0"
          aria-label="Edit Profile"
        >
          <Edit2 className="w-3 h-3" />
          <span className="hidden sm:inline-block">Edit</span>
        </button>
      </div>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} className="sm:max-w-md">
        <ModalHeader title="Edit Profile" subtitle="Your Account" onClose={() => setIsEditing(false)} />
        <ModalBody>
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-name" className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">
                Full Name
              </label>
              <input
                id="edit-name"
                type="text"
                autoFocus
                placeholder="Full Name"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                disabled={saving}
                className="w-full h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] text-[14px] font-sans text-[#0A0A0A] placeholder:text-[#878786]/50 outline-none transition-[border-color] duration-150 focus:border-[#0A0A0A] disabled:opacity-40 rounded-none"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-username" className="font-mono text-[11px] uppercase tracking-widest text-[#878786]">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#878786]">@</span>
                <input
                  id="edit-username"
                  type="text"
                  placeholder="username"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  disabled={saving}
                  className="w-full h-11 pl-8 pr-3 bg-[#F9F9F8] border border-[#E5E5E4] text-[14px] font-sans text-[#0A0A0A] placeholder:text-[#878786]/50 outline-none transition-[border-color] duration-150 focus:border-[#0A0A0A] disabled:opacity-40 rounded-none"
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button 
            type="button" 
            onClick={() => setIsEditing(false)} 
            className="hidden sm:flex flex-1 sm:flex-none min-h-[56px] shrink-0 px-6 border border-[#E5E5E4] bg-white text-[#0A0A0A] font-mono text-[13px] uppercase tracking-widest hover:bg-[#F9F9F8] transition-colors rounded-none order-2 sm:order-1 items-center justify-center"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={saving || (!editName.trim() && !editUsername.trim())}
            className="flex-1 sm:flex-auto min-h-[56px] shrink-0 py-3 px-6 bg-[#0A0A0A] text-white font-mono text-[13px] uppercase tracking-widest hover:bg-[#1C1C1C] disabled:opacity-50 transition-colors rounded-none flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

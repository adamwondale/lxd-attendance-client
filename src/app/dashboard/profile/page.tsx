"use client"

import { useEffect, useState } from "react"
import { gql } from "@apollo/client/core/index.js"
import { useMutation, useQuery } from "@apollo/client/react/index.js"
import { Loader2, Save, Building2 } from "lucide-react"
import { toast } from "sonner"

const PROFILE = gql`query CompanyProfile { companyProfile { id companyName companyEmail companyPhone adminName username timezone } }`
type CompanyProfileData = { companyProfile: { id: string; companyName: string; companyEmail?: string; companyPhone?: string; adminName?: string; username?: string; timezone: string } | null }

const UPDATE = gql`mutation UpdateCompanyProfile($companyName:String,$companyEmail:String,$companyPhone:String,$adminName:String,$username:String) { updateCompanyProfile(companyName:$companyName,companyEmail:$companyEmail,companyPhone:$companyPhone,adminName:$adminName,username:$username) { id companyName companyEmail companyPhone adminName username timezone } }`

export default function CompanyProfilePage() {
  const { data, loading } = useQuery<CompanyProfileData>(PROFILE)
  const [update, { loading: saving }] = useMutation(UPDATE)
  const [form, setForm] = useState({companyName:"",companyEmail:"",companyPhone:"",adminName:"",username:""})
  useEffect(() => { if (data?.companyProfile) setForm({ companyName:data.companyProfile.companyName||"", companyEmail:data.companyProfile.companyEmail||"", companyPhone:data.companyProfile.companyPhone||"", adminName:data.companyProfile.adminName||"", username:data.companyProfile.username||"" }) }, [data])
  
  if (loading) return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto space-y-7 animate-pulse">
      <div>
        <div className="h-3 w-24 bg-border/50 rounded mb-4"></div>
        <div className="h-10 w-64 bg-border/60 rounded mb-4"></div>
        <div className="h-4 w-96 bg-border/40 rounded"></div>
      </div>
      <div className="bg-surface/85 backdrop-blur-xl rounded-3xl border border-border/80 shadow-sm p-5 md:p-8 space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-border/50"></div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-border/50 rounded"></div>
              <div className="w-full h-12 rounded-xl bg-border/40"></div>
            </div>
          ))}
        </div>
        <div className="h-12 w-32 rounded-xl bg-border/50 mt-4"></div>
      </div>
    </div>
  )

  return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto space-y-7">
      <div>
        <span className="text-[11px] font-mono uppercase tracking-[.2em] text-primary font-medium">Administration</span>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mt-2">Company Profile</h1>
        <p className="text-sm text-muted-foreground mt-2">Keep the organization and administrator details used by the attendance system up to date.</p>
      </div>
      <form onSubmit={async e => { e.preventDefault(); try { await update({variables:form}); toast.success("Company profile updated") } catch(err:any) { toast.error(err.message || "Unable to update profile") } }} className="bg-surface/85 backdrop-blur-xl rounded-3xl border border-border/80 shadow-sm p-5 md:p-8 space-y-6">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
          <Building2 className="w-6 h-6"/>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Company Name" value={form.companyName} onChange={v=>setForm({...form,companyName:v})}/>
          <Field label="Company Email" type="email" value={form.companyEmail} onChange={v=>setForm({...form,companyEmail:v})}/>
          <Field label="Company Phone" value={form.companyPhone} onChange={v=>setForm({...form,companyPhone:v})}/>
          <Field label="Admin Name" value={form.adminName} onChange={v=>setForm({...form,adminName:v})}/>
          <Field label="Username" value={form.username} onChange={v=>setForm({...form,username:v})}/>
          <Field label="Timezone" value={data?.companyProfile?.timezone || "Africa/Addis_Ababa"} onChange={()=>{}} disabled/>
        </div>
        <button 
          disabled={saving} 
          className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary-hover shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
          Save changes
        </button>
      </form>
    </div>
  )
}

function Field({label,value,onChange,type="text",disabled=false}:{label:string,value:string,onChange:(v:string)=>void,type?:string,disabled?:boolean}) { 
  return (
    <label className="space-y-1.5 block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input 
        disabled={disabled} 
        type={type} 
        value={value} 
        onChange={e=>onChange(e.target.value)} 
        className="w-full h-12 rounded-xl border border-border/80 bg-surface/80 px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
      />
    </label> 
  )
}

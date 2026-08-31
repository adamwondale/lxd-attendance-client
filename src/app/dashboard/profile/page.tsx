"use client"

import { useEffect, useState } from "react"
import { gql } from "@apollo/client/core/index.js"
import { useMutation, useQuery } from "@apollo/client/react/index.js"
import { Loader2, Save, Building2 } from "lucide-react"
import { toast } from "sonner"

const PROFILE = gql`query CompanyProfile { companyProfile { id companyName companyEmail companyPhone adminName username timezone } }`
const UPDATE = gql`mutation UpdateCompanyProfile($companyName:String,$companyEmail:String,$companyPhone:String,$adminName:String,$username:String) { updateCompanyProfile(companyName:$companyName,companyEmail:$companyEmail,companyPhone:$companyPhone,adminName:$adminName,username:$username) { id companyName companyEmail companyPhone adminName username timezone } }`

export default function CompanyProfilePage() {
  const { data, loading } = useQuery(PROFILE)
  const [update, { loading: saving }] = useMutation(UPDATE)
  const [form, setForm] = useState({companyName:"",companyEmail:"",companyPhone:"",adminName:"",username:""})
  useEffect(() => { if (data?.companyProfile) setForm({ companyName:data.companyProfile.companyName||"", companyEmail:data.companyProfile.companyEmail||"", companyPhone:data.companyProfile.companyPhone||"", adminName:data.companyProfile.adminName||"", username:data.companyProfile.username||"" }) }, [data])
  if (loading) return <div className="p-10">Loading company profile…</div>
  return <div className="p-5 md:p-10 max-w-3xl mx-auto space-y-7">
    <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-black/40">Administration</p><h1 className="font-serif text-4xl md:text-5xl mt-2">Company Profile</h1><p className="text-sm text-black/50 mt-2">Keep the organization and administrator details used by the attendance system up to date.</p></div>
    <form onSubmit={async e => { e.preventDefault(); try { await update({variables:form}); toast.success("Company profile updated") } catch(err:any) { toast.error(err.message || "Unable to update profile") } }} className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 md:p-8 space-y-5">
      <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center"><Building2 className="w-6 h-6"/></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Company Name" value={form.companyName} onChange={v=>setForm({...form,companyName:v})}/><Field label="Company Email" type="email" value={form.companyEmail} onChange={v=>setForm({...form,companyEmail:v})}/><Field label="Company Phone" value={form.companyPhone} onChange={v=>setForm({...form,companyPhone:v})}/><Field label="Admin Name" value={form.adminName} onChange={v=>setForm({...form,adminName:v})}/><Field label="Username" value={form.username} onChange={v=>setForm({...form,username:v})}/><Field label="Timezone" value={data?.companyProfile?.timezone || "Africa/Addis_Ababa"} onChange={()=>{}} disabled/>
      </div>
      <button disabled={saving} className="h-12 px-5 rounded-xl bg-black text-white flex items-center gap-2 hover:bg-[#222] transition-colors disabled:opacity-50">{saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>} Save changes</button>
    </form>
  </div>
}
function Field({label,value,onChange,type="text",disabled=false}:{label:string,value:string,onChange:(v:string)=>void,type?:string,disabled?:boolean}) { return <label className="space-y-2"><span className="text-[10px] uppercase tracking-widest font-mono text-black/45">{label}</span><input disabled={disabled} type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full h-12 rounded-xl border border-black/10 bg-[#F9F9F8] px-4 text-sm outline-none focus:border-black disabled:opacity-50"/></label> }

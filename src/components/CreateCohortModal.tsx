"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation } from "@apollo/client/react/index.js"
import { gql } from "@apollo/client/core/index.js"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const CREATE_COHORT = gql`mutation CreateCohort($name:String!,$pin:String!,$startDate:String!,$endDate:String!,$durationMonths:Int){createCohort(name:$name,pin:$pin,startDate:$startDate,endDate:$endDate,durationMonths:$durationMonths)}`

export function CreateCohortModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [createCohort,{loading}] = useMutation(CREATE_COHORT)
  const [form,setForm]=useState({name:"",pin:"",durationMonths:3,startDate:"",endDate:""})
  const submit=async(e:React.FormEvent)=>{e.preventDefault();try{await createCohort({variables:{...form,startDate:new Date(form.startDate).toISOString(),endDate:new Date(form.endDate).toISOString()}});toast.success("Cohort created");setForm({name:"",pin:"",durationMonths:3,startDate:"",endDate:""});onClose()}catch(err:any){toast.error(err.message||"Unable to create cohort")}}
  return <AnimatePresence>{isOpen&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/><motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.96}} className="relative w-full max-w-md"><Card className="rounded-3xl shadow-2xl"><CardHeader><CardTitle>Create Cohort</CardTitle><p className="text-xs font-mono uppercase tracking-widest text-black/40">New system entry</p></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><Field label="Cohort Name" value={form.name} onChange={v=>setForm({...form,name:v})}/><Field label="Cohort PIN" value={form.pin} onChange={v=>setForm({...form,pin:v})}/><div className="grid grid-cols-2 gap-3"><label className="space-y-2"><span className="text-[10px] font-mono uppercase text-black/45">Duration</span><select value={form.durationMonths} onChange={e=>setForm({...form,durationMonths:Number(e.target.value)})} className="w-full h-11 rounded-xl border border-black/10 px-3"><option value={3}>3 months</option><option value={6}>6 months</option></select></label><Field label="Start Date" type="date" value={form.startDate} onChange={v=>setForm({...form,startDate:v})}/></div><Field label="End Date" type="date" value={form.endDate} onChange={v=>setForm({...form,endDate:v})}/><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={loading} className="bg-black text-white">{loading?"Creating…":"Create Cohort"}</Button></div></form></CardContent></Card></motion.div></div>}</AnimatePresence>
}
function Field({label,value,onChange,type="text"}:{label:string,value:string,onChange:(v:string)=>void,type?:string}){return <label className="space-y-2 block"><span className="text-[10px] font-mono uppercase text-black/45">{label}</span><input required type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-[#F9F9F8] px-3 text-sm outline-none focus:border-black"/></label>}

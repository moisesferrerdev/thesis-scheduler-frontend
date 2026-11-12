import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, RefreshCw, Eye, Pencil, Trash2, X, BookOpen, Layers, CalendarDays } from 'lucide-react'
import subjectOfferingService from '../../services/api/subjectOfferingService'
import academicTermService from '../../services/api/academicTermService'
import curriculumService from '../../services/api/curriculumService'

const initialForm = { termId: '', curriculumId: '', offeringCode: '', status: 'ACTIVE' }
const messageOf = (error) => error.response?.data?.message || error.response?.data?.error || error.message || 'Something went wrong. Please try again.'
const codePart = (value) => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-')
const semesterPart = (value) => {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('1') || normalized.includes('first')) return '1SEM'
  if (normalized.includes('2') || normalized.includes('second')) return '2SEM'
  if (normalized.includes('summer')) return 'SUMMER'
  return ''
}
const generateOfferingCode = (term, curriculum) => {
  if (!term?.academicYear || !curriculum?.programCode || !curriculum?.yearLevel || !curriculum?.semester || !curriculum?.subjectCode) return ''
  const semester = semesterPart(curriculum.semester)
  if (!semester) return ''
  const year = String(curriculum.yearLevel).replace(/[^0-9]/g, '')
  if (!year) return ''
  return [codePart(term.academicYear), codePart(curriculum.programCode), `${year}YR`, semester, codePart(curriculum.subjectCode)].filter(Boolean).join('-')
}

function SubjectOfferingsPage() {
  const [offerings, setOfferings] = useState([])
  const [terms, setTerms] = useState([])
  const [curricula, setCurricula] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [termFilter, setTermFilter] = useState('ALL')
  const [programFilter, setProgramFilter] = useState('ALL')
  const [yearFilter, setYearFilter] = useState('ALL')
  const [modal, setModal] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')

  const loadData = async () => {
    setError('')
    try {
      const [offeringData, termData, curriculumData] = await Promise.all([
        subjectOfferingService.getAll(), academicTermService.getAllAcademicTerms(), curriculumService.getAll(),
      ])
      setOfferings(Array.isArray(offeringData) ? offeringData : [])
      setTerms(Array.isArray(termData) ? termData : [])
      setCurricula(Array.isArray(curriculumData) ? curriculumData : [])
    } catch (err) { setError(messageOf(err)) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let active = true
    Promise.all([subjectOfferingService.getAll(), academicTermService.getAllAcademicTerms(), curriculumService.getAll()])
      .then(([offeringData, termData, curriculumData]) => {
        if (!active) return
        setOfferings(Array.isArray(offeringData) ? offeringData : [])
        setTerms(Array.isArray(termData) ? termData : [])
        setCurricula(Array.isArray(curriculumData) ? curriculumData : [])
      })
      .catch((err) => { if (active) setError(messageOf(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const curriculumById = useMemo(() => new Map(curricula.map((item) => [String(item.curriculumId), item])), [curricula])
  const programs = useMemo(() => [...new Map(curricula.map((c) => [String(c.programId), { id: c.programId, name: c.programName, code: c.programCode }])).values()], [curricula])
  const years = useMemo(() => [...new Set(curricula.map((c) => String(c.yearLevel)))].sort(), [curricula])
  const filtered = useMemo(() => offerings.filter((item) => {
    const curriculum = curriculumById.get(String(item.curriculumId))
    const termMatch = termFilter === 'ALL' || String(item.termId) === termFilter
    const programMatch = programFilter === 'ALL' || String(curriculum?.programId) === programFilter
    const yearMatch = yearFilter === 'ALL' || String(curriculum?.yearLevel) === yearFilter
    const query = search.trim().toLowerCase()
    const searchMatch = !query || [item.offeringCode, item.subjectCode, item.subjectName, curriculum?.programCode, curriculum?.programName].some((v) => String(v || '').toLowerCase().includes(query))
    return termMatch && programMatch && yearMatch && searchMatch
  }), [offerings, curriculumById, termFilter, programFilter, yearFilter, search])

  const openModal = (type, item = null) => {
    setSelected(item)
    setFormError('')
    setForm(item ? { termId: String(item.termId), curriculumId: String(item.curriculumId), offeringCode: item.offeringCode || '', status: item.status || 'ACTIVE' } : initialForm)
    setModal(type)
  }
  const selectedTerm = terms.find((term) => String(term.termId) === String(form.termId))
  const availableCurricula = selectedTerm?.semester
    ? curricula.filter((item) => item.semester === selectedTerm.semester)
    : curricula
  const selectedCurriculum = curriculumById.get(String(form.curriculumId))
  const generatedOfferingCode = generateOfferingCode(selectedTerm, selectedCurriculum)
  const save = async (event) => {
    event.preventDefault()
    if (!form.termId || !form.curriculumId) { setFormError('Please select an academic term and curriculum assignment.'); return }
    if (!generatedOfferingCode) { setFormError('The offering code could not be generated. Check the academic year, program code, year level, semester, and subject code.'); return }
    if (generatedOfferingCode.length > 40) { setFormError('The generated offering code exceeds the backend limit of 40 characters. Please shorten the program or subject code.'); return }
    if (!selectedCurriculum?.subjectId) { setFormError('The selected curriculum does not have a linked subject.'); return }
    const duplicateCode = offerings.some((item) =>
      String(item.termId) === String(form.termId) &&
      String(item.offeringCode || '').trim().toLowerCase() === generatedOfferingCode.toLowerCase() &&
      String(item.offeringId) !== String(selected?.offeringId || '')
    )
    if (duplicateCode) { setFormError('This offering code is already used for the selected academic term.'); return }
    const payload = { termId: Number(form.termId), curriculumId: Number(form.curriculumId), subjectId: Number(selectedCurriculum.subjectId), offeringCode: generatedOfferingCode, status: form.status }
    setSaving(true); setFormError('')
    try {
      if (modal === 'edit') await subjectOfferingService.update(selected.offeringId, payload)
      else await subjectOfferingService.create(payload)
      setModal(''); await loadData()
    } catch (err) { setFormError(messageOf(err)) }
    finally { setSaving(false) }
  }
  const remove = async () => {
    setDeleting(true); setFormError('')
    try { await subjectOfferingService.delete(selected.offeringId); setModal(''); await loadData() }
    catch (err) { setFormError(messageOf(err)) }
    finally { setDeleting(false) }
  }
  const curriculumLabel = (c) => c
    ? `${c.programCode || c.programName || 'Program'} · Year ${c.yearLevel ?? '—'} · ${c.semester || '—'} · ${c.subjectCode || ''}${c.subjectName ? ` — ${c.subjectName}` : ''}`
    : '—'
  const termName = (id) => terms.find((t) => String(t.termId) === String(id))?.termName || offerings.find((o) => String(o.termId) === String(id))?.termName || '—'

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold text-slate-900">Subject Offerings</h1><p className="mt-1 text-sm text-slate-500">Register subjects offered under an academic term and curriculum.</p></div><button onClick={() => openModal('add')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"><Plus size={17}/> Add Subject Offering</button></div>
    {error && <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button onClick={loadData} className="font-semibold underline">Retry</button></div>}
    <div className="grid gap-4 sm:grid-cols-3"><Stat icon={<BookOpen/>} label="Total Offerings" value={offerings.length}/><Stat icon={<Layers/>} label="Programs" value={programs.length}/><Stat icon={<CalendarDays/>} label="Academic Terms" value={terms.length}/></div>
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-4"><div className="relative md:col-span-1"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search subject or offering..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400"/></div><select value={termFilter} onChange={(e)=>setTermFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="ALL">All Academic Terms</option>{terms.map(t=><option key={t.termId} value={t.termId}>{t.termName}</option>)}</select><select value={programFilter} onChange={(e)=>setProgramFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="ALL">All Programs</option>{programs.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select><select value={yearFilter} onChange={(e)=>setYearFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="ALL">All Year Levels</option>{years.map(y=><option key={y} value={y}>Year {y}</option>)}</select></div><div className="mt-3 flex justify-end"><button onClick={loadData} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><RefreshCw size={15}/> Refresh</button></div></div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Offering / Subject</th><th className="px-5 py-3">Academic Term</th><th className="px-5 py-3">Program / Year</th><th className="px-5 py-3">Semester</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500">Loading subject offerings...</td></tr> : filtered.length === 0 ? <tr><td colSpan="6" className="px-5 py-12 text-center"><BookOpen className="mx-auto mb-2 text-slate-300"/><p className="font-medium text-slate-700">No subject offerings found</p><p className="mt-1 text-xs text-slate-500">Add an offering or adjust your search filters.</p></td></tr> : filtered.map(item=>{const c=curriculumById.get(String(item.curriculumId)); return <tr key={item.offeringId} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{item.subjectCode} — {item.subjectName}</p><p className="mt-0.5 text-xs text-slate-500">{item.offeringCode}</p></td><td className="px-5 py-4 text-slate-600">{item.termName || termName(item.termId)}</td><td className="px-5 py-4 text-slate-600">{c ? <>{c.programCode || c.programName}<p className="text-xs text-slate-400">Year {c.yearLevel}</p></> : '—'}</td><td className="px-5 py-4 text-slate-600">{c?.semester || '—'}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Action title="View" onClick={()=>openModal('view',item)}><Eye size={16}/></Action><Action title="Edit" onClick={()=>openModal('edit',item)}><Pencil size={16}/></Action><Action title="Delete" onClick={()=>openModal('delete',item)}><Trash2 size={16}/></Action></div></td></tr>})}</tbody></table></div><div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Showing {filtered.length} of {offerings.length} subject offerings</div></div>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"><div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><div><h2 className="text-lg font-bold text-slate-900">{modal==='add'?'Add Subject Offering':modal==='edit'?'Edit Subject Offering':modal==='view'?'Subject Offering Details':'Delete Subject Offering'}</h2><p className="mt-0.5 text-xs text-slate-500">{modal==='delete'?'Confirm removal of this offering.': 'Academic term and curriculum details'}</p></div><button onClick={()=>setModal('')} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
      {modal==='delete' ? <div className="space-y-4 p-6"><p className="text-sm text-slate-600">Are you sure you want to delete <strong>{selected?.offeringCode}</strong>? This action may be blocked if the offering is already assigned to sections.</p>{formError&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}<div className="flex justify-end gap-2"><button onClick={()=>setModal('')} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button><button disabled={deleting} onClick={remove} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{deleting?'Deleting...':'Delete Offering'}</button></div></div> : modal==='view' ? <div className="space-y-4 p-6"><Detail label="Offering Code" value={selected?.offeringCode}/><Detail label="Subject" value={`${selected?.subjectCode || ''} — ${selected?.subjectName || ''}`}/><Detail label="Academic Term" value={selected?.termName || termName(selected?.termId)}/><Detail label="Curriculum" value={curriculumLabel(curriculumById.get(String(selected?.curriculumId)) || {})}/><Detail label="Status" value={selected?.status}/><div className="flex justify-end"><button onClick={()=>setModal('')} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Close</button></div></div> : <form onSubmit={save} className="space-y-4 p-6"><Field label="Academic Term" required><select value={form.termId} onChange={e=>setForm({...form,termId:e.target.value,curriculumId:''})} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"><option value="">Select academic term</option>{terms.map(t=><option key={t.termId} value={t.termId}>{t.termName}</option>)}</select></Field><Field label="Curriculum Assignment" required><select value={form.curriculumId} disabled={!form.termId} onChange={e=>setForm({...form,curriculumId:e.target.value})} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"><option value="">{form.termId ? 'Select program, year, semester and subject' : 'Select an academic term first'}</option>{availableCurricula.map(c=><option key={c.curriculumId} value={c.curriculumId}>{curriculumLabel(c)}</option>)}</select></Field>{selectedCurriculum&&<div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><span className="font-semibold">Selected subject: </span>{selectedCurriculum.subjectCode} — {selectedCurriculum.subjectName}</div>}<Field label="Generated Offering Code" required><input value={generatedOfferingCode} readOnly placeholder="Select a term and curriculum to generate" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"/><p className="mt-1 text-xs text-slate-500">Automatically generated from the academic year, program code, year level, semester, and subject code.</p></Field><Field label="Status" required><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Field>{formError&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}<div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={()=>setModal('')} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving?'Saving...':modal==='edit'?'Save Changes':'Create Offering'}</button></div></form>}</div></div>}
  </div>
}
function Stat({icon,label,value}){return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><span className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</span></div><p className="mt-3 text-2xl font-bold text-slate-900">{value}</p></div>}
function Action({title,onClick,children}){return <button title={title} onClick={onClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">{children}</button>}
function Field({label,required,children}){return <label className="block text-sm font-medium text-slate-700">{label}{required&&<span className="text-red-500"> *</span>}{children}</label>}
function Detail({label,value}){return <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-3 text-sm"><span className="text-slate-500">{label}</span><span className="col-span-2 font-medium text-slate-800">{value || '—'}</span></div>}

export default SubjectOfferingsPage

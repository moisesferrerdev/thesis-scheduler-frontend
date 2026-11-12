import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Trash2, X, BookOpen, Users, ClipboardList,
  RefreshCw, AlertCircle, CheckCircle2,
} from 'lucide-react'

import sectionSubjectService from '../../services/api/sectionSubjectService'
import studentSectionService from '../../services/api/studentSectionService'
import subjectOfferingService from '../../services/api/subjectOfferingService'
import curriculumService from '../../services/api/curriculumService'

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  return []
}

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.response?.data?.error ||
  error?.message || 'Something went wrong. Please try again.'

// const termLabel = (term) => term?.termName || term?.academicTermName ||
//   [term?.academicYear, term?.semester].filter(Boolean).join(' - ') ||
//   `Academic Term ${term?.termId ?? ''}`

const yearLabel = (year) => {
  const n = Number(year)
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  return `${n}${suffix} Year`
}

const initialBulk = { termId: '', programId: '', yearLevel: '', offeringId: '', sectionIds: [] }

export default function SectionSubjectsPage() {
  const [assignments, setAssignments] = useState([])
  const [sections, setSections] = useState([])
  const [offerings, setOfferings] = useState([])
  const [curricula, setCurricula] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [search, setSearch] = useState('')
  const [filterTerm, setFilterTerm] = useState('')
  const [filterProgram, setFilterProgram] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [showAssign, setShowAssign] = useState(false)
  const [bulk, setBulk] = useState(initialBulk)
  const [modalError, setModalError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setPageError('')
    const [assignmentData, sectionData, offeringData, curriculumData] = await Promise.all([
      sectionSubjectService.getAll(), studentSectionService.getAll(),
      subjectOfferingService.getAll(), curriculumService.getAll(),
    ])
    setAssignments(getArrayData(assignmentData))
    setSections(getArrayData(sectionData))
    setOfferings(getArrayData(offeringData))
    setCurricula(getArrayData(curriculumData))
  }

  useEffect(() => {
    let active = true
    Promise.all([
      sectionSubjectService.getAll(), studentSectionService.getAll(),
      subjectOfferingService.getAll(), curriculumService.getAll(),
    ]).then(([a, s, o, c]) => {
      if (!active) return
      setAssignments(getArrayData(a)); setSections(getArrayData(s))
      setOfferings(getArrayData(o)); setCurricula(getArrayData(c))
    }).catch((error) => {
      if (active) setPageError(getErrorMessage(error))
    }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  const curriculumById = useMemo(() => new Map(curricula.map((c) => [String(c.curriculumId), c])), [curricula])
  const sectionById = useMemo(() => new Map(sections.map((s) => [String(s.sectionId), s])), [sections])
  const offeringById = useMemo(() => new Map(offerings.map((o) => [String(o.offeringId), o])), [offerings])

  const enriched = useMemo(() => assignments.map((a) => {
    const section = sectionById.get(String(a.sectionId)) || {}
    const offering = offeringById.get(String(a.offeringId)) || {}
    const curriculum = curriculumById.get(String(offering.curriculumId)) || {}
    return { ...a, section, offering, curriculum,
      termId: section.termId ?? offering.termId,
      programId: section.programId ?? curriculum.programId,
      yearLevel: section.yearLevel ?? curriculum.yearLevel,
      subjectCode: offering.subjectCode || curriculum.subjectCode || '',
      subjectName: offering.subjectName || curriculum.subjectName || '',
      sectionCode: a.sectionCode || section.sectionCode || '',
      offeringCode: a.offeringCode || offering.offeringCode || '',
      termName: section.termName || offering.termName || '',
      programCode: section.programCode || curriculum.programCode || '',
      programName: section.programName || curriculum.programName || '',
    }
  }), [assignments, sectionById, offeringById, curriculumById])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter((a) => {
      const matchesSearch = !q || [a.subjectCode, a.subjectName, a.sectionCode, a.offeringCode].some((v) => String(v || '').toLowerCase().includes(q))
      return matchesSearch && (!filterTerm || String(a.termId) === filterTerm) &&
        (!filterProgram || String(a.programId) === filterProgram) &&
        (!filterYear || String(a.yearLevel) === filterYear) &&
        (!filterSection || String(a.sectionId) === filterSection)
    })
  }, [enriched, search, filterTerm, filterProgram, filterYear, filterSection])

  const terms = useMemo(() => {
    const seen = new Map()
    sections.forEach((s) => { if (s.termId != null) seen.set(String(s.termId), { termId: s.termId, termName: s.termName }) })
    offerings.forEach((o) => { if (o.termId != null && !seen.has(String(o.termId))) seen.set(String(o.termId), { termId: o.termId, termName: o.termName }) })
    return [...seen.values()]
  }, [sections, offerings])
  const programs = useMemo(() => {
    const seen = new Map()
    sections.forEach((s) => { if (s.programId != null) seen.set(String(s.programId), { programId: s.programId, programCode: s.programCode, programName: s.programName }) })
    curricula.forEach((c) => { if (c.programId != null && !seen.has(String(c.programId))) seen.set(String(c.programId), { programId: c.programId, programCode: c.programCode, programName: c.programName }) })
    return [...seen.values()]
  }, [sections, curricula])

  const availableOfferings = useMemo(() => offerings.filter((o) => {
    const c = curriculumById.get(String(o.curriculumId)) || {}
    return (!bulk.termId || String(o.termId) === bulk.termId) &&
      (!bulk.programId || String(c.programId) === bulk.programId) &&
      (!bulk.yearLevel || String(c.yearLevel) === bulk.yearLevel) &&
      String(o.status || '').toLowerCase() === 'active'
  }), [offerings, curriculumById, bulk.termId, bulk.programId, bulk.yearLevel])

  const eligibleSections = useMemo(() => sections.filter((s) =>
    (!bulk.termId || String(s.termId) === bulk.termId) &&
    (!bulk.programId || String(s.programId) === bulk.programId) &&
    (!bulk.yearLevel || String(s.yearLevel) === bulk.yearLevel)
  ), [sections, bulk.termId, bulk.programId, bulk.yearLevel])

  const assignedSectionIds = useMemo(() => new Set(assignments
    .filter((a) => String(a.offeringId) === bulk.offeringId)
    .map((a) => String(a.sectionId))), [assignments, bulk.offeringId])

  const selectedOffering = offeringById.get(bulk.offeringId)
  const selectedCurriculum = selectedOffering ? curriculumById.get(String(selectedOffering.curriculumId)) : null

  const openAssign = () => { setBulk(initialBulk); setModalError(''); setSaveResult(null); setShowAssign(true) }
  const closeAssign = () => { if (!isSaving) { setShowAssign(false); setModalError(''); setSaveResult(null) } }
  const updateBulk = (field, value) => setBulk((old) => ({ ...old, [field]: value, ...(field === 'termId' ? { offeringId: '', sectionIds: [] } : {}), ...(field === 'programId' || field === 'yearLevel' ? { offeringId: '', sectionIds: [] } : {}), ...(field === 'offeringId' ? { sectionIds: [] } : {}) }))
  const toggleSection = (id) => setBulk((old) => ({ ...old, sectionIds: old.sectionIds.includes(String(id)) ? old.sectionIds.filter((v) => v !== String(id)) : [...old.sectionIds, String(id)] }))

  const handleAssign = async () => {
    setModalError(''); setSaveResult(null)
    if (!bulk.termId || !bulk.programId || !bulk.yearLevel || !bulk.offeringId) { setModalError('Select an Academic Term, Program, Year Level, and Subject Offering.'); return }
    if (!bulk.sectionIds.length) { setModalError('Select at least one eligible section.'); return }
    const targets = bulk.sectionIds.filter((id) => !assignedSectionIds.has(id))
    if (!targets.length) { setModalError('All selected sections are already assigned to this offering.'); return }
    setIsSaving(true)
    const results = await Promise.allSettled(targets.map((sectionId) => sectionSubjectService.create({ sectionId: Number(sectionId), offeringId: Number(bulk.offeringId) })))
    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failures = results.length - succeeded
    try { await loadData() } catch (error) { setPageError(getErrorMessage(error)) }
    setIsSaving(false)
    setSaveResult({ succeeded, failures, messages: results.map((r, i) => r.status === 'rejected' ? `${sections.find((s) => String(s.sectionId) === targets[i])?.sectionCode || `Section ${targets[i]}`}: ${getErrorMessage(r.reason)}` : null).filter(Boolean) })
    if (failures === 0) {
      setBulk((old) => ({ ...old, sectionIds: [] }))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true); setDeleteError('')
    try { await sectionSubjectService.delete(deleteTarget.sectionSubjectId); setAssignments((old) => old.filter((a) => a.sectionSubjectId !== deleteTarget.sectionSubjectId)); setDeleteTarget(null) }
    catch (error) { setDeleteError(getErrorMessage(error)) }
    finally { setIsDeleting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Section Subjects</h1><p className="mt-1 text-sm text-slate-500">Assign subject offerings to registered student sections.</p></div>
        <button onClick={openAssign} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"><Plus size={18}/> Assign Subject to Sections</button>
      </div>

      {pageError && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0"/>{pageError}<button className="ml-auto" onClick={() => setPageError('')}><X size={16}/></button></div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[{label:'Subject Assignments',value:assignments.length,icon:ClipboardList},{label:'Registered Sections',value:sections.length,icon:Users},{label:'Available Offerings',value:offerings.length,icon:BookOpen}].map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{card.label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p></div><div className="rounded-lg bg-blue-50 p-3 text-blue-700"><Icon size={22}/></div></div></div> })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject or section..." className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/></div>
          <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"><option value="">All Academic Terms</option>{terms.map((t) => <option key={t.termId} value={t.termId}>{t.termName || `Term ${t.termId}`}</option>)}</select>
          <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"><option value="">All Programs</option>{programs.map((p) => <option key={p.programId} value={p.programId}>{p.programCode} - {p.programName}</option>)}</select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"><option value="">All Year Levels</option>{[1,2,3,4,5].map((y) => <option key={y} value={y}>{yearLabel(y)}</option>)}</select>
          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"><option value="">All Sections</option>{sections.map((s) => <option key={s.sectionId} value={s.sectionId}>{s.sectionCode}</option>)}</select>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>Showing {filtered.length} of {assignments.length} assignments</span><button onClick={() => { setSearch(''); setFilterTerm(''); setFilterProgram(''); setFilterYear(''); setFilterSection('') }} className="font-medium text-blue-700 hover:text-blue-900">Clear filters</button></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Assigned Subjects</h2><button onClick={() => { setIsLoading(true); loadData().catch((e) => setPageError(getErrorMessage(e))).finally(() => setIsLoading(false)) }} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"><RefreshCw size={15}/> Refresh</button></div>
        {isLoading ? <div className="p-12 text-center text-sm text-slate-500">Loading section subject assignments...</div> : filtered.length === 0 ? <div className="p-12 text-center"><BookOpen className="mx-auto mb-3 text-slate-300" size={36}/><p className="font-medium text-slate-700">No subject assignments found</p><p className="mt-1 text-sm text-slate-500">Assign a subject offering to one or more registered sections.</p></div> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Subject','Section','Academic Term','Program / Year','Required Hours','Actions'].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((a) => <tr key={a.sectionSubjectId} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="text-sm font-semibold text-slate-900">{a.subjectCode || a.offeringCode}</p><p className="text-xs text-slate-500">{a.subjectName || 'Subject details unavailable'}</p></td><td className="px-5 py-4 text-sm font-medium text-slate-800">{a.sectionCode}</td><td className="px-5 py-4 text-sm text-slate-600">{a.termName || `Term ${a.termId || ''}`}</td><td className="px-5 py-4 text-sm text-slate-600">{a.programCode || '—'} · {a.yearLevel ? yearLabel(a.yearLevel) : '—'}</td><td className="px-5 py-4 text-sm text-slate-600">Lecture: {a.requiredLectureHours ?? '—'}h<br/>Lab: {a.requiredLabHours ?? '—'}h</td><td className="px-5 py-4"><button onClick={() => { setDeleteTarget(a); setDeleteError('') }} title="Remove assignment" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={17}/></button></td></tr>)}</tbody></table></div>}
      </div>

      {showAssign && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"><div className="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 px-6 py-5"><div><h2 className="text-lg font-bold text-slate-900">Assign Subject to Sections</h2><p className="mt-1 text-sm text-slate-500">Choose an offering, then select one or more eligible sections.</p></div><button onClick={closeAssign} disabled={isSaving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20}/></button></div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Academic Term *<select value={bulk.termId} onChange={(e) => updateBulk('termId', e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"><option value="">Select academic term</option>{terms.map((t) => <option key={t.termId} value={t.termId}>{t.termName || `Term ${t.termId}`}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Program *<select value={bulk.programId} onChange={(e) => updateBulk('programId', e.target.value)} disabled={!bulk.termId} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal disabled:bg-slate-100"><option value="">Select program</option>{programs.map((p) => <option key={p.programId} value={p.programId}>{p.programCode} - {p.programName}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Year Level *<select value={bulk.yearLevel} onChange={(e) => updateBulk('yearLevel', e.target.value)} disabled={!bulk.programId} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal disabled:bg-slate-100"><option value="">Select year level</option>{[1,2,3,4,5].map((y) => <option key={y} value={y}>{yearLabel(y)}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Subject Offering *<select value={bulk.offeringId} onChange={(e) => updateBulk('offeringId', e.target.value)} disabled={!bulk.yearLevel} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal disabled:bg-slate-100"><option value="">Select subject offering</option>{availableOfferings.map((o) => <option key={o.offeringId} value={o.offeringId}>{o.offeringCode} — {o.subjectName || o.subjectCode}</option>)}</select></label>
          </div>
          {selectedOffering && <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900"><p className="font-semibold">{selectedOffering.subjectCode} — {selectedOffering.subjectName}</p><p className="mt-1 text-xs">{selectedOffering.offeringCode}{selectedCurriculum ? ` · ${selectedCurriculum.programCode || ''} · ${yearLabel(selectedCurriculum.yearLevel)} · ${selectedCurriculum.semester || ''}` : ''}</p></div>}
          <div className="rounded-xl border border-slate-200"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><p className="text-sm font-semibold text-slate-800">Eligible Student Sections</p><p className="text-xs text-slate-500">Select multiple sections for this offering.</p></div><span className="text-xs font-medium text-slate-500">{bulk.sectionIds.length} selected</span></div>
            {!bulk.yearLevel ? <p className="p-6 text-center text-sm text-slate-500">Select term, program, and year level first.</p> : eligibleSections.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No registered sections match these selections.</p> : <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto">{eligibleSections.map((s) => { const assigned = assignedSectionIds.has(String(s.sectionId)); return <label key={s.sectionId} className={`flex items-center gap-3 px-4 py-3 text-sm ${assigned ? 'cursor-not-allowed bg-slate-50 text-slate-400' : 'cursor-pointer hover:bg-slate-50'}`}><input type="checkbox" checked={bulk.sectionIds.includes(String(s.sectionId))} disabled={assigned || !bulk.offeringId} onChange={() => toggleSection(s.sectionId)} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"/><span className="flex-1"><span className="font-medium">{s.sectionCode}</span><span className="ml-2 text-xs text-slate-500">{s.studentCount ?? 0} students</span></span>{assigned && <span className="text-xs font-medium">Already Assigned</span>}</label> })}</div>}
          </div>
          {modalError && <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{modalError}</div>}
          {saveResult && <div className={`rounded-lg p-3 text-sm ${saveResult.failures ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}><div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={17}/>{saveResult.succeeded} assignment(s) created; {saveResult.failures} failed.</div>{saveResult.messages.length > 0 && <ul className="mt-2 list-disc pl-5">{saveResult.messages.map((m) => <li key={m}>{m}</li>)}</ul>}</div>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end"><button onClick={closeAssign} disabled={isSaving} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button><button onClick={handleAssign} disabled={isSaving || !bulk.offeringId || bulk.sectionIds.length === 0} className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Assigning...' : 'Assign to Selected Sections'}</button></div>
      </div></div>}

      {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start gap-3"><div className="rounded-full bg-red-50 p-2 text-red-600"><Trash2 size={20}/></div><div><h2 className="font-bold text-slate-900">Remove Subject Assignment?</h2><p className="mt-2 text-sm text-slate-600">This removes the subject from section <strong>{deleteTarget.sectionCode}</strong>. The Subject Offering and Subject master record will not be deleted.</p></div></div>{deleteError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</p>}<div className="mt-6 flex justify-end gap-2"><button onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button onClick={handleDelete} disabled={isDeleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">{isDeleting ? 'Removing...' : 'Remove Assignment'}</button></div></div></div>}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, RefreshCw, ChevronDown, ChevronUp, UserRound,
  BookOpen, Pencil, Trash2, X, CheckCircle2, Clock3, AlertCircle,
} from 'lucide-react'

import instructorService from '../../services/api/instructorService'
import instructorQualificationService from '../../services/api/instructorQualificationService'
import subjectService from '../../services/api/subjectService'
import programService from '../../services/api/programService'
import curriculumService from '../../services/api/curriculumService'

const messageFromError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'Something went wrong. Please try again.'

const getArray = (data) => Array.isArray(data) ? data : []
const isActive = (instructor) => String(instructor?.status || '').toLowerCase() === 'active'
const fullName = (instructor) =>
  [instructor?.firstName, instructor?.middleName, instructor?.lastName]
    .filter(Boolean)
    .join(' ')

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`flex max-h-[92vh] w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}>
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={19}/></button>
        </header>
        {children}
      </section>
    </div>
  )
}

export default function InstructorQualificationsPage() {
  const [instructors, setInstructors] = useState([])
  const [qualifications, setQualifications] = useState([])
  const [subjects, setSubjects] = useState([])
  const [programs, setPrograms] = useState([])
  const [curricula, setCurricula] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')

  const [statusFilter, setStatusFilter] = useState('Active')
  const [search, setSearch] = useState('')
  const [expandedInstructorId, setExpandedInstructorId] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [programFilter, setProgramFilter] = useState('ALL')
  const [yearFilter, setYearFilter] = useState('ALL')
  const [subjectSearch, setSubjectSearch] = useState('')
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([])
  const [defaultApproved, setDefaultApproved] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [bulkFailures, setBulkFailures] = useState([])

  const [editingQualification, setEditingQualification] = useState(null)
  const [editApproved, setEditApproved] = useState(true)
  const [deletingQualification, setDeletingQualification] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadPageData = async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setPageError('')
    try {
      const [instructorData, qualificationData, subjectData, programData, curriculumData] = await Promise.all([
        instructorService.getAll(),
        instructorQualificationService.getAll(),
        subjectService.getAll(),
        programService.getAll(),
        curriculumService.getAll(),
      ])
      setInstructors(getArray(instructorData))
      setQualifications(getArray(qualificationData))
      setSubjects(getArray(subjectData))
      setPrograms(getArray(programData))
      setCurricula(getArray(curriculumData))
    } catch (error) {
      setPageError(messageFromError(error))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([
      instructorService.getAll(),
      instructorQualificationService.getAll(),
      subjectService.getAll(),
      programService.getAll(),
      curriculumService.getAll(),
    ]).then(([instructorData, qualificationData, subjectData, programData, curriculumData]) => {
      if (cancelled) return
      setInstructors(getArray(instructorData))
      setQualifications(getArray(qualificationData))
      setSubjects(getArray(subjectData))
      setPrograms(getArray(programData))
      setCurricula(getArray(curriculumData))
    }).catch((error) => {
      if (!cancelled) setPageError(messageFromError(error))
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const activeInstructors = useMemo(() => instructors.filter(isActive), [instructors])
  const inactiveInstructors = useMemo(() => instructors.filter((item) => !isActive(item)), [instructors])

  const visibleInstructors = useMemo(() => {
    const source = statusFilter === 'Active'
      ? activeInstructors
      : statusFilter === 'Inactive'
        ? inactiveInstructors
        : instructors
    const query = search.trim().toLowerCase()
    return source.filter((item) =>
      !query || [item.employeeNo, fullName(item)].some((value) => String(value || '').toLowerCase().includes(query)),
    )
  }, [activeInstructors, inactiveInstructors, instructors, statusFilter, search])

  const qualificationByInstructor = useMemo(() => {
    const map = new Map()
    qualifications.forEach((item) => {
      const key = String(item.instructorId)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    })
    return map
  }, [qualifications])

  const eligibleSubjects = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase()
    const existingSubjectIds = new Set(
      (qualificationByInstructor.get(String(selectedInstructor?.instructorId)) || [])
        .map((item) => String(item.subjectId)),
    )

    return subjects.filter((subject) => {
      const subjectIsActive = !subject.status || String(subject.status).toUpperCase() === 'ACTIVE'
      const matchingCurricula = curricula.filter((item) => Number(item.subjectId) === Number(subject.subjectId))
      const matchesCurriculum = matchingCurricula.some((item) =>
        (programFilter === 'ALL' || String(item.programId) === programFilter) &&
        (yearFilter === 'ALL' || String(item.yearLevel) === yearFilter),
      )
      const matchesSearch = !query || [subject.subjectCode, subject.subjectName]
        .some((value) => String(value || '').toLowerCase().includes(query))
      return subjectIsActive && !existingSubjectIds.has(String(subject.subjectId)) &&
        matchingCurricula.length > 0 && matchesCurriculum && matchesSearch
    })
  }, [subjects, curricula, qualificationByInstructor, selectedInstructor, programFilter, yearFilter, subjectSearch])

  const openAddModal = (instructor) => {
    if (!isActive(instructor)) return
    setSelectedInstructor(instructor)
    setProgramFilter('ALL')
    setYearFilter('ALL')
    setSubjectSearch('')
    setSelectedSubjectIds([])
    setDefaultApproved(true)
    setSaveError('')
    setBulkFailures([])
    setModalOpen(true)
  }

  const closeAddModal = () => {
    if (saving) return
    setModalOpen(false)
    setSelectedInstructor(null)
    setSaveError('')
    setBulkFailures([])
  }

  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds((current) => current.includes(String(subjectId))
      ? current.filter((id) => id !== String(subjectId))
      : [...current, String(subjectId)])
  }

  const saveBulkQualifications = async (event) => {
    event.preventDefault()
    if (!selectedInstructor || !isActive(selectedInstructor)) {
      setSaveError('Only active instructors can receive subject qualifications.')
      return
    }
    if (!selectedSubjectIds.length) {
      setSaveError('Select at least one subject.')
      return
    }

    setSaving(true)
    setSaveError('')
    setBulkFailures([])

    const results = await Promise.all(selectedSubjectIds.map(async (subjectId) => {
      try {
        await instructorQualificationService.create({
          instructorId: selectedInstructor.instructorId,
          subjectId: Number(subjectId),
          qualificationLevel: null,
          approved: defaultApproved,
        })
        return { subjectId, success: true }
      } catch (error) {
        return { subjectId, success: false, error: messageFromError(error) }
      }
    }))

    const successfulIds = results.filter((item) => item.success).map((item) => item.subjectId)
    const failed = results.filter((item) => !item.success)
    if (successfulIds.length) {
      setNotice(`${successfulIds.length} subject qualification(s) saved for ${fullName(selectedInstructor)}.`)
      setSelectedSubjectIds((current) => current.filter((id) => !successfulIds.includes(id)))
      await loadPageData(true)
    }
    setBulkFailures(failed)
    if (failed.length) setSaveError(`${failed.length} subject(s) could not be saved. You can retry the remaining selections.`)
    else {
      setModalOpen(false)
      setSelectedInstructor(null)
      setBulkFailures([])
    }
    setSaving(false)
  }

  const openEditModal = (qualification, instructor) => {
    if (!isActive(instructor)) return
    setEditingQualification(qualification)
    setEditApproved(Boolean(qualification.approved))
    setSaveError('')
  }

  const saveQualificationEdit = async (event) => {
    event.preventDefault()
    if (!editingQualification) return
    setSaving(true)
    setSaveError('')
    try {
      await instructorQualificationService.update(editingQualification.qualificationId, {
        instructorId: editingQualification.instructorId,
        subjectId: editingQualification.subjectId,
        qualificationLevel: editingQualification.qualificationLevel ?? null,
        approved: editApproved,
      })
      setEditingQualification(null)
      setNotice('Qualification updated successfully.')
      await loadPageData(true)
    } catch (error) {
      setSaveError(messageFromError(error))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingQualification) return
    setDeleting(true)
    setSaveError('')
    try {
      await instructorQualificationService.delete(deletingQualification.qualificationId)
      setDeletingQualification(null)
      setNotice('Qualification deleted successfully.')
      await loadPageData(true)
    } catch (error) {
      setSaveError(messageFromError(error))
    } finally {
      setDeleting(false)
    }
  }

  const getProgramLabel = (programId) => {
    const program = programs.find((item) => Number(item.programId) === Number(programId))
    return program ? `${program.programCode} - ${program.programName}` : 'Program'
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Instructor Qualifications</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the subjects each instructor is qualified and approved to teach.</p>
        </div>
        <button type="button" onClick={() => loadPageData(true)} disabled={refreshing} className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''}/> Refresh
        </button>
      </div>

      {notice && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17}/>{notice}<button className="ml-auto" onClick={() => setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
      {pageError && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17}/>{pageError}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">Active Instructors</p><UserRound className="text-blue-600" size={19}/></div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeInstructors.length}</p>
          <p className="mt-1 text-xs text-slate-500">Eligible for new subject qualifications</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">Total Qualifications</p><BookOpen className="text-indigo-600" size={19}/></div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{qualifications.length}</p>
          <p className="mt-1 text-xs text-slate-500">Existing instructor-subject associations</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {['Active', 'Inactive', 'All'].map((filter) => (
              <button key={filter} type="button" onClick={() => setStatusFilter(filter)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${statusFilter === filter ? 'bg-[#172B4D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {filter} {filter === 'Active' ? `(${activeInstructors.length})` : filter === 'Inactive' ? `(${inactiveInstructors.length})` : `(${instructors.length})`}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search instructor or employee ID" className={`${inputClass} pl-9`}/>
          </div>
        </div>

        {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading instructor qualifications...</div>
          : visibleInstructors.length === 0 ? <div className="p-12 text-center"><UserRound className="mx-auto text-slate-300" size={32}/><p className="mt-3 font-semibold text-slate-700">No instructors found</p><p className="mt-1 text-sm text-slate-500">Try another filter or search term.</p></div>
            : <div className="space-y-3 p-4">
              {visibleInstructors.map((instructor) => {
                const records = qualificationByInstructor.get(String(instructor.instructorId)) || []
                const expanded = String(expandedInstructorId) === String(instructor.instructorId)
                const active = isActive(instructor)
                return (
                  <section key={instructor.instructorId} className="overflow-hidden rounded-xl border border-slate-200">
                    <button type="button" onClick={() => setExpandedInstructorId(expanded ? null : instructor.instructorId)}
                      className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50">
                      <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><UserRound size={20}/></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{fullName(instructor)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{instructor.employeeNo} · {records.length} qualified subject(s)</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'Active' : 'Inactive'}</span>
                      {expanded ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                    </button>
                    {expanded && <div className="border-t border-slate-200 bg-white p-4">
                      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div><h3 className="text-sm font-semibold text-slate-800">Qualified Subjects</h3><p className="text-xs text-slate-500">These are qualifications, not current teaching assignments.</p></div>
                        {active && <button type="button" onClick={() => openAddModal(instructor)} className={`${buttonClass} bg-[#172B4D] text-white hover:bg-[#243D66]`}><Plus size={16}/> Add Subjects</button>}
                      </div>
                      {!active && <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">This instructor is inactive. Existing qualifications are view-only; adding or editing qualifications is disabled.</div>}
                      {records.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No subject qualifications have been recorded.</div>
                        : <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                          {records.map((qualification) => (
                            <div key={qualification.qualificationId} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">{qualification.subjectCode} — {qualification.subjectName}</p>
                                <p className="mt-1 text-xs text-slate-500">Qualification ID: {qualification.qualificationId}</p>
                              </div>
                              <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${qualification.approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {qualification.approved ? <CheckCircle2 size={13}/> : <Clock3 size={13}/>} {qualification.approved ? 'Approved' : 'Not approved'}
                              </span>
                              {active && <div className="flex gap-1">
                                <button type="button" title="Edit approval" onClick={() => openEditModal(qualification, instructor)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16}/></button>
                                <button type="button" title="Delete qualification" onClick={() => setDeletingQualification(qualification)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
                              </div>}
                            </div>
                          ))}
                        </div>}
                    </div>}
                  </section>
                )
              })}
            </div>}
      </div>

      {modalOpen && selectedInstructor && <Modal title="Bulk Add Subject Qualifications" subtitle={`Select multiple subjects for ${fullName(selectedInstructor)} (${selectedInstructor.employeeNo}).`} onClose={closeAddModal} wide>
        <form onSubmit={saveBulkQualifications} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-800">Only active instructors can receive qualifications. Already assigned subjects are excluded from this list.</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Program</span>
                <select className={inputClass} value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
                  <option value="ALL">All Programs</option>
                  {programs.filter((item) => !item.status || String(item.status).toUpperCase() === 'ACTIVE').map((program) => <option key={program.programId} value={String(program.programId)}>{program.programCode} - {program.programName}</option>)}
                </select>
              </label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Year Level</span>
                <select className={inputClass} value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                  <option value="ALL">All Year Levels</option>
                  {[1, 2, 3, 4, 5].map((year) => <option key={year} value={String(year)}>{year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year</option>)}
                </select>
              </label>
            </div>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input className={`${inputClass} pl-9`} value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder="Search subject code or name"/></div>
            <div className="flex items-center justify-between text-xs text-slate-500"><span>{eligibleSubjects.length} available subject(s)</span><span>{selectedSubjectIds.length} selected</span></div>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
              {eligibleSubjects.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No available subjects match these filters.</p>
                : eligibleSubjects.map((subject) => <label key={subject.subjectId} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50">
                  <input type="checkbox" checked={selectedSubjectIds.includes(String(subject.subjectId))} onChange={() => toggleSubject(subject.subjectId)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{subject.subjectCode} — {subject.subjectName}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{[...new Set(curricula.filter((item) => Number(item.subjectId) === Number(subject.subjectId)).map((item) => `${getProgramLabel(item.programId)} · Year ${item.yearLevel}`))].join(' | ')}</span></span>
                </label>)}
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={defaultApproved} onChange={(event) => setDefaultApproved(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"/><span><span className="font-medium">Mark selected qualifications as approved</span><span className="mt-0.5 block text-xs text-slate-500">Uncheck to save them as not approved. This setting applies to all subjects selected in this bulk operation.</span></span></label>
            {saveError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{saveError}</div>}
            {bulkFailures.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><p className="mb-1 font-semibold">Failed subject requests</p>{bulkFailures.map((failure) => <p key={failure.subjectId}>Subject ID {failure.subjectId}: {failure.error}</p>)}</div>}
          </div>
          <footer className="flex flex-col-reverse justify-end gap-2 border-t border-slate-200 p-4 sm:flex-row">
            <button type="button" onClick={closeAddModal} disabled={saving} className={`${buttonClass} border border-slate-300 text-slate-700`}>Cancel</button>
            <button type="submit" disabled={saving || selectedSubjectIds.length === 0} className={`${buttonClass} bg-[#172B4D] text-white`}>{saving ? 'Saving qualifications...' : `Save ${selectedSubjectIds.length} Subject(s)`}</button>
          </footer>
        </form>
      </Modal>}

      {editingQualification && <Modal title="Edit Qualification" subtitle={`${editingQualification.subjectCode} — ${editingQualification.subjectName}`} onClose={() => { if (!saving) { setEditingQualification(null); setSaveError('') } }}>
        <form onSubmit={saveQualificationEdit} className="space-y-4 p-5">
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={editApproved} onChange={(event) => setEditApproved(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600"/> Qualification approved</label>
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingQualification(null)} className={`${buttonClass} border border-slate-300 text-slate-700`}>Cancel</button><button disabled={saving} className={`${buttonClass} bg-[#172B4D] text-white`}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </form>
      </Modal>}

      {deletingQualification && <Modal title="Delete Qualification" subtitle="This action cannot be undone." onClose={() => { if (!deleting) setDeletingQualification(null) }}>
        <div className="space-y-4 p-5"><p className="text-sm text-slate-700">Remove <strong>{deletingQualification.subjectCode} — {deletingQualification.subjectName}</strong> from this instructor's qualifications?</p>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setDeletingQualification(null)} disabled={deleting} className={`${buttonClass} border border-slate-300 text-slate-700`}>Cancel</button><button type="button" onClick={confirmDelete} disabled={deleting} className={`${buttonClass} bg-red-600 text-white hover:bg-red-700`}>{deleting ? 'Deleting...' : 'Delete Qualification'}</button></div>
        </div>
      </Modal>}
    </div>
  )
}

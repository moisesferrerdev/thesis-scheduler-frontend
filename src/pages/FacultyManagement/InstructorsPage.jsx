import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, RefreshCw, Eye, Pencil, Trash2, Users, UserCheck,
  UserX, X, UserPlus, AlertCircle, CheckCircle2
} from 'lucide-react'
import instructorService from '../../services/api/instructorService'

const EMPTY_FORM = {
  firstName: '', middleName: '', lastName: '',
  employmentType: 'Full-Time', maxLoadHours: '18', targetLoadHours: '', status: 'Active',
}

const messageFromError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'Something went wrong. Please try again.'

const fullName = (item) =>
  [item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ')

function Field({ label, children, required = false }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

function InstructorFields({ value, onChange, errors = {}, compact = false }) {
  const set = (field, next) => onChange({ ...value, [field]: next })
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${compact ? 'xl:grid-cols-4' : ''}`}>
      <Field label="First Name" required>
        <input className={inputClass} value={value.firstName} maxLength={100}
          onChange={(e) => set('firstName', e.target.value)} placeholder="First name" />
        {errors.firstName && <span className="mt-1 block text-xs text-red-600">{errors.firstName}</span>}
      </Field>
      <Field label="Middle Name">
        <input className={inputClass} value={value.middleName} maxLength={100}
          onChange={(e) => set('middleName', e.target.value)} placeholder="Optional" />
      </Field>
      <Field label="Last Name" required>
        <input className={inputClass} value={value.lastName} maxLength={100}
          onChange={(e) => set('lastName', e.target.value)} placeholder="Last name" />
        {errors.lastName && <span className="mt-1 block text-xs text-red-600">{errors.lastName}</span>}
      </Field>
      <Field label="Employment Type" required>
        <select className={inputClass} value={value.employmentType}
          onChange={(e) => set('employmentType', e.target.value)}>
          <option>Full-Time</option><option>Part-Time</option>
        </select>
      </Field>
      <Field label="Maximum Load Hours" required>
        <input className={inputClass} type="number" min="0" max="9999.9" step="0.1"
          value={value.maxLoadHours} onChange={(e) => set('maxLoadHours', e.target.value)} />
        {errors.maxLoadHours && <span className="mt-1 block text-xs text-red-600">{errors.maxLoadHours}</span>}
      </Field>
      <Field label="Target Load Hours (Optional)">
        <input className={inputClass} type="number" min="0" max="9999.9" step="0.1"
          value={value.targetLoadHours} onChange={(e) => set('targetLoadHours', e.target.value)} placeholder="Leave blank if not specified" />
        {errors.targetLoadHours && <span className="mt-1 block text-xs text-red-600">{errors.targetLoadHours}</span>}
      </Field>
      <Field label="Status" required>
        <select className={inputClass} value={value.status} onChange={(e) => set('status', e.target.value)}>
          <option>Active</option><option>Inactive</option>
        </select>
      </Field>
    </div>
  )
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section className={`flex max-h-[92vh] w-full ${wide ? 'max-w-6xl' : 'max-w-2xl'} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}>
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div><h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={19}/></button>
        </header>
        {children}
      </section>
    </div>
  )
}

function validate(item) {
  const errors = {}

  if (!(item.firstName ?? '').trim()) {
    errors.firstName = 'First Name is required.'
  }

  if (!(item.lastName ?? '').trim()) {
    errors.lastName = 'Last Name is required.'
  }

  if (
    item.maxLoadHours === '' ||
    item.maxLoadHours == null ||
    !Number.isFinite(Number(item.maxLoadHours)) ||
    Number(item.maxLoadHours) < 0
  ) {
    errors.maxLoadHours = 'Enter a valid non-negative load.'
  }

  if (
    item.targetLoadHours !== '' &&
    item.targetLoadHours != null &&
    (!Number.isFinite(Number(item.targetLoadHours)) ||
      Number(item.targetLoadHours) < 0)
  ) {
    errors.targetLoadHours = 'Enter a valid non-negative target load.'
  }

  if (
    item.targetLoadHours !== '' &&
    item.targetLoadHours != null &&
    item.maxLoadHours !== '' &&
    item.maxLoadHours != null &&
    Number(item.targetLoadHours) > Number(item.maxLoadHours)
  ) {
    errors.targetLoadHours = 'Target Load cannot exceed Maximum Load.'
  }

  return errors
}

function toPayload(item) {
  return {
    firstName: (item.firstName ?? '').trim(),
    middleName: (item.middleName ?? '').trim() || null,
    lastName: (item.lastName ?? '').trim(),
    employmentType: item.employmentType,
    maxLoadHours: Number(item.maxLoadHours),
    targetLoadHours:
      item.targetLoadHours === '' || item.targetLoadHours == null
        ? null
        : Number(item.targetLoadHours),
    status: item.status,
  }
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [employmentFilter, setEmploymentFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState('single')
  const [form, setForm] = useState(EMPTY_FORM)
  const [bulkRows, setBulkRows] = useState([{ ...EMPTY_FORM }, { ...EMPTY_FORM }])
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rowErrors, setRowErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [bulkResult, setBulkResult] = useState(null)

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setPageError('')
    try {
      const data = await instructorService.getAll()
      setInstructors(Array.isArray(data) ? data : [])
    } catch (error) {
      setPageError(messageFromError(error))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    instructorService.getAll()
      .then((data) => {
        if (!cancelled) setInstructors(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        if (!cancelled) setPageError(messageFromError(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => instructors.filter((item) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [item.employeeNo, fullName(item)].some((v) => String(v || '').toLowerCase().includes(query))
    return matchesSearch &&
      (employmentFilter === 'All' || item.employmentType === employmentFilter) &&
      (statusFilter === 'All' || item.status === statusFilter)
  }), [instructors, search, employmentFilter, statusFilter])

  const activeCount = instructors.filter((item) => item.status?.toLowerCase() === 'active').length
  const inactiveCount = instructors.length - activeCount

  const openAdd = () => {
    setEditing(null); setMode('single'); setForm({ ...EMPTY_FORM })
    setBulkRows([{ ...EMPTY_FORM }, { ...EMPTY_FORM }])
    setRowErrors({}); setSaveError(''); setBulkResult(null); setModalOpen(true)
  }

const openEdit = (item) => {
  setEditing(item)

  setForm({
    ...EMPTY_FORM,
    ...item,
    firstName: item.firstName ?? '',
    middleName: item.middleName ?? '',
    lastName: item.lastName ?? '',
    maxLoadHours: String(item.maxLoadHours ?? ''),
    targetLoadHours:
      item.targetLoadHours == null
        ? ''
        : String(item.targetLoadHours),
  })

  setMode('single')
  setSaveError('')
  setRowErrors({})
  setModalOpen(true)
}

  const closeModal = () => {
    if (saving) return
    setModalOpen(false); setEditing(null); setSaveError('')
  }

  const saveSingle = async (event) => {
    event.preventDefault()
    const errors = validate(form)
    setRowErrors({ 0: errors })
    if (Object.keys(errors).length) return
    setSaving(true); setSaveError('')
    try {
      const payload = toPayload(form)
      if (editing) await instructorService.update(editing.instructorId, payload)
      else await instructorService.create(payload)
      setNotice(editing ? 'Instructor updated successfully.' : 'Instructor registered successfully.')
      setModalOpen(false); setEditing(null); await load(true)
    } catch (error) {
      setSaveError(messageFromError(error))
    } finally { setSaving(false) }
  }

  const saveBulk = async (event) => {
    event.preventDefault()
    const errors = {}
    bulkRows.forEach((row, index) => {
      const rowError = validate(row)
      if (Object.keys(rowError).length) errors[index] = rowError
    })
    setRowErrors(errors)
    if (Object.keys(errors).length) return

    setSaving(true); setSaveError(''); setBulkResult(null)
    const results = await Promise.all(bulkRows.map(async (row, index) => {
      try {
        await instructorService.create(toPayload(row))
        return { index, instructorName: fullName(row), success: true }
      } catch (error) {
        return { index, instructorName: fullName(row), success: false, error: messageFromError(error) }
      }
    }))
    const successes = results.filter((result) => result.success)
    const failures = results.filter((result) => !result.success)
    setBulkResult({ successes, failures })
    if (successes.length) {
      setNotice(`${successes.length} instructor(s) registered successfully.`)
      await load(true)
    }
    if (!failures.length) {
      setModalOpen(false)
    } else {
      setSaveError(`${successes.length} succeeded; ${failures.length} failed. Correct the failed entries and retry only those entries.`)
      setBulkRows((current) => current.filter((_, index) => failures.some((failure) => failure.index === index)))
      setRowErrors({})
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setSaving(true)
    try {
      await instructorService.delete(deleting.instructorId)
      setDeleting(null); setNotice('Instructor deleted successfully.')
      await load(true)
    } catch (error) {
      setPageError(messageFromError(error)); setDeleting(null)
    } finally { setSaving(false) }
  }

  const updateBulkRow = (index, next) => setBulkRows((current) => current.map((row, i) => i === index ? next : row))

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold text-slate-900">Instructors</h1>
          <p className="mt-1 text-sm text-slate-500">Manage instructor records and teaching workload limits.</p></div>
        <button onClick={openAdd} className={`${buttonClass} bg-[#172B4D] text-white hover:bg-[#223d68]`}><Plus size={17}/> Add Instructor</button>
      </div>

      {notice && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17}/>{notice}<button className="ml-auto" onClick={() => setNotice('')}><X size={16}/></button></div>}
      {pageError && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17}/>{pageError}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Instructors', value: instructors.length, icon: Users },
          { label: 'Active', value: activeCount, icon: UserCheck },
          { label: 'Inactive', value: inactiveCount, icon: UserX },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><Icon size={20} className="text-slate-400"/></div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>)}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className={`${inputClass} pl-9`} placeholder="Search Employee ID or instructor name..." value={search} onChange={(e) => setSearch(e.target.value)}/></div>
          <select className={`${inputClass} lg:w-48`} value={employmentFilter} onChange={(e) => setEmploymentFilter(e.target.value)}>
            <option value="All">All Employment Types</option><option>Full-Time</option><option>Part-Time</option></select>
          <select className={`${inputClass} lg:w-40`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option><option>Active</option><option>Inactive</option></select>
          <button onClick={() => load(true)} disabled={refreshing} className={`${buttonClass} border border-slate-300 text-slate-700 hover:bg-slate-50`}><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''}/> Refresh</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Instructor Records</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} record(s)</p></div>
        {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading instructors...</div> :
          filtered.length === 0 ? <div className="p-10 text-center"><Users className="mx-auto text-slate-300" size={32}/><p className="mt-3 font-medium text-slate-700">{instructors.length ? 'No matching instructors found.' : 'No instructors registered yet.'}</p><p className="mt-1 text-sm text-slate-500">Add an instructor to get started.</p></div> :
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
              <th className="px-5 py-3">Employee ID</th><th className="px-5 py-3">Instructor Name</th><th className="px-5 py-3">Employment Type</th><th className="px-5 py-3">Maximum Load</th><th className="px-5 py-3">Target Load</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th>
            </tr></thead><tbody className="divide-y divide-slate-100">
              {filtered.map((item) => <tr key={item.instructorId} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 font-medium text-slate-700">{item.employeeNo}</td><td className="px-5 py-4 font-medium text-slate-900">{fullName(item)}</td>
                <td className="px-5 py-4 text-slate-600">{item.employmentType}</td><td className="px-5 py-4 text-slate-600">{item.maxLoadHours} hrs</td><td className="px-5 py-4 text-slate-600">{item.targetLoadHours == null ? '—' : `${item.targetLoadHours} hrs`}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></td>
                <td className="px-5 py-4"><div className="flex justify-end gap-1">
                  <button title="View" onClick={() => setViewing(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Eye size={16}/></button>
                  <button title="Edit" onClick={() => openEdit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16}/></button>
                  <button title="Delete" onClick={() => setDeleting(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
                </div></td>
              </tr>)}
            </tbody></table></div>}
      </div>

      {modalOpen && <Modal title={editing ? 'Edit Instructor' : 'Add Instructor'} subtitle={editing ? 'Update instructor information.' : 'Choose a registration method and enter instructor details.'} onClose={closeModal} wide={mode === 'bulk'}>
        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          {!editing && <div className="mb-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setMode('single'); setSaveError('') }} className={`rounded-xl border-2 p-3 text-left transition ${mode === 'single' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <UserPlus className={mode === 'single' ? 'text-blue-600' : 'text-slate-500'}/><p className="mt-2 text-sm font-semibold text-slate-900">Single Add</p><p className="mt-1 text-xs text-slate-500">Register one instructor.</p>
            </button>
            <button type="button" onClick={() => { setMode('bulk'); setSaveError('') }} className={`rounded-xl border-2 p-3 text-left transition ${mode === 'bulk' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <Users className={mode === 'bulk' ? 'text-blue-600' : 'text-slate-500'}/><p className="mt-2 text-sm font-semibold text-slate-900">Bulk Add</p><p className="mt-1 text-xs text-slate-500">Register multiple instructors.</p>
            </button>
          </div>}

          {saveError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{saveError}</div>}

          {mode === 'single' || editing ? <form onSubmit={saveSingle} className="space-y-5">
            <InstructorFields value={form} onChange={setForm} errors={rowErrors[0] || {}}/>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={closeModal} className={`${buttonClass} border border-slate-300 text-slate-700`}>Cancel</button>
              <button disabled={saving} className={`${buttonClass} bg-[#172B4D] text-white`}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Instructor'}</button>
            </div>
          </form> : <form onSubmit={saveBulk} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-800">Instructor Entries</h3><p className="text-xs text-slate-500">Complete each row. Scroll within the modal when needed.</p></div>
              <button type="button" onClick={() => setBulkRows((rows) => [...rows, { ...EMPTY_FORM }])} className={`${buttonClass} border border-blue-200 text-blue-700 hover:bg-blue-50`}><Plus size={16}/> Add another</button></div>
            <div className="space-y-3">
              {bulkRows.map((row, index) => <div key={`instructor-${index}`} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-slate-800">Instructor {index + 1}</p>
                  <button type="button" disabled={bulkRows.length === 1} onClick={() => setBulkRows((rows) => rows.filter((_, i) => i !== index))} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" title="Remove entry"><Trash2 size={16}/></button></div>
                <InstructorFields value={row} onChange={(next) => updateBulkRow(index, next)} errors={rowErrors[index] || {}} compact/>
              </div>)}
            </div>
            {bulkResult?.failures?.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-semibold">Some entries were not registered:</p>{bulkResult.failures.map((failure) => <p key={failure.index}>{failure.instructorName || `Instructor ${failure.index + 1}`}: {failure.error}</p>)}
            </div>}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={closeModal} className={`${buttonClass} border border-slate-300 text-slate-700`}>Cancel</button>
              <button disabled={saving} className={`${buttonClass} bg-[#172B4D] text-white`}>{saving ? 'Registering...' : `Register ${bulkRows.length} Instructor(s)`}</button>
            </div>
          </form>}
        </div>
      </Modal>}

      {viewing && <Modal title="Instructor Details" subtitle="View registered instructor information." onClose={() => setViewing(null)}>
        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[['Employee ID', viewing.employeeNo], ['Full Name', fullName(viewing)], ['Employment Type', viewing.employmentType], ['Maximum Load', `${viewing.maxLoadHours} hours`], ['Target Load', viewing.targetLoadHours == null ? 'Not specified' : `${viewing.targetLoadHours} hours`], ['Status', viewing.status]].map(([label, value]) => <div key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-900">{value || '—'}</p></div>)}
          </div><div className="flex justify-end"><button onClick={() => setViewing(null)} className={`${buttonClass} border border-slate-300 text-slate-700`}>Close</button></div>
        </div>
      </Modal>}

      {deleting && <Modal title="Delete Instructor" subtitle="Confirm this action before proceeding." onClose={() => !saving && setDeleting(null)}>
        <div className="p-5 sm:p-6"><p className="text-sm text-slate-600">Are you sure you want to delete <strong>{fullName(deleting)}</strong> ({deleting.employeeNo})?</p>
          <p className="mt-2 text-xs text-amber-700">The backend may reject deletion if this instructor is referenced by other records.</p>
          <div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleting(null)} className={`${buttonClass} border border-slate-300 text-slate-700`}>Cancel</button><button onClick={confirmDelete} disabled={saving} className={`${buttonClass} bg-red-600 text-white`}>{saving ? 'Deleting...' : 'Delete Instructor'}</button></div>
        </div>
      </Modal>}
    </div>
  )
}

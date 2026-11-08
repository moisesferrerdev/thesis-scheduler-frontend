import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  BookOpen,
  CheckCircle2,
  ListChecks,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'

import curriculumService from '../../services/api/curriculumService'
import programService from '../../services/api/programService'
import subjectService from '../../services/api/subjectService'

// The backend requires curriculumYear, but the current API does not expose
// a scheduler-selected active curriculum year. Keep this value hidden in the UI.
const CURRENT_CURRICULUM_YEAR = '2026-2027'

const emptyForm = {
  programId: '',
  subjectId: '',
  yearLevel: '',
  semester: '',
  required: 'true',
}

const yearLevelOptions = [1, 2, 3, 4, 5]
const semesterOptions = ['1st Semester', '2nd Semester', 'Summer']

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'An unexpected error occurred. Please try again.'
  )
}

async function loadPageData() {
  const [curriculaData, programsData, subjectsData] = await Promise.all([
    curriculumService.getAll(),
    programService.getAll(),
    subjectService.getAll(),
  ])

  return {
    curricula: Array.isArray(curriculaData) ? curriculaData : [],
    programs: Array.isArray(programsData) ? programsData : [],
    subjects: Array.isArray(subjectsData) ? subjectsData : [],
  }
}

function CurriculaPage() {
  const [curricula, setCurricula] = useState([])
  const [programs, setPrograms] = useState([])
  const [subjects, setSubjects] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pageError, setPageError] = useState('')
  const [pageMessage, setPageMessage] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [programFilter, setProgramFilter] = useState('ALL')
  const [classificationFilter, setClassificationFilter] = useState('ALL')

  const [modalType, setModalType] = useState(null)
  const [selectedCurriculum, setSelectedCurriculum] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const fetchPageData = async () => {
    try {
      const data = await loadPageData()
      setCurricula(data.curricula)
      setPrograms(data.programs)
      setSubjects(data.subjects)
      setPageError('')
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    loadPageData()
      .then((data) => {
        if (!isActive) return
        setCurricula(data.curricula)
        setPrograms(data.programs)
        setSubjects(data.subjects)
      })
      .catch((error) => {
        if (isActive) setPageError(getErrorMessage(error))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const handleRefresh = async () => {
    setIsLoading(true)
    setPageError('')
    await fetchPageData()
  }

  const totalCurricula = curricula.length
  const requiredCurricula = curricula.filter((item) => item.required === true).length
  const electiveCurricula = curricula.filter((item) => item.required === false).length

  const filteredCurricula = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return curricula.filter((item) => {
      const matchesSearch =
        (item.programCode || '').toLowerCase().includes(search) ||
        (item.programName || '').toLowerCase().includes(search) ||
        (item.subjectCode || '').toLowerCase().includes(search) ||
        (item.subjectName || '').toLowerCase().includes(search)

      const matchesProgram =
        programFilter === 'ALL' || String(item.programId) === programFilter

      const matchesClassification =
        classificationFilter === 'ALL' ||
        (classificationFilter === 'REQUIRED' && item.required === true) ||
        (classificationFilter === 'ELECTIVE' && item.required === false)

      return matchesSearch && matchesProgram && matchesClassification
    })
  }, [curricula, searchTerm, programFilter, classificationFilter])

  const openAddModal = () => {
    setSelectedCurriculum(null)
    setFormData(emptyForm)
    setErrors({})
    setPageError('')
    setPageMessage('')
    setModalType('add')
  }

  const openEditModal = (curriculum) => {
    setSelectedCurriculum(curriculum)
    setFormData({
      programId: String(curriculum.programId ?? ''),
      subjectId: String(curriculum.subjectId ?? ''),
      yearLevel: String(curriculum.yearLevel ?? ''),
      semester: curriculum.semester || '',
      required: curriculum.required === true ? 'true' : 'false',
    })
    setErrors({})
    setPageError('')
    setPageMessage('')
    setModalType('edit')
  }

  const openViewModal = (curriculum) => {
    setSelectedCurriculum(curriculum)
    setModalType('view')
  }

  const openDeleteModal = (curriculum) => {
    setSelectedCurriculum(curriculum)
    setPageError('')
    setPageMessage('')
    setModalType('delete')
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedCurriculum(null)
    setFormData(emptyForm)
    setErrors({})
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.programId) newErrors.programId = 'Select a program.'
    if (!formData.subjectId) newErrors.subjectId = 'Select a subject.'
    if (!formData.yearLevel) newErrors.yearLevel = 'Select a year level.'
    if (!formData.semester) newErrors.semester = 'Select a semester.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSaving || isLoading) return
    if (!validateForm()) return

    const request = {
      programId: Number(formData.programId),
      subjectId: Number(formData.subjectId),
      curriculumYear: CURRENT_CURRICULUM_YEAR,
      yearLevel: Number(formData.yearLevel),
      semester: formData.semester,
      required: formData.required === 'true',
    }

    try {
      setIsSaving(true)
      setPageError('')
      setPageMessage('')

      if (modalType === 'add') {
        await curriculumService.create(request)
      } else {
        await curriculumService.update(selectedCurriculum.curriculumId, request)
      }

      setIsLoading(true)
      await fetchPageData()
      closeModal()
      setPageMessage(
        modalType === 'add'
          ? 'Curriculum assignment created successfully.'
          : 'Curriculum assignment updated successfully.'
      )
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setPageError('')
      setPageMessage('')
      await curriculumService.delete(selectedCurriculum.curriculumId)
      setIsLoading(true)
      await fetchPageData()
      closeModal()
      setPageMessage('Curriculum assignment deleted successfully. The subject master record was not deleted.')
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  const getClassificationStyle = (required) =>
    required
      ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
      : 'bg-amber-50 text-amber-700 ring-amber-600/20'

  const getProgramLabel = (item) =>
    [item.programCode, item.programName].filter(Boolean).join(' - ') || `Program #${item.programId}`

  const getSubjectLabel = (item) =>
    [item.subjectCode, item.subjectName].filter(Boolean).join(' - ') || `Subject #${item.subjectId}`

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Curricula</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage subject assignments within each academic program.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openAddModal}
            disabled={isLoading || programs.length === 0 || subjects.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17365D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102947] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={18} />
            Add Curriculum
          </button>
        </div>
      </div>

      {pageError && !modalType && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}
      {pageMessage && !modalType && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {pageMessage}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Curriculum Records</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? '—' : totalCurricula}</h2>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><BookOpen size={24} /></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Required Subjects</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? '—' : requiredCurricula}</h2>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-green-700"><CheckCircle2 size={24} /></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Elective Subjects</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? '—' : electiveCurricula}</h2>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><ListChecks size={24} /></div>
          </div>
        </div>
      </div>

      {/* Curriculum Records */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">Curriculum Records</h2>
          <p className="mt-1 text-sm text-slate-500">View and manage program-to-subject assignments.</p>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by program or subject code/name..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="relative lg:w-56">
              <select
                value={programFilter}
                onChange={(event) => setProgramFilter(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All Programs</option>
                {programs.map((program) => (
                  <option key={program.programId} value={String(program.programId)}>
                    {program.programCode} - {program.programName}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative lg:w-48">
              <select
                value={classificationFilter}
                onChange={(event) => setClassificationFilter(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All Classifications</option>
                <option value="REQUIRED">Required</option>
                <option value="ELECTIVE">Elective</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Program</th>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold">Year Level</th>
                <th className="px-6 py-4 font-semibold">Semester</th>
                <th className="px-6 py-4 font-semibold">Classification</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCurricula.map((item) => (
                <tr key={item.curriculumId} className="transition hover:bg-slate-50">
                  <td className="min-w-52 px-6 py-4">
                    <p className="font-semibold text-slate-900">{item.programCode || `Program #${item.programId}`}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.programName || 'Program name unavailable'}</p>
                  </td>
                  <td className="min-w-56 px-6 py-4">
                    <p className="font-semibold text-slate-900">{item.subjectCode || `Subject #${item.subjectId}`}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.subjectName || 'Subject name unavailable'}</p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">Year {item.yearLevel}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">{item.semester}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getClassificationStyle(item.required)}`}>
                      {item.required ? 'Required' : 'Elective'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => openViewModal(item)} title="View" className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Eye size={17} /></button>
                      <button type="button" onClick={() => openEditModal(item)} title="Edit" className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"><Pencil size={17} /></button>
                      <button type="button" onClick={() => openDeleteModal(item)} title="Delete" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredCurricula.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">No curriculum records found.</td></tr>
              )}
              {isLoading && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">Loading curriculum records...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredCurricula.map((item) => (
            <div key={item.curriculumId} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.programCode || `Program #${item.programId}`}</p>
                  <p className="text-sm text-slate-500">{item.programName || 'Program name unavailable'}</p>
                  <p className="mt-2 font-semibold text-slate-900">{item.subjectCode || `Subject #${item.subjectId}`}</p>
                  <p className="text-sm text-slate-500">{item.subjectName || 'Subject name unavailable'}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getClassificationStyle(item.required)}`}>
                  {item.required ? 'Required' : 'Elective'}
                </span>
              </div>
              <p className="text-sm text-slate-600">Year {item.yearLevel} · {item.semester}</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => openViewModal(item)} aria-label="View curriculum" className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Eye size={17} /></button>
                <button type="button" onClick={() => openEditModal(item)} aria-label="Edit curriculum" className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"><Pencil size={17} /></button>
                <button type="button" onClick={() => openDeleteModal(item)} aria-label="Delete curriculum" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={17} /></button>
              </div>
            </div>
          ))}
          {!isLoading && filteredCurricula.length === 0 && <p className="px-4 py-12 text-center text-sm text-slate-500">No curriculum records found.</p>}
          {isLoading && <p className="px-4 py-12 text-center text-sm text-slate-500">Loading curriculum records...</p>}
        </div>

        <div className="border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500">Showing {filteredCurricula.length} of {totalCurricula} curriculum records</p>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{modalType === 'add' ? 'Add Curriculum' : 'Edit Curriculum'}</h2>
                <p className="mt-1 text-sm text-slate-500">{modalType === 'add' ? 'Assign a subject to an academic program.' : 'Update this program-subject assignment.'}</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close modal"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Program <span className="text-red-500">*</span></label>
                <select name="programId" value={formData.programId} onChange={handleInputChange} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${errors.programId ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'}`}>
                  <option value="">Select a program</option>
                  {programs.map((program) => <option key={program.programId} value={String(program.programId)}>{program.programCode} - {program.programName}{program.status === 'INACTIVE' ? ' (Inactive)' : ''}</option>)}
                </select>
                {errors.programId && <p className="mt-1 text-xs text-red-600">{errors.programId}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject <span className="text-red-500">*</span></label>
                <select name="subjectId" value={formData.subjectId} onChange={handleInputChange} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${errors.subjectId ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'}`}>
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => <option key={subject.subjectId} value={String(subject.subjectId)}>{subject.subjectCode} - {subject.subjectName}{subject.status === 'INACTIVE' ? ' (Inactive)' : ''}</option>)}
                </select>
                {errors.subjectId && <p className="mt-1 text-xs text-red-600">{errors.subjectId}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Year Level <span className="text-red-500">*</span></label>
                  <select name="yearLevel" value={formData.yearLevel} onChange={handleInputChange} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${errors.yearLevel ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'}`}>
                    <option value="">Select year level</option>
                    {yearLevelOptions.map((year) => <option key={year} value={String(year)}>Year {year}</option>)}
                  </select>
                  {errors.yearLevel && <p className="mt-1 text-xs text-red-600">{errors.yearLevel}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Semester <span className="text-red-500">*</span></label>
                  <select name="semester" value={formData.semester} onChange={handleInputChange} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${errors.semester ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'}`}>
                    <option value="">Select semester</option>
                    {semesterOptions.map((semester) => <option key={semester} value={semester}>{semester}</option>)}
                  </select>
                  {errors.semester && <p className="mt-1 text-xs text-red-600">{errors.semester}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject Classification <span className="text-red-500">*</span></label>
                <select name="required" value={formData.required} onChange={handleInputChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  <option value="true">Required</option>
                  <option value="false">Elective</option>
                </select>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800">
                Curriculum Year is currently managed by the application and is not editable here.
              </div>

              {pageError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{pageError}</div>}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} disabled={isSaving} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={isSaving || isLoading} className="rounded-lg bg-[#17365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102947] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving ? 'Saving...' : modalType === 'add' ? 'Save Curriculum' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalType === 'view' && selectedCurriculum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Curriculum Details</h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close modal"><X size={20} /></button>
            </div>
            <div className="space-y-5 p-6">
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Program</p><p className="mt-1 font-semibold text-slate-900">{getProgramLabel(selectedCurriculum)}</p></div>
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Subject</p><p className="mt-1 font-semibold text-slate-900">{getSubjectLabel(selectedCurriculum)}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Year Level</p><p className="mt-1 text-sm text-slate-900">Year {selectedCurriculum.yearLevel}</p></div>
                <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Semester</p><p className="mt-1 text-sm text-slate-900">{selectedCurriculum.semester}</p></div>
              </div>
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Classification</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getClassificationStyle(selectedCurriculum.required)}`}>{selectedCurriculum.required ? 'Required' : 'Elective'}</span></div>
            </div>
            <div className="flex justify-end border-t border-slate-100 px-6 py-4"><button type="button" onClick={closeModal} className="rounded-lg bg-[#17365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102947]">Close</button></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalType === 'delete' && selectedCurriculum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 size={22} /></div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Delete Curriculum Assignment?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{selectedCurriculum.subjectCode || 'this subject'}</span> from <span className="font-semibold text-slate-800">{selectedCurriculum.programCode || 'this program'}</span>? This removes only the curriculum association; the Subject master record will remain.
            </p>
            {pageError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{pageError}</div>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeModal} disabled={isDeleting} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{isDeleting ? 'Deleting...' : 'Delete Assignment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CurriculaPage

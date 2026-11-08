import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Users,
  GraduationCap,
  CalendarDays,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

import studentSectionService from '../../services/api/studentSectionService'
import academicTermService from '../../services/api/academicTermService'
import programService from '../../services/api/programService'

const initialForm = {
  termId: '',
  programId: '',
  sectionCode: '',
  yearLevel: '1',
  studentCount: '0',
}

const yearLevelOptions = [1, 2, 3, 4, 5]

let bulkEntrySequence = 0

const createBulkEntry = () => ({
  id: ++bulkEntrySequence,
  sectionCode: '',
  yearLevel: '1',
  studentCount: '0',
  saved: false,
  error: '',
})

const getArrayData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  return []
}

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'Something went wrong. Please try again.'

const getTermLabel = (term) =>
  term.termName ||
  term.academicTermName ||
  [
    term.academicYear,
    term.semester,
  ].filter(Boolean).join(' - ') ||
  `Academic Term ${term.termId}`

const getProgramLabel = (program) =>
  `${program.programCode || ''} - ${program.programName || ''}`.trim()

const getYearLevelLabel = (yearLevel) => {
  const value = Number(yearLevel)
  const suffix =
    value === 1 ? 'st' :
      value === 2 ? 'nd' :
        value === 3 ? 'rd' : 'th'

  return `${value}${suffix} Year`
}

const StudentSectionsPage = () => {
  const [sections, setSections] = useState([])
  const [terms, setTerms] = useState([])
  const [programs, setPrograms] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')

  const [modalType, setModalType] = useState('')
  const [selectedSection, setSelectedSection] = useState(null)

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [modalError, setModalError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkEntries, setBulkEntries] = useState([createBulkEntry()])
  const [entryToRemove, setEntryToRemove] = useState(null)

  const [viewSection, setViewSection] = useState(null)
  const [deleteSection, setDeleteSection] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadPageData = async () => {
    setPageError('')

    try {
      const [sectionData, termData, programData] = await Promise.all([
        studentSectionService.getAll(),
        academicTermService.getAllAcademicTerms(),
        programService.getAll(),
      ])

      setSections(getArrayData(sectionData))
      setTerms(getArrayData(termData))
      setPrograms(getArrayData(programData))
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([
      studentSectionService.getAll(),
      academicTermService.getAllAcademicTerms(),
      programService.getAll(),
    ])
      .then(([sectionData, termData, programData]) => {
        if (!isMounted) return

        setSections(getArrayData(sectionData))
        setTerms(getArrayData(termData))
        setPrograms(getArrayData(programData))
      })
      .catch((error) => {
        if (isMounted) {
          setPageError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return sections.filter((section) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          section.sectionCode,
          section.termName,
          section.programCode,
          section.programName,
        ].some((value) =>
          String(value || '').toLowerCase().includes(normalizedSearch),
        )

      const matchesTerm =
        !selectedTerm || String(section.termId) === selectedTerm

      const matchesProgram =
        !selectedProgram || String(section.programId) === selectedProgram

      return matchesSearch && matchesTerm && matchesProgram
    })
  }, [sections, searchTerm, selectedTerm, selectedProgram])

  const totalStudents = useMemo(
    () =>
      sections.reduce(
        (total, section) => total + (Number(section.studentCount) || 0),
        0,
      ),
    [sections],
  )

  const openAddModal = () => {
    setSelectedSection(null)
    setForm(initialForm)
    setErrors({})
    setModalError('')
    setBulkMode(false)
    setBulkEntries([createBulkEntry()])
    setEntryToRemove(null)
    setModalType('add')
  }

  const openEditModal = (section) => {
    setSelectedSection(section)
    setForm({
      termId: String(section.termId ?? ''),
      programId: String(section.programId ?? ''),
      sectionCode: section.sectionCode || '',
      yearLevel: String(section.yearLevel ?? '1'),
      studentCount: String(section.studentCount ?? '0'),
    })
    setErrors({})
    setModalError('')
    setBulkMode(false)
    setBulkEntries([createBulkEntry()])
    setEntryToRemove(null)
    setModalType('edit')
  }

  const closeFormModal = () => {
    if (isSaving) return

    setModalType('')
    setSelectedSection(null)
    setForm(initialForm)
    setErrors({})
    setModalError('')
    setBulkMode(false)
    setBulkEntries([createBulkEntry()])
    setEntryToRemove(null)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))

    setModalError('')
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.termId) {
      newErrors.termId = 'Please select an academic term.'
    }

    if (!form.programId) {
      newErrors.programId = 'Please select a program.'
    }

    if (!form.sectionCode.trim()) {
      newErrors.sectionCode = 'Section code is required.'
    } else if (form.sectionCode.trim().length > 30) {
      newErrors.sectionCode = 'Section code must not exceed 30 characters.'
    }

    if (!form.yearLevel || Number(form.yearLevel) < 1) {
      newErrors.yearLevel = 'Please select a valid year level.'
    } else if (!yearLevelOptions.includes(Number(form.yearLevel))) {
      newErrors.yearLevel = 'Please select a valid year level.'
    }

    if (
      form.studentCount === '' ||
      !Number.isInteger(Number(form.studentCount)) ||
      Number(form.studentCount) < 0
    ) {
      newErrors.studentCount = 'Student count must be a whole number of zero or greater.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBulkEntryChange = (entryId, fieldName, value) => {
    setBulkEntries((previous) => previous.map((entry) => (
      entry.id === entryId && !entry.saved
        ? { ...entry, [fieldName]: value, error: '' }
        : entry
    )))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[`${fieldName}-${entryId}`]
      return next
    })
    setModalError('')
  }

  const validateBulkEntries = () => {
    const newErrors = {}
    const seenCodes = new Set()

    if (!form.termId) newErrors.termId = 'Please select an academic term.'
    if (!form.programId) newErrors.programId = 'Please select a program.'

    bulkEntries.forEach((entry) => {
      if (entry.saved) return

      const code = entry.sectionCode.trim().toUpperCase()
      if (!code) {
        newErrors[`sectionCode-${entry.id}`] = 'Section code is required.'
      } else if (entry.sectionCode.trim().length > 30) {
        newErrors[`sectionCode-${entry.id}`] = 'Section code must not exceed 30 characters.'
      } else if (seenCodes.has(code)) {
        newErrors[`sectionCode-${entry.id}`] = 'Duplicate section code in this submission.'
      }
      if (code) seenCodes.add(code)

      if (!yearLevelOptions.includes(Number(entry.yearLevel))) {
        newErrors[`yearLevel-${entry.id}`] = 'Please select a valid year level.'
      }
      if (
        entry.studentCount === '' ||
        !Number.isInteger(Number(entry.studentCount)) ||
        Number(entry.studentCount) < 0
      ) {
        newErrors[`studentCount-${entry.id}`] = 'Enter a whole number of zero or greater.'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBulkSubmit = async () => {
    if (!validateBulkEntries()) return

    const pendingEntries = bulkEntries.filter((entry) => !entry.saved)
    if (pendingEntries.length === 0) {
      setModalError('All sections in this list have already been saved.')
      return
    }

    setIsSaving(true)
    setModalError('')
    let savedCount = bulkEntries.filter((entry) => entry.saved).length

    try {
      for (const entry of pendingEntries) {
        const payload = {
          termId: Number(form.termId),
          programId: Number(form.programId),
          sectionCode: entry.sectionCode.trim(),
          yearLevel: Number(entry.yearLevel),
          studentCount: Number(entry.studentCount),
        }

        try {
          await studentSectionService.create(payload)
          savedCount += 1
          setBulkEntries((previous) => previous.map((item) => (
            item.id === entry.id ? { ...item, saved: true, error: '' } : item
          )))
        } catch (error) {
          const message = getErrorMessage(error)
          setBulkEntries((previous) => previous.map((item) => (
            item.id === entry.id ? { ...item, error: message } : item
          )))
          setModalError(
            `${savedCount} section(s) saved. The remaining entries were not submitted after an error: ${message} Please correct the failed entry and submit again. Already saved entries will not be submitted again.`,
          )
          await loadPageData()
          return
        }
      }

      await loadPageData()
      setModalType('')
      setSelectedSection(null)
      setForm(initialForm)
      setErrors({})
      setModalError('')
      setBulkMode(false)
      setBulkEntries([createBulkEntry()])
      setEntryToRemove(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (modalType === 'add' && bulkMode) {
      await handleBulkSubmit()
      return
    }

    if (!validateForm()) return

    const payload = {
      termId: Number(form.termId),
      programId: Number(form.programId),
      sectionCode: form.sectionCode.trim(),
      yearLevel: Number(form.yearLevel),
      studentCount: Number(form.studentCount),
    }

    setIsSaving(true)
    setModalError('')

    try {
      if (modalType === 'edit' && selectedSection) {
        await studentSectionService.update(
          selectedSection.sectionId,
          payload,
        )
      } else {
        await studentSectionService.create(payload)
      }

      await loadPageData()

      // Close and reset only after the save succeeds.
      setModalType('')
      setSelectedSection(null)
      setForm(initialForm)
      setErrors({})
      setModalError('')
    } catch (error) {
      setModalError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteSection) return

    setIsDeleting(true)
    setDeleteError('')

    try {
      await studentSectionService.delete(deleteSection.sectionId)
      setDeleteSection(null)
      await loadPageData()
    } catch (error) {
      setDeleteError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  const inputClass = (fieldName) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
      errors[fieldName]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
    }`

  const closeDeleteModal = () => {
    if (isDeleting) return
    setDeleteSection(null)
    setDeleteError('')
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Student Sections
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage student sections by academic term, program, and year level.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17365D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102947]"
        >
          <Plus size={18} />
          Add Student Section
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Total Sections"
          value={sections.length}
          icon={<GraduationCap size={22} />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Total Students"
          value={totalStudents.toLocaleString()}
          icon={<Users size={22} />}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          title="Academic Terms"
          value={terms.length}
          icon={<CalendarDays size={22} />}
          iconClass="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Page error */}
      {pageError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{pageError}</div>
          <button
            type="button"
            onClick={loadPageData}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search section or program..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={selectedTerm}
            onChange={(event) => setSelectedTerm(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Academic Terms</option>
            {terms.map((term) => (
              <option key={term.termId} value={term.termId}>
                {getTermLabel(term)}
              </option>
            ))}
          </select>

          <select
            value={selectedProgram}
            onChange={(event) => setSelectedProgram(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Programs</option>
            {programs.map((program) => (
              <option key={program.programId} value={program.programId}>
                {getProgramLabel(program)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student sections table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">
              Student Sections
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredSections.length} record(s) found
            </p>
          </div>

          <button
            type="button"
            onClick={loadPageData}
            disabled={isLoading}
            title="Refresh"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading student sections...
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <GraduationCap
              size={36}
              className="mx-auto text-slate-300"
            />
            <h3 className="mt-3 font-semibold text-slate-700">
              No student sections found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Add a student section or adjust your search and filters.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Section Code</th>
                    <th className="px-5 py-3 font-semibold">Academic Term</th>
                    <th className="px-5 py-3 font-semibold">Program</th>
                    <th className="px-5 py-3 font-semibold">Year Level</th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Students
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSections.map((section) => (
                    <tr
                      key={section.sectionId}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {section.sectionCode}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {section.termName || section.termId}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div className="font-medium text-slate-700">
                          {section.programCode}
                        </div>
                        <div className="text-xs text-slate-500">
                          {section.programName}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {getYearLevelLabel(section.yearLevel)}
                      </td>
                      <td className="px-5 py-4 text-center text-slate-600">
                        {Number(section.studentCount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <ActionButtons
                          onView={() => setViewSection(section)}
                          onEdit={() => openEditModal(section)}
                          onDelete={() => {
                            setDeleteError('')
                            setDeleteSection(section)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredSections.map((section) => (
                <div key={section.sectionId} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {section.sectionCode}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {section.termName || section.termId}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {getYearLevelLabel(section.yearLevel)}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {section.programCode}
                    </p>
                    <p className="text-xs text-slate-500">
                      {section.programName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      {Number(section.studentCount || 0).toLocaleString()} students
                    </span>
                    <ActionButtons
                      onView={() => setViewSection(section)}
                      onEdit={() => openEditModal(section)}
                      onDelete={() => {
                        setDeleteError('')
                        setDeleteSection(section)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit modal */}
      {(modalType === 'add' || modalType === 'edit') && (
        <Modal onClose={closeFormModal}>
          <form onSubmit={handleSubmit}>
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {modalType === 'edit'
                    ? 'Edit Student Section'
                    : 'Add Student Section'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {modalType === 'edit'
                    ? 'Update the student section information.'
                    : 'Create one or multiple student sections for the selected academic term and program.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {modalError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {modalError}
                </div>
              )}

              {/* Academic Term */}
              <FormField
                label="Academic Term"
                required
                error={errors.termId}
              >
                <select
                  name="termId"
                  value={form.termId}
                  onChange={handleFormChange}
                  className={inputClass('termId')}
                  disabled={isSaving || (modalType === 'add' && bulkMode && bulkEntries.some((entry) => entry.saved))}
                >
                  <option value="">Select Academic Term</option>
                  {terms.map((term) => (
                    <option key={term.termId} value={term.termId}>
                      {getTermLabel(term)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Choose the academic term this section belongs to.
                </p>
              </FormField>

              {/* Program */}
              <FormField
                label="Program"
                required
                error={errors.programId}
              >
                <select
                  name="programId"
                  value={form.programId}
                  onChange={handleFormChange}
                  className={inputClass('programId')}
                  disabled={isSaving || (modalType === 'add' && bulkMode && bulkEntries.some((entry) => entry.saved))}
                >
                  <option value="">Select Program</option>
                  {programs.map((program) => (
                    <option
                      key={program.programId}
                      value={program.programId}
                    >
                      {getProgramLabel(program)}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Single section fields or repeatable bulk entries */}
              {modalType === 'add' && (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    checked={bulkMode}
                    onChange={(event) => {
                      setBulkMode(event.target.checked)
                      setErrors({})
                      setModalError('')
                      setEntryToRemove(null)
                    }}
                    disabled={isSaving || bulkEntries.some((entry) => entry.saved)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#17365D] focus:ring-[#17365D]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">Add multiple sections</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Register several sections under the selected academic term and program.</span>
                  </span>
                </label>
              )}

              {modalType === 'add' && bulkMode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Section Entries</h3>
                      <p className="mt-1 text-xs text-slate-500">Enter the details for each section.</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {bulkEntries.length} section(s)
                    </span>
                  </div>

                  {bulkEntries.map((entry, index) => (
                    <div key={entry.id} className={`rounded-lg border p-3 ${entry.saved ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">Section {index + 1}</span>
                          {entry.saved && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Saved</span>
                          )}
                        </div>
                        {!entry.saved && bulkEntries.filter((item) => !item.saved).length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEntryToRemove(entry.id)}
                            disabled={isSaving}
                            title="Remove this section entry"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <FormField label="Section Code" required error={errors[`sectionCode-${entry.id}`] || entry.error}>
                          <input
                            type="text"
                            value={entry.sectionCode}
                            onChange={(event) => handleBulkEntryChange(entry.id, 'sectionCode', event.target.value)}
                            placeholder="e.g. BSIT-1A"
                            maxLength={30}
                            disabled={isSaving || entry.saved}
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${errors[`sectionCode-${entry.id}`] || entry.error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`}
                          />
                        </FormField>

                        <FormField label="Year Level" required error={errors[`yearLevel-${entry.id}`]}>
                          <select
                            value={entry.yearLevel}
                            onChange={(event) => handleBulkEntryChange(entry.id, 'yearLevel', event.target.value)}
                            disabled={isSaving || entry.saved}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                          >
                            <option value="">Select Year</option>
                            {yearLevelOptions.map((year) => <option key={year} value={year}>{getYearLevelLabel(year)}</option>)}
                          </select>
                        </FormField>

                        <FormField label="Student Count" required error={errors[`studentCount-${entry.id}`]}>
                          <input
                            type="number"
                            value={entry.studentCount}
                            onChange={(event) => handleBulkEntryChange(entry.id, 'studentCount', event.target.value)}
                            min="0"
                            step="1"
                            placeholder="e.g. 35"
                            disabled={isSaving || entry.saved}
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${errors[`studentCount-${entry.id}`] ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`}
                          />
                        </FormField>
                      </div>
                    </div>
                  ))}

                  {entryToRemove !== null && (
                    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-amber-800">Remove this section entry from the list?</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEntryToRemove(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Keep</button>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkEntries((previous) => previous.filter((entry) => entry.id !== entryToRemove))
                            setErrors((previous) => {
                              const next = { ...previous }
                              delete next[`sectionCode-${entryToRemove}`]
                              delete next[`yearLevel-${entryToRemove}`]
                              delete next[`studentCount-${entryToRemove}`]
                              return next
                            })
                            setEntryToRemove(null)
                          }}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >Remove entry</button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setBulkEntries((previous) => [...previous, createBulkEntry()])
                      setEntryToRemove(null)
                    }}
                    disabled={isSaving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                  >
                    <Plus size={17} /> Add another section
                  </button>
                </div>
              ) : (
                <>
                  {/* Section Code */}
                  <FormField label="Section Code" required error={errors.sectionCode}>
                    <input
                      type="text"
                      name="sectionCode"
                      value={form.sectionCode}
                      onChange={handleFormChange}
                      placeholder="e.g. BSIT-1A"
                      maxLength={30}
                      className={inputClass('sectionCode')}
                      disabled={isSaving}
                    />
                    <p className="mt-1 text-xs text-slate-500">Enter a unique section identifier.</p>
                  </FormField>

                  {/* Year Level and Student Count */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Year Level" required error={errors.yearLevel}>
                      <select name="yearLevel" value={form.yearLevel} onChange={handleFormChange} className={inputClass('yearLevel')} disabled={isSaving}>
                        <option value="">Select Year</option>
                        {yearLevelOptions.map((year) => <option key={year} value={year}>{getYearLevelLabel(year)}</option>)}
                      </select>
                    </FormField>

                    <FormField label="Student Count" required error={errors.studentCount}>
                      <input type="number" name="studentCount" value={form.studentCount} onChange={handleFormChange} min="0" step="1" placeholder="e.g. 35" className={inputClass('studentCount')} disabled={isSaving} />
                    </FormField>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeFormModal}
                disabled={isSaving}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17365D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102947] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    {modalType === 'edit' ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {modalType === 'edit' ? (
                      <Pencil size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                    {modalType === 'edit'
                      ? 'Save Changes'
                      : bulkMode
                        ? `Save ${bulkEntries.filter((entry) => !entry.saved).length} Section(s)`
                        : 'Create Section'}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View modal */}
      {viewSection && (
        <Modal onClose={() => setViewSection(null)}>
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Student Section Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View the details of this student section.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewSection(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
            <DetailItem
              label="Section Code"
              value={viewSection.sectionCode}
            />
            <DetailItem
              label="Academic Term"
              value={viewSection.termName || viewSection.termId}
            />
            <DetailItem
              label="Program"
              value={`${viewSection.programCode || ''} ${viewSection.programName || ''}`}
            />
            <DetailItem
              label="Year Level"
              value={getYearLevelLabel(viewSection.yearLevel)}
            />
            <DetailItem
              label="Student Count"
              value={Number(viewSection.studentCount || 0).toLocaleString()}
            />
          </div>

          <div className="flex justify-end border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={() => setViewSection(null)}
              className="rounded-lg bg-[#17365D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102947]"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteSection && (
        <Modal onClose={closeDeleteModal} maxWidth="max-w-md">
          <div className="p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-center text-lg font-bold text-slate-800">
              Delete Student Section?
            </h2>

            <p className="mt-2 text-center text-sm text-slate-500">
              Are you sure you want to delete section{' '}
              <span className="font-semibold text-slate-700">
                {deleteSection.sectionCode}
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting && (
                  <RefreshCw size={16} className="animate-spin" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete Section'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* Reusable components */

const SummaryCard = ({ title, value, icon, iconClass }) => (
  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`rounded-lg p-3 ${iconClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
)

const FormField = ({ label, required, error, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
        <AlertCircle size={13} />
        {error}
      </p>
    )}
  </div>
)

const DetailItem = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">
      {value || '—'}
    </p>
  </div>
)

const ActionButtons = ({ onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-center gap-1">
    <button
      type="button"
      onClick={onView}
      title="View"
      className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
    >
      <Eye size={17} />
    </button>

    <button
      type="button"
      onClick={onEdit}
      title="Edit"
      className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
    >
      <Pencil size={17} />
    </button>

    <button
      type="button"
      onClick={onDelete}
      title="Delete"
      className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 size={17} />
    </button>
  </div>
)

const Modal = ({ children, onClose, maxWidth = 'max-w-2xl' }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}
  >
    <div
      className={`my-auto w-full ${maxWidth} overflow-hidden rounded-xl bg-white shadow-xl`}
    >
      {children}
    </div>
  </div>
)

export default StudentSectionsPage
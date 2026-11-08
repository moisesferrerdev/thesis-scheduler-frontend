import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  GraduationCap,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'

import academicTermService from '../../services/api/academicTermService'

const SEMESTERS = [
  { value: '1st Semester', label: 'First Semester' },
  { value: '2nd Semester', label: 'Second Semester' },
  { value: 'Summer', label: 'Summer' },
]

const emptyForm = {
  termName: '',
  academicYear: '',
  semester: '',
  startDate: '',
  endDate: '',
  status: 'UPCOMING',
}

const statusStyles = {
  ACTIVE: 'bg-green-50 text-green-700',
  UPCOMING: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
}

function formatDate(date) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )
}

function getSemesterLabel(value) {
  return (
    SEMESTERS.find((semester) => semester.value === value)?.label ||
    value ||
    '—'
  )
}

function generateTermName(semester, academicYear) {
  if (!semester || !academicYear) return ''

  return `${getSemesterLabel(semester)} - ${academicYear}`
}

function generateAcademicYears(terms) {
  const currentYear = new Date().getFullYear()

  const existingYears = terms
    .map((term) => Number(term.academicYear?.split('-')[0]))
    .filter(Number.isFinite)

  const earliestYear = Math.min(
    currentYear,
    ...existingYears
  )

  const years = []

  for (
    let year = earliestYear;
    year <= currentYear + 10;
    year++
  ) {
    years.push(`${year}-${year + 1}`)
  }

  return [
    ...new Set([
      ...years,
      ...terms.map((term) => term.academicYear).filter(Boolean),
    ]),
  ].sort(
    (a, b) =>
      Number(a.split('-')[0]) - Number(b.split('-')[0])
  )
}

function getAvailableSemesters(
  year,
  terms,
  excludedTermId = null
) {
  return SEMESTERS.filter((semester) => {
    return !terms.some(
      (term) =>
        term.academicYear === year &&
        term.semester === semester.value &&
        term.termId !== excludedTermId
    )
  })
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Something went wrong. Please try again.'
  )
}

function AcademicTermsPage() {
  const [terms, setTerms] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [modalType, setModalType] = useState(null)
  const [selectedTerm, setSelectedTerm] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load academic terms from backend
  const loadAcademicTerms = useCallback(async () => {
    setPageError('')

    try {
      const response =
        await academicTermService.getAllAcademicTerms()

      setTerms(Array.isArray(response) ? response : [])
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }, [])

  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true)
      await loadAcademicTerms()
      setIsLoading(false)
    }

    initializePage()
  }, [loadAcademicTerms])

  // Search and filter
  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      const search = searchTerm.toLowerCase()

      const matchesSearch =
        (term.termName || '').toLowerCase().includes(search) ||
        (term.academicYear || '').toLowerCase().includes(search) ||
        (term.semester || '').toLowerCase().includes(search)

      const matchesStatus =
        statusFilter === 'ALL' ||
        term.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [terms, searchTerm, statusFilter])

  // Summary counts
  const activeCount = terms.filter(
    (term) => term.status === 'ACTIVE'
  ).length

  // Academic year options
  const academicYearOptions = generateAcademicYears(terms)

  const availableAcademicYears = academicYearOptions.filter(
    (year) => {
      const excludedId =
        modalType === 'edit'
          ? selectedTerm?.termId
          : null

      return getAvailableSemesters(
        year,
        terms,
        excludedId
      ).length > 0
    }
  )

  // Semester options for selected academic year
  const availableSemesters = getAvailableSemesters(
    formData.academicYear,
    terms,
    modalType === 'edit'
      ? selectedTerm?.termId
      : null
  )

  // Open Add modal
  const openAddModal = () => {
    setSelectedTerm(null)
    setFormData(emptyForm)
    setFormError('')
    setModalType('add')
  }

  // Open Edit modal
  const openEditModal = (term) => {
    setSelectedTerm(term)

    setFormData({
      termName: term.termName || '',
      academicYear: term.academicYear || '',
      semester: term.semester || '',
      startDate: term.startDate || '',
      endDate: term.endDate || '',
      status: term.status || 'UPCOMING',
    })

    setFormError('')
    setModalType('edit')
  }

  // Open View modal
  const openViewModal = (term) => {
    setSelectedTerm(term)
    setModalType('view')
  }

  // Open Delete modal
  const openDeleteModal = (term) => {
    setSelectedTerm(term)
    setModalType('delete')
  }

  // Close modal
  const closeModal = () => {
    if (isSaving || isDeleting) return

    setModalType(null)
    setSelectedTerm(null)
    setFormData(emptyForm)
    setFormError('')
  }

  // Handle form changes
  const handleInputChange = (event) => {
    const { name, value } = event.target

    if (name === 'academicYear') {
      const excludedId =
        modalType === 'edit'
          ? selectedTerm?.termId
          : null

      const available = getAvailableSemesters(
        value,
        terms,
        excludedId
      )

      const selectedSemester = available[0]?.value || ''

      setFormData((previous) => ({
        ...previous,
        academicYear: value,
        semester: selectedSemester,
        termName: generateTermName(selectedSemester, value),
      }))

      setFormError('')
      return
    }

    if (name === 'semester') {
      setFormData((previous) => ({
        ...previous,
        semester: value,
        termName: generateTermName(
          value,
          previous.academicYear
        ),
      }))

      setFormError('')
      return
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setFormError('')
  }

  // Add or update academic term
  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSaving) return

    if (
      !formData.academicYear ||
      !formData.semester ||
      !formData.startDate ||
      !formData.endDate
    ) {
      setFormError('Please complete all required fields.')
      return
    }

    if (formData.startDate > formData.endDate) {
      setFormError(
        'End date must be after the start date.'
      )
      return
    }

    // Prevent duplicate academic year and semester
    const duplicateTerm = terms.some(
      (term) =>
        term.academicYear === formData.academicYear &&
        term.semester === formData.semester &&
        term.termId !== selectedTerm?.termId
    )

    if (duplicateTerm) {
      setFormError(
        'This semester is already registered for the selected academic year.'
      )
      return
    }

    const payload = {
      termName: generateTermName(
        formData.semester,
        formData.academicYear
      ),
      academicYear: formData.academicYear,
      semester: formData.semester,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
    }

    setIsSaving(true)
    setFormError('')

    try {
      if (modalType === 'add') {
        await academicTermService.createAcademicTerm(payload)
      } else {
        await academicTermService.updateAcademicTerm(
          selectedTerm.termId,
          payload
        )
      }

      await loadAcademicTerms()

      setModalType(null)
      setSelectedTerm(null)
      setFormData(emptyForm)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  // Delete academic term
  const handleDelete = async () => {
    if (!selectedTerm || isDeleting) return

    setIsDeleting(true)

    try {
      await academicTermService.deleteAcademicTerm(
        selectedTerm.termId
      )

      await loadAcademicTerms()

      setModalType(null)
      setSelectedTerm(null)
    } catch (error) {
      setPageError(getErrorMessage(error))
      setModalType(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusLabel = (status) => {
    if (!status) return '—'

    return status.charAt(0) + status.slice(1).toLowerCase()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Academic Terms
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage academic years, semesters, and their active status.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={loadAcademicTerms}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={isLoading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#172B4D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243D63]"
          >
            <Plus size={18} />
            Add Term
          </button>
        </div>
      </section>

      {/* Page Error */}
      {pageError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{pageError}</span>

          <button
            type="button"
            onClick={() => setPageError('')}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Terms
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {terms.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <GraduationCap size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Terms
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {activeCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <CheckCircle2 size={23} />
            </div>
          </div>
        </div>
      </section>

      {/* Academic Terms Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Academic Term Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage registered academic terms.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search academic terms..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-40"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Academic Year</th>
                <th className="px-5 py-4 font-semibold">Term</th>
                <th className="px-5 py-4 font-semibold">Start Date</th>
                <th className="px-5 py-4 font-semibold">End Date</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading academic terms...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredTerms.map((term) => (
                    <tr
                      key={term.termId}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {term.academicYear}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {term.termName ||
                          generateTermName(term.semester, term.academicYear)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(term.startDate)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(term.endDate)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusStyles[term.status] ??
                            statusStyles.COMPLETED
                          }`}
                        >
                          {getStatusLabel(term.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openViewModal(term)}
                            title="View term"
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(term)}
                            title="Edit term"
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(term)}
                            title="Delete term"
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredTerms.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <CalendarDays
                          size={30}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 font-medium text-slate-700">
                          No academic terms found
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your search or filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">
            Showing {filteredTerms.length} of {terms.length} academic terms
          </p>
        </div>
      </section>

      {/* Add, Edit, View and Delete Modals */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="my-auto w-full max-w-xl rounded-xl bg-white shadow-xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  {modalType === 'add' && 'Add Academic Term'}
                  {modalType === 'edit' && 'Edit Academic Term'}
                  {modalType === 'view' && 'Academic Term Details'}
                  {modalType === 'delete' && 'Delete Academic Term'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {modalType === 'delete'
                    ? 'Confirm whether you want to remove this record.'
                    : 'Academic term information'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* View Modal */}
            {modalType === 'view' && selectedTerm && (
              <div className="space-y-4 p-6">
                {[
                  ['Academic Year', selectedTerm.academicYear],
                  [
                    'Term Name',
                    selectedTerm.termName ||
                      generateTermName(
                        selectedTerm.semester,
                        selectedTerm.academicYear
                      ),
                  ],
                  [
                    'Semester',
                    getSemesterLabel(selectedTerm.semester),
                  ],
                  ['Start Date', formatDate(selectedTerm.startDate)],
                  ['End Date', formatDate(selectedTerm.endDate)],
                  ['Status', getStatusLabel(selectedTerm.status)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-slate-100 pb-3"
                  >
                    <span className="text-sm text-slate-500">
                      {label}
                    </span>

                    <span className="text-right text-sm font-medium text-slate-800">
                      {value}
                    </span>
                  </div>
                ))}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Add and Edit Modal */}
            {(modalType === 'add' || modalType === 'edit') && (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 p-6"
              >
                {/* Academic Year */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Academic Year *
                  </label>

                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    required
                    disabled={isSaving}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">Select Academic Year</option>

                    {availableAcademicYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Semester *
                  </label>

                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                    disabled={
                      isSaving ||
                      !formData.academicYear ||
                      availableSemesters.length === 0
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">Select Semester</option>

                    {availableSemesters.map((semester) => (
                      <option
                        key={semester.value}
                        value={semester.value}
                      >
                        {semester.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Generated Term Name Preview */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Term Name
                  </label>

                  <input
                    type="text"
                    value={generateTermName(
                      formData.semester,
                      formData.academicYear
                    )}
                    readOnly
                    placeholder="Automatically generated"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Generated automatically from the selected semester and academic year.
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Start Date *
                    </label>

                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      disabled={isSaving}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      End Date *
                    </label>

                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      disabled={isSaving}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status *
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    disabled={isSaving}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                {/* Validation Error */}
                {formError && (
                  <p role="alert" className="text-sm text-red-600">
                    {formError}
                  </p>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSaving}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-lg bg-[#172B4D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243D63] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving
                      ? 'Saving...'
                      : modalType === 'add'
                        ? 'Create Term'
                        : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Delete Modal */}
            {modalType === 'delete' && selectedTerm && (
              <div className="space-y-5 p-6">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <Trash2 size={19} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-700">
                      Are you sure you want to delete{' '}
                      <strong>
                        {selectedTerm.termName ||
                          generateTermName(
                            selectedTerm.semester,
                            selectedTerm.academicYear
                          )}
                      </strong>
                      ?
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      This action will permanently remove the academic term if the backend allows deletion.
                    </p>
                  </div>
                </div>

                {pageError && (
                  <p role="alert" className="text-sm text-red-600">
                    {pageError}
                  </p>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isDeleting}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Term'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AcademicTermsPage
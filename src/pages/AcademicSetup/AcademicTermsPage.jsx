
import { useMemo, useState } from 'react'
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
} from 'lucide-react'

import initialAcademicTerms from '../../data/mock/academicTerms'

// Available semester options
const SEMESTERS = [
  { value: 'FIRST', label: 'First Semester' },
  { value: 'SECOND', label: 'Second Semester' },
  { value: 'SUMMER', label: 'Summer' },
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

// Format dates for display
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

// Generate academic years automatically
function generateAcademicYears(terms) {
  const currentYear = new Date().getFullYear()

  const existingYears = terms
    .map((term) => Number(term.academicYear.split('-')[0]))
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
      ...terms.map((term) => term.academicYear),
    ]),
  ].sort(
    (a, b) =>
      Number(a.split('-')[0]) - Number(b.split('-')[0])
  )
}

// Get semesters that have not yet been registered
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

function AcademicTermsPage() {
  const [terms, setTerms] = useState(initialAcademicTerms)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [modalType, setModalType] = useState(null)
  const [selectedTerm, setSelectedTerm] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  // Search and filter
  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      const search = searchTerm.toLowerCase()

      const matchesSearch =
        term.termName.toLowerCase().includes(search) ||
        term.academicYear.toLowerCase().includes(search) ||
        term.semester.toLowerCase().includes(search)

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

  // Generate and filter academic year options
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

  // Available semesters for the selected academic year
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
      termName: term.termName,
      academicYear: term.academicYear,
      semester: term.semester,
      startDate: term.startDate,
      endDate: term.endDate,
      status: term.status,
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
    setModalType(null)
    setSelectedTerm(null)
    setFormError('')
  }

  // Handle form changes
  const handleInputChange = (event) => {
    const { name, value } = event.target

    // When academic year changes,
    // automatically select the first available semester
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

      setFormData((previous) => ({
        ...previous,
        academicYear: value,
        semester: available[0]?.value ?? '',
        termName: available[0]?.label ?? '',
      }))

      setFormError('')
      return
    }

    // Keep termName and semester synchronized
    if (name === 'semester') {
      const selectedSemester = SEMESTERS.find(
        (semester) => semester.value === value
      )

      setFormData((previous) => ({
        ...previous,
        semester: value,
        termName: selectedSemester?.label ?? '',
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
  const handleSubmit = (event) => {
    event.preventDefault()

    if (
      !formData.termName.trim() ||
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

    if (modalType === 'add') {
      const newTerm = {
        ...formData,
        termId:
          Math.max(0, ...terms.map((term) => term.termId)) + 1,
      }

      setTerms((previous) => [
        ...previous,
        newTerm,
      ])
    } else {
      setTerms((previous) =>
        previous.map((term) =>
          term.termId === selectedTerm.termId
            ? { ...term, ...formData }
            : term
        )
      )
    }

    closeModal()
  }

  // Delete academic term
  const handleDelete = () => {
    setTerms((previous) =>
      previous.filter(
        (term) => term.termId !== selectedTerm.termId
      )
    )

    closeModal()
  }

  const getStatusLabel = (status) => {
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

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#172B4D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243D63]"
        >
          <Plus size={18} />
          Add Term
        </button>
      </section>

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
              {filteredTerms.map((term) => (
                <tr
                  key={term.termId}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {term.academicYear}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {term.termName}
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
                        statusStyles[term.status] ?? statusStyles.COMPLETED
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
                  ['Term Name', selectedTerm.termName],
                  ['Semester', selectedTerm.semester],
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    disabled={!formData.academicYear || availableSemesters.length === 0}
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
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-lg bg-[#172B4D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243D63]"
                  >
                    {modalType === 'add'
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
                      <strong>{selectedTerm.termName}</strong> for{' '}
                      <strong>{selectedTerm.academicYear}</strong>?
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      This removes the record from the current mock session.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Delete Term
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

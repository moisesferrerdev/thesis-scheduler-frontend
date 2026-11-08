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

  ChevronDown,

} from 'lucide-react'

import subjectService from '../../services/api/subjectService'
import programService from '../../services/api/programService'
import curriculumService from '../../services/api/curriculumService'

const emptyForm = {

  subjectCode: '',

  subjectName: '',

  description: '',

  lectureHours: '',

  laboratoryHours: '',

  units: '',

  status: 'ACTIVE',

}

// Current school year selected in the scheduler.
const CURRENT_CURRICULUM_YEAR = '2026-2027'

const createEmptyAssignment = () => ({
  curriculumId: null,
  programId: '',
  yearLevel: '',
  semester: '',
  required: 'true',
  curriculumYear: CURRENT_CURRICULUM_YEAR,
})

function SubjectsPage() {

  // Subject records and API states

  const [subjects, setSubjects] = useState([])

  const [isLoading, setIsLoading] = useState(true)

  const [isSaving, setIsSaving] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  const [pageError, setPageError] = useState('')

  // Search and filter states

  const [searchTerm, setSearchTerm] = useState('')

  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modal and form states

  const [modalType, setModalType] = useState(null)

  const [selectedSubject, setSelectedSubject] = useState(null)

  const [formData, setFormData] = useState(emptyForm)

  const [errors, setErrors] = useState({})
  const [programs, setPrograms] = useState([])
  const [curricula, setCurricula] = useState([])
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true)
  const [assignments, setAssignments] = useState([createEmptyAssignment()])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)

  const getErrorMessage = (error) => {

    return (

      error.response?.data?.message ||

      error.response?.data?.error ||

      error.message ||

      'Something went wrong. Please try again.'

    )

  }

  // Load subjects from the backend

  const fetchSubjects = async () => {

    try {

      setPageError('')

      const data = await subjectService.getAll()

      setSubjects(Array.isArray(data) ? data : [])

    } catch (error) {

      setPageError(getErrorMessage(error))

    }

  }

  // Initial API request

  useEffect(() => {

    let ignore = false

    const loadSubjects = async () => {

      try {

        const data = await subjectService.getAll()

        if (!ignore) {

          setSubjects(Array.isArray(data) ? data : [])

        }

      } catch (error) {

        if (!ignore) {

          setPageError(getErrorMessage(error))

        }

      } finally {

        if (!ignore) {

          setIsLoading(false)

        }

      }

    }

    loadSubjects()

    programService.getAll()
      .then((data) => { if (!ignore) setPrograms(Array.isArray(data) ? data : []) })
      .catch((error) => { if (!ignore) setPageError(getErrorMessage(error)) })
      .finally(() => { if (!ignore) setIsLoadingPrograms(false) })

    curriculumService.getAll()
      .then((data) => { if (!ignore) setCurricula(Array.isArray(data) ? data : []) })
      .catch((error) => { if (!ignore) setPageError(getErrorMessage(error)) })

    return () => {

      ignore = true

    }

  }, [])

  // Summary calculations

  const totalSubjects = subjects.length

  const activeSubjects = subjects.filter(

    (subject) => subject.status === 'ACTIVE'

  ).length

  // Search and status filtering

  const filteredSubjects = useMemo(() => {

    return subjects.filter((subject) => {

      const search = searchTerm.trim().toLowerCase()

      const matchesSearch =

        (subject.subjectCode || '').toLowerCase().includes(search) ||

        (subject.subjectName || '').toLowerCase().includes(search)

      const matchesStatus =

        statusFilter === 'ALL' || subject.status === statusFilter

      return matchesSearch && matchesStatus

    })

  }, [subjects, searchTerm, statusFilter])

  // Open Add modal

  const openAddModal = () => {

    setSelectedSubject(null)

    setFormData(emptyForm)

    setAssignments([createEmptyAssignment()])

    setErrors({})

    setModalType('add')

  }

  // Open Edit modal

  const openEditModal = async (subject) => {
    setSelectedSubject(subject)
    setFormData({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      description: subject.description || '',
      lectureHours: String(subject.lectureHours ?? ''),
      laboratoryHours: String(subject.laboratoryHours ?? ''),
      units: String(subject.units ?? ''),
      status: subject.status,
    })
    setErrors({})
    setModalType('edit')
    setIsLoadingAssignments(true)

    try {
      const data = await curriculumService.getAll()
      setCurricula(data)
      const subjectAssignments = data
        .filter((item) => Number(item.subjectId) === Number(subject.subjectId))
        .map((item) => ({
          curriculumId: item.curriculumId,
          programId: String(item.programId),
          yearLevel: String(item.yearLevel),
          semester: item.semester,
          required: String(item.required),
          curriculumYear: item.curriculumYear || CURRENT_CURRICULUM_YEAR,
        }))
      setAssignments(subjectAssignments.length ? subjectAssignments : [createEmptyAssignment()])
    } catch (error) {
      setPageError(getErrorMessage(error))
      setAssignments([createEmptyAssignment()])
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  // Open View modal

  const openViewModal = (subject) => {

    setSelectedSubject(subject)

    setModalType('view')

  }

  // Open Delete modal

  const openDeleteModal = (subject) => {

    setSelectedSubject(subject)

    setModalType('delete')

  }

  // Close modal

  const closeModal = () => {

    setModalType(null)

    setSelectedSubject(null)

    setFormData(emptyForm)

    setAssignments([createEmptyAssignment()])

    setErrors({})

  }

  // Handle form input changes

  const handleInputChange = (event) => {

    const { name, value } = event.target

    setFormData((previous) => ({

      ...previous,

      [name]: name === 'subjectCode' ? value.toUpperCase() : value,

    }))

    setErrors((previous) => ({

      ...previous,

      [name]: '',

    }))

  }

  const updateAssignment = (index, field, value) => {
    setAssignments((previous) => previous.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    ))
    setErrors((previous) => ({ ...previous, assignments: '' }))
  }

  const addAssignment = () => setAssignments((previous) => [...previous, createEmptyAssignment()])

  const removeAssignment = (index) => {
    setAssignments((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
  }

  // Validate decimal values according to @Digits(3, 1)

  const validateDecimal = (value) => {

    if (value === '' || value === null || value === undefined) {

      return false

    }

    const decimalPattern = /^\d{1,3}(\.\d)?$/

    return decimalPattern.test(String(value)) && Number(value) >= 0

  }

  // Validate subject form

  const validateForm = () => {

    const newErrors = {}

    if (!formData.subjectCode.trim()) {

      newErrors.subjectCode = 'Subject code is required.'

    }

    if (!formData.subjectName.trim()) {

      newErrors.subjectName = 'Subject name is required.'

    }

    if (!validateDecimal(formData.lectureHours)) {

      newErrors.lectureHours =

        'Enter a valid non-negative number with up to 3 digits and 1 decimal place.'

    }

    if (!validateDecimal(formData.laboratoryHours)) {

      newErrors.laboratoryHours =

        'Enter a valid non-negative number with up to 3 digits and 1 decimal place.'

    }

    if (!validateDecimal(formData.units)) {

      newErrors.units =

        'Enter a valid non-negative number with up to 3 digits and 1 decimal place.'

    }

    if (!formData.status.trim()) {

      newErrors.status = 'Status is required.'

    }

    // At least one valid program assignment is required.
    if (assignments.length === 0) {
      newErrors.assignments = 'Add at least one program assignment.'
    }

    assignments.forEach((assignment, index) => {
      if (!assignment.programId) {
        newErrors[`assignment-${index}-program`] = 'Select a program.'
      }

      if (!assignment.yearLevel) {
        newErrors[`assignment-${index}-year`] = 'Select a year level.'
      }

      if (!assignment.semester) {
        newErrors[`assignment-${index}-semester`] = 'Select a semester.'
      }
    })

    const duplicateAssignments = assignments.some((assignment, index) =>
      assignments.some((other, otherIndex) =>
        otherIndex !== index &&
        assignment.programId &&
        assignment.programId === other.programId &&
        assignment.yearLevel === other.yearLevel &&
        assignment.semester === other.semester
      )
    )

    if (duplicateAssignments) {
      newErrors.assignments = 'The same program, year level, and semester cannot be assigned more than once.'
    }

    const duplicateCode = subjects.some((subject) => {

      const isSameCode =

        (subject.subjectCode || '').toLowerCase() ===

        formData.subjectCode.trim().toLowerCase()

      const isDifferentRecord =

        subject.subjectId !== selectedSubject?.subjectId

      return isSameCode && isDifferentRecord

    })

    if (duplicateCode) {

      newErrors.subjectCode = 'This subject code already exists.'

    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0

  }

  // Create or update subject through the backend

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isLoadingAssignments || isLoadingPrograms) {
      setPageError('Please wait until program and curriculum data finish loading before saving.')
      return
    }
    if (!validateForm()) return

    const normalizedData = {
      ...formData,
      subjectCode: formData.subjectCode.trim().toUpperCase(),
      subjectName: formData.subjectName.trim(),
      description: formData.description.trim(),
      lectureHours: Number(formData.lectureHours),
      laboratoryHours: Number(formData.laboratoryHours),
      units: Number(formData.units),
      status: formData.status.trim().toUpperCase(),
    }

    try {
      setIsSaving(true)
      setPageError('')

      let subjectId = selectedSubject?.subjectId
      if (modalType === 'add') {
        const createdSubject = await subjectService.create(normalizedData)
        subjectId = createdSubject.subjectId
      } else {
        await subjectService.update(subjectId, normalizedData)
      }

      // Create/update each Curriculum association separately through the existing API.
      // Existing associations removed from this form are intentionally not deleted;
      // manage removals from the Curricula page to avoid deleting referenced records.
      for (const assignment of assignments) {
        const request = {
          programId: Number(assignment.programId),
          subjectId: Number(subjectId),
          curriculumYear: assignment.curriculumYear || CURRENT_CURRICULUM_YEAR,
          yearLevel: Number(assignment.yearLevel),
          semester: assignment.semester,
          required: assignment.required === 'true',
        }

        if (assignment.curriculumId) {
          await curriculumService.update(assignment.curriculumId, request)
        } else {
          await curriculumService.create(request)
        }
      }

      await Promise.all([
        fetchSubjects(),
        curriculumService.getAll().then((data) => setCurricula(Array.isArray(data) ? data : [])),
      ])
      closeModal()
    } catch (error) {
      setPageError(`Subject/assignment save was not fully completed: ${getErrorMessage(error)}. Please review the records before retrying.`)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete subject through the backend

  const handleDelete = async () => {

    try {

      setIsDeleting(true)

      setPageError('')

      // A subject is a master record. Remove its curriculum associations first
      // from the Curricula page; never cascade-delete those associations here.
      const latestCurricula = await curriculumService.getAll()
      const linkedCurricula = (Array.isArray(latestCurricula) ? latestCurricula : [])
        .filter((item) => Number(item.subjectId) === Number(selectedSubject.subjectId))

      if (linkedCurricula.length > 0) {
        throw new Error(`This subject is assigned to ${linkedCurricula.length} curriculum record(s). Remove those assignments from the Curricula page before deleting the subject.`)
      }

      await subjectService.delete(selectedSubject.subjectId)

      await fetchSubjects()

      closeModal()

    } catch (error) {

      setPageError(getErrorMessage(error))

    } finally {

      setIsDeleting(false)

    }

  }

  // Status badge styling

  const getStatusStyle = (status) => {

    return status === 'ACTIVE'

      ? 'bg-green-50 text-green-700 ring-green-600/20'

      : 'bg-slate-100 text-slate-600 ring-slate-500/20'

  }

  // Reusable numeric form field

  const renderNumberField = (name, label) => (

    <div>

      <label className="mb-1.5 block text-sm font-medium text-slate-700">

        {label} <span className="text-red-500">*</span>

      </label>

      <input

        type="number"

        name={name}

        value={formData[name]}

        onChange={handleInputChange}

        min="0"

        max="999.9"

        step="0.1"

        placeholder="0.0"

        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${

          errors[name]

            ? 'border-red-400 focus:border-red-400'

            : 'border-slate-300 focus:border-blue-500'

        }`}

      />

      {errors[name] && (

        <p className="mt-1 text-xs text-red-600">

          {errors[name]}

        </p>

      )}

    </div>

  )

  return (

    <div className="space-y-6">

      {/* Page Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-900">

            Subjects

          </h1>

          <p className="mt-1 text-sm text-slate-500">

            Manage the master catalog of academic subjects.

          </p>

        </div>

        <button

          onClick={openAddModal}

          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17365D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102947]"

        >

          <Plus size={18} />

          Add Subject

        </button>

      </div>

      {/* API Error Message */}

      {pageError && (

        <div

          role="alert"

          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"

        >

          {pageError}

        </div>

      )}

      {/* Loading Message */}

      {isLoading && (

        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">

          Loading subjects...

        </div>

      )}

      {/* Summary Cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">

                Total Subjects

              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">

                {totalSubjects}

              </h2>

            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">

              <BookOpen size={24} />

            </div>

          </div>

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">

                Active Subjects

              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">

                {activeSubjects}

              </h2>

            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-700">

              <CheckCircle2 size={24} />

            </div>

          </div>

        </div>

      </div>

      {/* Subject Records */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 p-5">

          <h2 className="font-semibold text-slate-900">

            Subject Records

          </h2>

          <p className="mt-1 text-sm text-slate-500">

            View and manage registered master subject records.

          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">

            <div className="relative flex-1">

              <Search

                size={18}

                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

              />

              <input

                type="text"

                value={searchTerm}

                onChange={(event) => setSearchTerm(event.target.value)}

                placeholder="Search by subject code or name..."

                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

              />

            </div>

            <div className="relative sm:w-48">

              <select

                value={statusFilter}

                onChange={(event) => setStatusFilter(event.target.value)}

                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

              >

                <option value="ALL">All Statuses</option>

                <option value="ACTIVE">Active</option>

                <option value="INACTIVE">Inactive</option>

              </select>

              <ChevronDown

                size={16}

                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"

              />

            </div>

          </div>

        </div>

        {/* Desktop Table */}

        <div className="hidden overflow-x-auto md:block">

          <table className="w-full text-left text-sm">

            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">

              <tr>

                <th className="px-5 py-4 font-semibold">

                  Subject Code

                </th>

                <th className="px-5 py-4 font-semibold">

                  Subject Name

                </th>

                <th className="px-5 py-4 text-center font-semibold">

                  Units

                </th>

                <th className="px-5 py-4 text-center font-semibold">

                  Lecture Hours

                </th>

                <th className="px-5 py-4 text-center font-semibold">

                  Laboratory Hours

                </th>

                <th className="px-5 py-4 font-semibold">

                  Status

                </th>

                <th className="px-5 py-4 text-right font-semibold">

                  Actions

                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {filteredSubjects.map((subject) => (

                <tr

                  key={subject.subjectId}

                  className="transition hover:bg-slate-50"

                >

                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">

                    {subject.subjectCode}

                  </td>

                  <td className="min-w-56 px-5 py-4 text-slate-600">

                    {subject.subjectName}

                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-center text-slate-600">

                    {subject.units}

                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-center text-slate-600">

                    {subject.lectureHours}

                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-center text-slate-600">

                    {subject.laboratoryHours}

                  </td>

                  <td className="whitespace-nowrap px-5 py-4">

                    <span

                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(subject.status)}`}

                    >

                      {subject.status}

                    </span>

                  </td>

                  <td className="whitespace-nowrap px-5 py-4">

                    <div className="flex justify-end gap-2">

                      <button

                        onClick={() => openViewModal(subject)}

                        title="View"

                        aria-label={`View ${subject.subjectCode}`}

                        className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"

                      >

                        <Eye size={17} />

                      </button>

                      <button

                        onClick={() => openEditModal(subject)}

                        title="Edit"

                        aria-label={`Edit ${subject.subjectCode}`}

                        className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"

                      >

                        <Pencil size={17} />

                      </button>

                      <button

                        onClick={() => openDeleteModal(subject)}

                        title="Delete"

                        aria-label={`Delete ${subject.subjectCode}`}

                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"

                      >

                        <Trash2 size={17} />

                      </button>

                    </div>

                  </td>

                </tr>

              ))}

              {!isLoading && filteredSubjects.length === 0 && (

                <tr>

                  <td

                    colSpan="7"

                    className="px-6 py-12 text-center text-sm text-slate-500"

                  >

                    No subjects found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* Mobile Cards */}

        <div className="divide-y divide-slate-100 md:hidden">

          {filteredSubjects.map((subject) => (

            <div

              key={subject.subjectId}

              className="space-y-3 p-4"

            >

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="font-semibold text-slate-900">

                    {subject.subjectCode}

                  </p>

                  <p className="mt-1 text-sm text-slate-600">

                    {subject.subjectName}

                  </p>

                </div>

                <span

                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(subject.status)}`}

                >

                  {subject.status}

                </span>

              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">

                <div>

                  <p>Units</p>

                  <p className="mt-1 font-semibold text-slate-800">

                    {subject.units}

                  </p>

                </div>

                <div>

                  <p>Lecture</p>

                  <p className="mt-1 font-semibold text-slate-800">

                    {subject.lectureHours}

                  </p>

                </div>

                <div>

                  <p>Laboratory</p>

                  <p className="mt-1 font-semibold text-slate-800">

                    {subject.laboratoryHours}

                  </p>

                </div>

              </div>

              <div className="flex justify-end gap-2">

                <button

                  onClick={() => openViewModal(subject)}

                  className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"

                  aria-label={`View ${subject.subjectCode}`}

                >

                  <Eye size={17} />

                </button>

                <button

                  onClick={() => openEditModal(subject)}

                  className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"

                  aria-label={`Edit ${subject.subjectCode}`}

                >

                  <Pencil size={17} />

                </button>

                <button

                  onClick={() => openDeleteModal(subject)}

                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"

                  aria-label={`Delete ${subject.subjectCode}`}

                >

                  <Trash2 size={17} />

                </button>

              </div>

            </div>

          ))}

          {!isLoading && filteredSubjects.length === 0 && (

            <p className="px-4 py-12 text-center text-sm text-slate-500">

              No subjects found.

            </p>

          )}

        </div>

        <div className="border-t border-slate-200 px-5 py-3">

          <p className="text-xs text-slate-500">

            Showing {filteredSubjects.length} of {totalSubjects} subjects

          </p>

        </div>

      </div>

      {/* Add / Edit Modal */}

      {(modalType === 'add' || modalType === 'edit') && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">

          <div className="my-auto w-full max-w-4xl rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-900">

                  {modalType === 'add' ? 'Add Subject' : 'Edit Subject'}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {modalType === 'add'

                    ? 'Enter the details of the new master subject.'

                    : 'Update the subject details.'}

                </p>

              </div>

              <button

                onClick={closeModal}

                disabled={isSaving}

                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"

                aria-label="Close modal"

              >

                <X size={20} />

              </button>

            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">

                    Subject Code <span className="text-red-500">*</span>

                  </label>

                  <input

                    type="text"

                    name="subjectCode"

                    value={formData.subjectCode}

                    onChange={handleInputChange}

                    placeholder="e.g. PE101"

                    maxLength={30}

                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${

                      errors.subjectCode

                        ? 'border-red-400 focus:border-red-400'

                        : 'border-slate-300 focus:border-blue-500'

                    }`}

                  />

                  {errors.subjectCode && (

                    <p className="mt-1 text-xs text-red-600">

                      {errors.subjectCode}

                    </p>

                  )}

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">

                    Subject Name <span className="text-red-500">*</span>

                  </label>

                  <input

                    type="text"

                    name="subjectName"

                    value={formData.subjectName}

                    onChange={handleInputChange}

                    placeholder="Enter the subject name"

                    maxLength={150}

                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${

                      errors.subjectName

                        ? 'border-red-400 focus:border-red-400'

                        : 'border-slate-300 focus:border-blue-500'

                    }`}

                  />

                  {errors.subjectName && (

                    <p className="mt-1 text-xs text-red-600">

                      {errors.subjectName}

                    </p>

                  )}

                </div>

              </div>

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">

                  Description

                </label>

                <textarea

                  name="description"

                  value={formData.description}

                  onChange={handleInputChange}

                  rows={3}

                  placeholder="Enter an optional subject description"

                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                {renderNumberField('units', 'Units')}

                {renderNumberField('lectureHours', 'Lecture Hours')}

                {renderNumberField('laboratoryHours', 'Laboratory Hours')}

              </div>

              <p className="text-xs text-slate-500">

                Numeric values must be non-negative, with up to three

                integer digits and one decimal place.

              </p>

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">

                  Status <span className="text-red-500">*</span>

                </label>

                <select

                  name="status"

                  value={formData.status}

                  onChange={handleInputChange}

                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                >

                  <option value="ACTIVE">Active</option>

                  <option value="INACTIVE">Inactive</option>

                </select>

              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Program Assignments</h3>
                    <p className="mt-1 text-xs text-slate-500">Assign this subject to one or more programs.</p>
                  </div>
                  <button type="button" onClick={addAssignment} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#17365D] px-3 py-2 text-sm font-semibold text-[#17365D] hover:bg-blue-50">
                    <Plus size={16} /> Add Program
                  </button>
                </div>

                {isLoadingPrograms && <p className="text-sm text-slate-500">Loading programs...</p>}
                {isLoadingAssignments && <p className="text-sm text-slate-500">Loading existing program assignments...</p>}
                {assignments.map((assignment, index) => (
                  <div key={assignment.curriculumId || `new-${index}`} className="rounded-lg bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignment {index + 1}</p>
                      {!assignment.curriculumId && assignments.length > 1 && (
                        <button type="button" onClick={() => removeAssignment(index)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove assignment"><X size={16} /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Program <span className="text-red-500">*</span></label>
                        <select value={assignment.programId} disabled={isLoadingPrograms || isLoadingAssignments} onChange={(event) => updateAssignment(index, 'programId', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                          <option value="">Select a program</option>
                          {programs.map((program) => <option key={program.programId} value={program.programId} disabled={program.status !== 'ACTIVE' && !assignment.curriculumId}>{program.programCode} — {program.programName}{program.status !== 'ACTIVE' ? ' (Inactive)' : ''}</option>)}
                        </select>
                        {errors[`assignment-${index}-program`] && <p className="mt-1 text-xs text-red-600">{errors[`assignment-${index}-program`]}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Year Level <span className="text-red-500">*</span></label>
                        <select value={assignment.yearLevel} onChange={(event) => updateAssignment(index, 'yearLevel', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                          <option value="">Select year level</option>
                          {[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Year {year}</option>)}
                        </select>
                        {errors[`assignment-${index}-year`] && <p className="mt-1 text-xs text-red-600">{errors[`assignment-${index}-year`]}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Semester <span className="text-red-500">*</span></label>
                        <select value={assignment.semester} onChange={(event) => updateAssignment(index, 'semester', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                          <option value="">Select semester</option>
                          <option value="1st Semester">1st Semester</option>
                          <option value="2nd Semester">2nd Semester</option>
                          <option value="Summer">Summer</option>
                        </select>
                        {errors[`assignment-${index}-semester`] && <p className="mt-1 text-xs text-red-600">{errors[`assignment-${index}-semester`]}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Classification</label>
                        <select value={assignment.required} onChange={(event) => updateAssignment(index, 'required', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                          <option value="true">Required</option>
                          <option value="false">Elective</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {errors.assignments && <p className="text-xs text-red-600">{errors.assignments}</p>}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

                <button

                  type="button"

                  onClick={closeModal}

                  disabled={isSaving}

                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={isSaving || isLoadingAssignments || isLoadingPrograms}

                  className="rounded-lg bg-[#17365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102947] disabled:cursor-not-allowed disabled:opacity-60"

                >

                  {isSaving

                    ? 'Saving...'

                    : modalType === 'add'

                      ? 'Save Subject'

                      : 'Save Changes'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* View Modal */}

      {modalType === 'view' && selectedSubject && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">

          <div className="my-auto w-full max-w-lg rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <h2 className="text-lg font-bold text-slate-900">

                Subject Details

              </h2>

              <button

                onClick={closeModal}

                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"

                aria-label="Close modal"

              >

                <X size={20} />

              </button>

            </div>

            <div className="space-y-5 p-6">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">

                    Subject Code

                  </p>

                  <p className="mt-1 font-semibold text-slate-900">

                    {selectedSubject.subjectCode}

                  </p>

                </div>

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">

                    Subject Name

                  </p>

                  <p className="mt-1 text-sm text-slate-900">

                    {selectedSubject.subjectName}

                  </p>

                </div>

              </div>

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">

                  Description

                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">

                  {selectedSubject.description || 'No description provided.'}

                </p>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">

                    Units

                  </p>

                  <p className="mt-1 font-semibold text-slate-900">

                    {selectedSubject.units}

                  </p>

                </div>

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">

                    Lecture Hours

                  </p>

                  <p className="mt-1 font-semibold text-slate-900">

                    {selectedSubject.lectureHours}

                  </p>

                </div>

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">

                    Laboratory Hours

                  </p>

                  <p className="mt-1 font-semibold text-slate-900">

                    {selectedSubject.laboratoryHours}

                  </p>

                </div>

              </div>

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">

                  Status

                </p>

                <span

                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(selectedSubject.status)}`}

                >

                  {selectedSubject.status}

                </span>

              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Program Assignments
                </p>
                <div className="mt-2 space-y-2">
                  {curricula
                    .filter((item) => Number(item.subjectId) === Number(selectedSubject.subjectId))
                    .map((item) => (
                      <div key={item.curriculumId} className="rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.programCode} — {item.programName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Year {item.yearLevel} · {item.semester} · {item.required ? 'Required' : 'Elective'} · {item.curriculumYear}
                        </p>
                      </div>
                    ))}
                  {curricula.filter((item) => Number(item.subjectId) === Number(selectedSubject.subjectId)).length === 0 && (
                    <p className="text-sm text-slate-500">No program assignments found.</p>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">

              <button

                onClick={closeModal}

                className="rounded-lg bg-[#17365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102947]"

              >

                Close

              </button>

            </div>

          </div>

        </div>

      )}

      {/* Delete Confirmation Modal */}

      {modalType === 'delete' && selectedSubject && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">

              <Trash2 size={22} />

            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">

              Delete Subject?

            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">

              Are you sure you want to delete{' '}

              <span className="font-semibold text-slate-800">

                {selectedSubject.subjectCode}

              </span>

              ? This action cannot be undone.

            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button

                onClick={closeModal}

                disabled={isDeleting}

                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"

              >

                Cancel

              </button>

              <button

                onClick={handleDelete}

                disabled={isDeleting}

                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"

              >

                {isDeleting ? 'Deleting...' : 'Delete Subject'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  )

}

export default SubjectsPage

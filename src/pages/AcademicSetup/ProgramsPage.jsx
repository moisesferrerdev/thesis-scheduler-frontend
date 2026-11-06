
import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  GraduationCap,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'

import initialPrograms from '../../data/mock/programs'

const emptyForm = {
  programCode: '',
  programName: '',
  description: '',
  status: 'ACTIVE',
}

function ProgramsPage() {
  const [programs, setPrograms] = useState(initialPrograms)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [modalType, setModalType] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const totalPrograms = programs.length
  const activePrograms = programs.filter(
    (program) => program.status === 'ACTIVE'
  ).length

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const search = searchTerm.toLowerCase()

      const matchesSearch =
        program.programCode.toLowerCase().includes(search) ||
        program.programName.toLowerCase().includes(search)

      const matchesStatus =
        statusFilter === 'ALL' || program.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [programs, searchTerm, statusFilter])

  const openAddModal = () => {
    setSelectedProgram(null)
    setFormData(emptyForm)
    setErrors({})
    setModalType('add')
  }

  const openEditModal = (program) => {
    setSelectedProgram(program)
    setFormData({
      programCode: program.programCode,
      programName: program.programName,
      description: program.description || '',
      status: program.status,
    })
    setErrors({})
    setModalType('edit')
  }

  const openViewModal = (program) => {
    setSelectedProgram(program)
    setModalType('view')
  }

  const openDeleteModal = (program) => {
    setSelectedProgram(program)
    setModalType('delete')
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedProgram(null)
    setFormData(emptyForm)
    setErrors({})
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: name === 'programCode' ? value.toUpperCase() : value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.programCode.trim()) {
      newErrors.programCode = 'Program code is required.'
    }

    if (!formData.programName.trim()) {
      newErrors.programName = 'Program name is required.'
    }

    const duplicateCode = programs.some((program) => {
      const isSameCode =
        program.programCode.toLowerCase() ===
        formData.programCode.trim().toLowerCase()

      const isDifferentRecord =
        program.programId !== selectedProgram?.programId

      return isSameCode && isDifferentRecord
    })

    if (duplicateCode) {
      newErrors.programCode = 'This program code already exists.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!validateForm()) return

    const normalizedData = {
      ...formData,
      programCode: formData.programCode.trim().toUpperCase(),
      programName: formData.programName.trim(),
      description: formData.description.trim(),
    }

    if (modalType === 'add') {
      const newProgram = {
        programId:
          Math.max(0, ...programs.map((program) => program.programId)) + 1,
        ...normalizedData,
      }

      setPrograms((previous) => [...previous, newProgram])
    } else {
      setPrograms((previous) =>
        previous.map((program) =>
          program.programId === selectedProgram.programId
            ? { ...program, ...normalizedData }
            : program
        )
      )
    }

    closeModal()
  }

  const handleDelete = () => {
    setPrograms((previous) =>
      previous.filter(
        (program) => program.programId !== selectedProgram.programId
      )
    )

    closeModal()
  }

  const getStatusStyle = (status) => {
    return status === 'ACTIVE'
      ? 'bg-green-50 text-green-700 ring-green-600/20'
      : 'bg-slate-100 text-slate-600 ring-slate-500/20'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Programs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the academic programs offered by the institution.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17365D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102947]"
        >
          <Plus size={18} />
          Add Program
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Programs
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {totalPrograms}
              </h2>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <GraduationCap size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Programs
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {activePrograms}
              </h2>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-green-700">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Program Records */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Program Records
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View and manage registered academic programs.
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
                placeholder="Search by program code or name..."
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
                <th className="px-6 py-4 font-semibold">Program Code</th>
                <th className="px-6 py-4 font-semibold">Program Name</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPrograms.map((program) => (
                <tr
                  key={program.programId}
                  className="transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                    {program.programCode}
                  </td>

                  <td className="min-w-64 px-6 py-4 text-slate-600">
                    {program.programName}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(program.status)}`}
                    >
                      {program.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openViewModal(program)}
                        title="View"
                        className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        onClick={() => openEditModal(program)}
                        title="Edit"
                        className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() => openDeleteModal(program)}
                        title="Delete"
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPrograms.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No programs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredPrograms.map((program) => (
            <div key={program.programId} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {program.programCode}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {program.programName}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(program.status)}`}
                >
                  {program.status}
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => openViewModal(program)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                  aria-label="View program"
                >
                  <Eye size={17} />
                </button>
                <button
                  onClick={() => openEditModal(program)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                  aria-label="Edit program"
                >
                  <Pencil size={17} />
                </button>
                <button
                  onClick={() => openDeleteModal(program)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                  aria-label="Delete program"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}

          {filteredPrograms.length === 0 && (
            <p className="px-4 py-12 text-center text-sm text-slate-500">
              No programs found.
            </p>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500">
            Showing {filteredPrograms.length} of {totalPrograms} programs
          </p>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {modalType === 'add' ? 'Add Program' : 'Edit Program'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {modalType === 'add'
                    ? 'Enter the details of the new academic program.'
                    : 'Update the academic program details.'}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Program Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="programCode"
                  value={formData.programCode}
                  onChange={handleInputChange}
                  placeholder="e.g. BSIT"
                  maxLength={20}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${
                    errors.programCode
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {errors.programCode && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.programCode}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Program Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="programName"
                  value={formData.programName}
                  onChange={handleInputChange}
                  placeholder="Enter the complete program name"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${
                    errors.programName
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {errors.programName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.programName}
                  </p>
                )}
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
                  placeholder="Enter an optional description"
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status
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

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[#17365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102947]"
                >
                  {modalType === 'add' ? 'Save Program' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalType === 'view' && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Program Details
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
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Program Code
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedProgram.programCode}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Program Name
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {selectedProgram.programName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Description
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedProgram.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(selectedProgram.status)}`}
                >
                  {selectedProgram.status}
                </span>
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
      {modalType === 'delete' && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Delete Program?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-800">
                {selectedProgram.programCode}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeModal}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgramsPage

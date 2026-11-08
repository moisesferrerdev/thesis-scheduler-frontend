import axiosClient from './axiosClient'

const BASE_URL = '/api/academic-terms'

const academicTermService = {
  getAllAcademicTerms: async () => {
    const response = await axiosClient.get(BASE_URL)
    return response.data
  },

  createAcademicTerm: async (data) => {
    const response = await axiosClient.post(BASE_URL, data)
    return response.data
  },

  updateAcademicTerm: async (id, data) => {
    const response = await axiosClient.put(`${BASE_URL}/${id}`, data)
    return response.data
  },

  deleteAcademicTerm: async (id) => {
    await axiosClient.delete(`${BASE_URL}/${id}`)
  },
}

export default academicTermService
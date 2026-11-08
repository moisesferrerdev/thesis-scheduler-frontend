import axiosClient from './axiosClient'

const BASE_URL = '/api/program-majors'

const programMajorService = {
  getAll: async () => {
    const response = await axiosClient.get(BASE_URL)
    return response.data
  },

  getById: async (id) => {
    const response = await axiosClient.get(`${BASE_URL}/${id}`)
    return response.data
  },

  getByProgramId: async (programId) => {
    const response = await axiosClient.get(
      `${BASE_URL}/program/${programId}`
    )
    return response.data
  },

  create: async (data) => {
    const response = await axiosClient.post(BASE_URL, data)
    return response.data
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`${BASE_URL}/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`${BASE_URL}/${id}`)
    return response.data
  },
}

export default programMajorService

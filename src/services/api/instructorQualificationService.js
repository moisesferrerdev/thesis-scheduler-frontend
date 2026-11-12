import axiosClient from './axiosClient'

const BASE_URL = '/api/instructor-qualifications'

const instructorQualificationService = {
  getAll: async () => {
    const response = await axiosClient.get(BASE_URL)
    return response.data
  },
  getById: async (id) => {
    const response = await axiosClient.get(`${BASE_URL}/${id}`)
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
    await axiosClient.delete(`${BASE_URL}/${id}`)
  },
}

export default instructorQualificationService

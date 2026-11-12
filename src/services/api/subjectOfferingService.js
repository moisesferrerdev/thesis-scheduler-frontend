import axiosClient from './axiosClient'

const BASE_URL = '/api/subject-offerings'

const subjectOfferingService = {
  getAll: async () => (await axiosClient.get(BASE_URL)).data,
  getById: async (id) => (await axiosClient.get(`${BASE_URL}/${id}`)).data,
  create: async (data) => (await axiosClient.post(BASE_URL, data)).data,
  update: async (id, data) => (await axiosClient.put(`${BASE_URL}/${id}`, data)).data,
  delete: async (id) => { await axiosClient.delete(`${BASE_URL}/${id}`) },
}

export default subjectOfferingService

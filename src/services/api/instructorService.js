import axiosClient from './axiosClient'

const BASE_URL = '/api/instructors'

const getAll = async () => {
  const response = await axiosClient.get(BASE_URL)
  return response.data
}

const getById = async (id) => {
  const response = await axiosClient.get(`${BASE_URL}/${id}`)
  return response.data
}

const create = async (data) => {
  const response = await axiosClient.post(BASE_URL, data)
  return response.data
}

const update = async (id, data) => {
  const response = await axiosClient.put(`${BASE_URL}/${id}`, data)
  return response.data
}

const remove = async (id) => {
  const response = await axiosClient.delete(`${BASE_URL}/${id}`)
  return response.data
}

const instructorService = { getAll, getById, create, update, delete: remove }
export default instructorService

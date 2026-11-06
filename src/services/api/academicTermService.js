import axiosClient from './axiosClient'

const BASE_URL = '/api/academic-terms'

const getAllAcademicTerms = async () => {
  const response = await axiosClient.get(BASE_URL)
  return response.data
}

const academicTermService = {
  getAllAcademicTerms,
}

export default academicTermService

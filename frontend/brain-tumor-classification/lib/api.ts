import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL
export const predictAll = async(file: File, modality: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('modality', modality)
    const res = await axios.post(`${API}/api/predict-all`, formData)
    return res.data
}

export const getGradcam = async(file: File, modality: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('modality', modality)
  const res = await axios.post(`${API}/api/gradcam`, formData)
  return res.data
}

export const generateReport = async(
  file: File,
  modality: string,
  cnn_prediction: string,
  cnn_confidence: number,
  vit_prediction: string,
  vit_confidence: number,
  rf_prediction: string,
  rf_confidence: number,
  patient_name?: string
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('modality', modality)
  formData.append('cnn_prediction', cnn_prediction)
  formData.append('cnn_confidence', String(cnn_confidence))
  formData.append('vit_prediction', vit_prediction)
  formData.append('vit_confidence', String(vit_confidence))
  formData.append('rf_prediction', rf_prediction)
  formData.append('rf_confidence', String(rf_confidence))
  if(patient_name) 
    formData.append('patient_name', patient_name)
  const res = await axios.post(`${API}/api/generate-report`, formData, {
    responseType: 'blob'
  })
  return res.data
}

export const getAttention = async (file: File, modality: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('modality', modality)
  const res = await axios.post(`${API}/api/attention`, formData)
  return res.data
}

export const getShapSingle = async (file: File, modality: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('modality', modality)
  const res = await axios.post(`${API}/api/shap-single`, formData)
  return res.data
}
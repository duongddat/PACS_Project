export class DicomWebService {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getInstancesForSeries(studyInstanceUID: string, seriesInstanceUID: string) {
    const url = `${this.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dicom+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy instances: ${response.status}`);
    }
    
    return await response.json();
  }

  // Thêm phương thức để lấy dữ liệu ảnh
  async getInstanceImage(studyInstanceUID: string, seriesInstanceUID: string, instanceUID: string) {
    const url = `${this.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${instanceUID}/frames/1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'multipart/related; type=application/dicom; transfer-syntax=*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy ảnh: ${response.status}`);
    }
    
    return await response.arrayBuffer();
  }
}

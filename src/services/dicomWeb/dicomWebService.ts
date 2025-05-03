export class DicomWebService {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // WADO-RS: Lấy thông tin study
  async getStudy(studyInstanceUID: string) {
    const url = `${this.baseUrl}/studies/${studyInstanceUID}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dicom+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy thông tin study: ${response.status}`);
    }
    
    return await response.json();
  }

  // WADO-RS: Lấy danh sách series trong study
  async getSeriesForStudy(studyInstanceUID: string) {
    const url = `${this.baseUrl}/studies/${studyInstanceUID}/series`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dicom+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy danh sách series: ${response.status}`);
    }
    
    return await response.json();
  }

  // WADO-RS: Lấy danh sách instances trong series
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

  // WADO-RS: Lấy metadata của instance
  async getInstanceMetadata(studyInstanceUID: string, seriesInstanceUID: string, sopInstanceUID: string) {
    const url = `${this.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/metadata`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dicom+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy metadata: ${response.status}`);
    }
    
    return await response.json();
  }

  // WADO-RS: Lấy dữ liệu ảnh DICOM
  async getInstanceImage(studyInstanceUID: string, seriesInstanceUID: string, instanceUID: string) {
    const url = `${this.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${instanceUID}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dicom'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy ảnh: ${response.status}`);
    }
    
    return await response.arrayBuffer();
  }

  // WADO-RS: Lấy frame cụ thể từ instance
  async getFrame(studyInstanceUID: string, seriesInstanceUID: string, sopInstanceUID: string, frameNumber: number) {
    const url = `${this.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/frames/${frameNumber}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/octet-stream'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy frame: ${response.status}`);
    }
    
    return await response.arrayBuffer();
  }

  // WADO-RS: Lấy thumbnail cho series
  async getSeriesThumbnail(studyInstanceUID: string, seriesInstanceUID: string) {
    const url = `${this.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/1/frames/1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/jpeg'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy thumbnail: ${response.status}`);
    }
    
    return URL.createObjectURL(await response.blob());
  }

  // QIDO-RS: Tìm kiếm studies
  async searchStudies(params: Record<string, string>) {
    const queryParams = new URLSearchParams(params);
    const url = `${this.baseUrl}/studies?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dicom+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi tìm kiếm studies: ${response.status}`);
    }
    
    return await response.json();
  }
}

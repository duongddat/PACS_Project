import { Study, Series, Instance } from "./types";
import {
  parseDicomStudy,
  parseDicomTag,
  formatDicomDate,
} from "../utils/dicomUtils";

const API_URL = "http://localhost:5086/dicom-web";

// Thêm các phương thức mới vào DicomWebApi
export const DicomWebApi = {
  // Lấy danh sách nghiên cứu
  getStudies: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_URL}/studies?${queryParams}`, {
      headers: {
        Accept: "application/dicom+json",
      },
    });
    const data = await response.json();

    // Sử dụng dicomUtils để xử lý dữ liệu
    return data.map((study: any) => parseDicomStudy(study));
  },

  // Lấy series trong một nghiên cứu
  getSeriesOfStudy: async (studyInstanceUID: string) => {
    const response = await fetch(
      `${API_URL}/studies/${studyInstanceUID}/series`,
      {
        headers: {
          Accept: "application/dicom+json",
        },
      }
    );
    const data = await response.json();

    // Chuyển đổi dữ liệu từ DICOMweb JSON sang định dạng dễ sử dụng hơn
    return data.map((series: any) => {
      return {
        SeriesInstanceUID: parseDicomTag(series, "0020000E"),
        SeriesNumber: parseDicomTag(series, "00200011"),
        SeriesDescription: parseDicomTag(series, "0008103E"),
        Modality: parseDicomTag(series, "00080060"),
        NumberOfInstances: parseInt(
          parseDicomTag(series, "00201209") || "0",
          10
        ),
        BodyPartExamined: parseDicomTag(series, "00180015"),
      } as Series;
    });
  },

  // Lấy instances trong một series
  getInstancesOfSeries: async (
    studyInstanceUID: string,
    seriesInstanceUID: string
  ) => {
    const response = await fetch(
      `${API_URL}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances`,
      {
        headers: {
          Accept: "application/dicom+json",
        },
      }
    );
    const data = await response.json();

    // Chuyển đổi dữ liệu từ DICOMweb JSON sang định dạng dễ sử dụng hơn
    return data.map((instance: any) => {
      return {
        SOPInstanceUID: parseDicomTag(instance, "00080018"),
        SOPClassUID: parseDicomTag(instance, "00080016"),
        InstanceNumber: parseDicomTag(instance, "00200013"),
        Rows: parseInt(parseDicomTag(instance, "00280010") || "0", 10),
        Columns: parseInt(parseDicomTag(instance, "00280011") || "0", 10),
        BitsAllocated: parseInt(parseDicomTag(instance, "00280100") || "0", 10),
        PhotometricInterpretation: parseDicomTag(instance, "00280004"),
      } as Instance;
    });
  },

  // Lấy metadata của một instance
  getInstanceMetadata: async (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string
  ) => {
    const response = await fetch(
      `${API_URL}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/metadata`,
      {
        headers: {
          Accept: "application/dicom+json",
        },
      }
    );
    return response.json();
  },

  // Tạo URL hình ảnh WADO
  getWadoImageUrl: (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string
  ) => {
    return `wadouri:${API_URL}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}`;
  },

  // Tạo danh sách URL hình ảnh cho một series
  getSeriesImageIds: async (
    studyInstanceUID: string,
    seriesInstanceUID: string
  ) => {
    const instances = await DicomWebApi.getInstancesOfSeries(
      studyInstanceUID,
      seriesInstanceUID
    );

    // Sắp xếp instances theo InstanceNumber
    instances.sort((a: any, b: any) => {
      const aNum = parseInt(a.InstanceNumber || "0", 10);
      const bNum = parseInt(b.InstanceNumber || "0", 10);
      return aNum - bNum;
    });

    // Tạo danh sách imageIds
    return instances.map((instance: Instance) =>
      DicomWebApi.getWadoImageUrl(
        studyInstanceUID,
        seriesInstanceUID,
        instance.SOPInstanceUID
      )
    );
  },

  // Tải hình ảnh dưới dạng blob
  getImageAsBlob: async (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string
  ) => {
    const response = await fetch(
      `${API_URL}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}`,
      {
        headers: {
          Accept: "application/dicom",
        },
      }
    );
    return response.blob();
  },

  // Tải frame cụ thể từ một instance
  getFrame: async (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
    frameNumber: number
  ) => {
    const response = await fetch(
      `${API_URL}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/frames/${frameNumber}`,
      {
        headers: {
          Accept: "application/octet-stream",
        },
      }
    );
    return response.arrayBuffer();
  },

  // Tìm kiếm nghiên cứu với các tham số nâng cao
  searchStudies: async (params: Record<string, string>) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_URL}/studies?${queryParams}`, {
      headers: {
        Accept: "application/dicom+json",
      },
    });
    const data = await response.json();
    return data.map((study: any) => parseDicomStudy(study));
  },

  // Tải thumbnail của một instance
  getThumbnail: async (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
    quality = 75,
    viewport = "128,128"
  ) => {
    const response = await fetch(
      `${API_URL}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/thumbnail?quality=${quality}&viewport=${viewport}`,
      {
        headers: {
          Accept: "image/jpeg",
        },
      }
    );
    return response.blob();
  },

  // Lấy tất cả instances của một study
  getAllInstancesOfStudy: async (studyInstanceUID: string) => {
    const series = await DicomWebApi.getSeriesOfStudy(studyInstanceUID);
    const allInstances = [];

    for (const seriesItem of series) {
      const instances = await DicomWebApi.getInstancesOfSeries(
        studyInstanceUID,
        seriesItem.SeriesInstanceUID
      );
      allInstances.push(...instances);
    }

    return allInstances;
  },

  // Lấy dữ liệu volume cho 3D rendering
  getVolumeData: async (
    studyInstanceUID: string,
    seriesInstanceUID: string
  ) => {
    const instances = await DicomWebApi.getInstancesOfSeries(
      studyInstanceUID,
      seriesInstanceUID
    );

    // Sắp xếp instances theo vị trí không gian
    instances.sort((a: any, b: any) => {
      const aNum = parseInt(a.InstanceNumber || "0", 10);
      const bNum = parseInt(b.InstanceNumber || "0", 10);
      return aNum - bNum;
    });

    // Tạo danh sách imageIds cho volume
    const imageIds = instances.map((instance: Instance) =>
      DicomWebApi.getWadoImageUrl(
        studyInstanceUID,
        seriesInstanceUID,
        instance.SOPInstanceUID
      )
    );

    return {
      imageIds,
      metadata: {
        instances,
        seriesInstanceUID,
        studyInstanceUID,
      },
    };
  },

  // Lấy danh sách imageIds cho multiframe
  getMultiframeImageIds: async (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string
  ) => {
    // Lấy metadata để xác định số lượng frame
    const metadata = await DicomWebApi.getInstanceMetadata(
      studyInstanceUID,
      seriesInstanceUID,
      sopInstanceUID
    );

    const numberOfFrames = parseInt(
      parseDicomTag(metadata[0], "00280008") || "0",
      10
    );
    const imageIds = [];

    // Tạo imageId cho từng frame
    for (let frameIndex = 1; frameIndex <= numberOfFrames; frameIndex++) {
      imageIds.push(
        `wadouri:${API_URL}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/frames/${frameIndex}`
      );
    }

    return imageIds;
  },

  // Kiểm tra xem một series có phải là multiframe không
  isMultiframe: async (studyInstanceUID: string, seriesInstanceUID: string) => {
    const instances = await DicomWebApi.getInstancesOfSeries(
      studyInstanceUID,
      seriesInstanceUID
    );

    if (instances.length === 0) return false;

    // Lấy metadata của instance đầu tiên
    const metadata = await DicomWebApi.getInstanceMetadata(
      studyInstanceUID,
      seriesInstanceUID,
      instances[0].SOPInstanceUID
    );

    // Kiểm tra tag NumberOfFrames
    const numberOfFrames = parseInt(
      parseDicomTag(metadata[0], "00280008") || "0",
      10
    );
    return numberOfFrames > 1;
  }
};

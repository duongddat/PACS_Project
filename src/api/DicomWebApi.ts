import { Study, Series, Instance } from "./types";
import {
  parseDicomStudy,
  parseDicomTag,
  formatDicomDate,
} from "../utils/dicomUtils";

const API_URL = process.env.REACT_APP_API_URL;

export const DicomWebApi = {
  getStudies: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_URL}/studies?${queryParams}`, {
      headers: {
        Accept: "application/dicom+json",
      },
    });
    const data = await response.json();

    return data.map((study: any) => parseDicomStudy(study));
  },

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

  getWadoImageUrl: (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string
  ) => {
    return `wadouri:${API_URL}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}`;
  },

  getSeriesImageIds: async (
    studyInstanceUID: string,
    seriesInstanceUID: string
  ) => {
    const instances = await DicomWebApi.getInstancesOfSeries(
      studyInstanceUID,
      seriesInstanceUID
    );

    instances.sort((a: any, b: any) => {
      const aNum = parseInt(a.InstanceNumber || "0", 10);
      const bNum = parseInt(b.InstanceNumber || "0", 10);
      return aNum - bNum;
    });

    return instances.map((instance: Instance) =>
      DicomWebApi.getWadoImageUrl(
        studyInstanceUID,
        seriesInstanceUID,
        instance.SOPInstanceUID
      )
    );
  },

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

  getVolumeData: async (
    studyInstanceUID: string,
    seriesInstanceUID: string
  ) => {
    const instances = await DicomWebApi.getInstancesOfSeries(
      studyInstanceUID,
      seriesInstanceUID
    );

    instances.sort((a: any, b: any) => {
      const aNum = parseInt(a.InstanceNumber || "0", 10);
      const bNum = parseInt(b.InstanceNumber || "0", 10);
      return aNum - bNum;
    });

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

  getMultiframeImageIds: async (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string
  ) => {
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

    for (let frameIndex = 1; frameIndex <= numberOfFrames; frameIndex++) {
      imageIds.push(
        `wadouri:${API_URL}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/frames/${frameIndex}`
      );
    }

    return imageIds;
  },

  isMultiframe: async (studyInstanceUID: string, seriesInstanceUID: string) => {
    const instances = await DicomWebApi.getInstancesOfSeries(
      studyInstanceUID,
      seriesInstanceUID
    );

    if (instances.length === 0) return false;

    const metadata = await DicomWebApi.getInstanceMetadata(
      studyInstanceUID,
      seriesInstanceUID,
      instances[0].SOPInstanceUID
    );

    const numberOfFrames = parseInt(
      parseDicomTag(metadata[0], "00280008") || "0",
      10
    );
    return numberOfFrames > 1;
  },
};

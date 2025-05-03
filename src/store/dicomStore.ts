import { create } from "zustand";
import { DicomStudy } from "../utils/dicomUtils";
import { DicomWebService } from "../services/dicomWeb/dicomWebService";

// Định nghĩa interface cho Series
export interface SeriesItem {
  seriesInstanceUID: string;
  seriesDescription: string;
  modality: string;
  seriesNumber: number;
  instanceCount: number;
  thumbnailUrl?: string;
  equalSpacing?: boolean;
  imageOrientationPatient?: string;
}

// Định nghĩa interface cho Instance
export interface InstanceItem {
  instanceUID: string;
  imageId: string;
  instanceNumber: number;
  rows?: number;
  columns?: number;
  sliceLocation?: number;
  sliceThickness?: number;
}

// Định nghĩa interface cho DicomStore
interface DicomStore {
  // State
  studyInfo: DicomStudy | null;
  seriesList: SeriesItem[];
  currentSeriesUID: string | null;
  instances: InstanceItem[];
  imageStack: string[];
  currentImageIndex: number;
  isLoading: boolean;
  error: string | null;
  studyList: any[]; // Thêm studyList để hỗ trợ StudyList component
  multiFrameInstances: Record<string, number>; // instanceUID -> số lượng frames

  // Actions
  fetchStudyInfo: (studyInstanceUID: string) => Promise<void>;
  fetchSeriesList: (studyInstanceUID: string) => Promise<SeriesItem[]>;
  fetchSeriesInstances: (
    studyInstanceUID: string,
    seriesInstanceUID: string
  ) => Promise<void>;
  setCurrentSeries: (seriesInstanceUID: string) => void;
  setCurrentImageIndex: (index: number) => void;
  resetState: () => void;
  fetchStudyList: () => Promise<void>;
  parseStudyData: (data: any) => any[]; // Thay đổi kiểu dữ liệu từ ArrayBuffer sang any
  fetchInstanceFrames: (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    instanceUID: string
  ) => Promise<number>;
  loadFrame: (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    instanceUID: string,
    frameNumber: number
  ) => Promise<string | null>;
}

// Hàm hỗ trợ định dạng ngày tháng từ DICOM
function formatDicomDate(dateString: string | undefined): string {
  if (!dateString || dateString.length !== 8) return "";

  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);

  return `${day}/${month}/${year}`;
}

// Khởi tạo service
const dicomWebService = new DicomWebService("https://localhost:7200/dicom-web");

// Tạo store với Zustand
export const useDicomStore = create<DicomStore>((set, get) => ({
  // State mặc định
  studyInfo: null,
  seriesList: [],
  currentSeriesUID: null,
  instances: [],
  imageStack: [],
  currentImageIndex: 0,
  isLoading: false,
  error: null,
  studyList: [], // Khởi tạo studyList rỗng
  multiFrameInstances: {},

  // Lấy thông tin study
  fetchStudyInfo: async (studyInstanceUID: string) => {
    set({ isLoading: true, error: null });
    try {
      // Gọi API để lấy thông tin study với Accept header chỉ định JSON
      const response = await fetch(
        `https://localhost:7200/dicom-web/studies/${studyInstanceUID}`,
        {
          headers: {
            Accept: "application/dicom+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy thông tin study: ${response.status}`);
      }

      // Kiểm tra kiểu nội dung của phản hồi
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/dicom+json")) {
        // Xử lý dữ liệu JSON
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Lỗi khi phân tích JSON:", parseError);
          throw new Error(
            `Lỗi khi phân tích dữ liệu: ${
              parseError instanceof Error
                ? parseError.message
                : "Không xác định"
            }`
          );
        }
      } else if (contentType && contentType.includes("multipart/related")) {
        data = [
          {
            "0020000D": { Value: [studyInstanceUID] },
            "00100010": { Value: ["Bệnh nhân mẫu"] },
            "00100020": { Value: ["ID-" + Math.floor(Math.random() * 10000)] },
            "00080020": { Value: ["20230101"] },
            "00081030": { Value: ["Nghiên cứu mẫu"] },
            "00080050": { Value: ["ACC-" + Math.floor(Math.random() * 10000)] },
          },
        ];
      } else {
        // Xử lý trường hợp phản hồi không phải JSON hoặc multipart/related
        throw new Error(`Định dạng phản hồi không được hỗ trợ: ${contentType}`);
      }

      // Kiểm tra dữ liệu trước khi sử dụng
      if (!data) {
        throw new Error("Dữ liệu không hợp lệ từ server");
      }

      // Nếu data là mảng, lấy phần tử đầu tiên
      const studyData = Array.isArray(data) ? data[0] : data;

      // Chuyển đổi dữ liệu thành đối tượng DicomStudy
      const studyInfo: DicomStudy = {
        StudyInstanceUID: studyData["0020000D"]?.Value?.[0] || studyInstanceUID,
        PatientName: studyData["00100010"]?.Value?.[0] || "Anonymous",
        PatientID: studyData["00100020"]?.Value?.[0] || "",
        StudyDate: formatDicomDate(studyData["00080020"]?.Value?.[0]) || "",
        StudyDescription: studyData["00081030"]?.Value?.[0] || "",
        AccessionNumber: studyData["00080050"]?.Value?.[0] || "",
      };

      set({ studyInfo, isLoading: false });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin study:", error);
      set({
        error: error instanceof Error ? error.message : "Lỗi không xác định",
        isLoading: false,
      });
    }
  },

  // Lấy danh sách series
  fetchSeriesList: async (studyInstanceUID: string) => {
    try {
      // Giả lập API call đến PACS server
      const response = await fetch(
        `https://localhost:7200/dicom-web/studies/${studyInstanceUID}/series`
      );

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy danh sách series: ${response.status}`);
      }

      const data = await response.json();

      // Log dữ liệu thô để kiểm tra
      console.log("Dữ liệu thô từ API:", data);

      // Chuyển đổi dữ liệu thành mảng SeriesItem
      const seriesList: SeriesItem[] = data.map((item: any) => ({
        seriesInstanceUID: item["0020000E"]?.Value?.[0] || "",
        seriesDescription:
          item["0008103E"]?.Value?.[0]?.replace(/\u0000/g, "") ||
          "Không có mô tả",
        seriesNumber: parseInt(item["00200011"]?.Value?.[0]) || 0,
        modality: item["00080060"]?.Value?.[0] || "Unknown",
        instanceCount: item["00201209"]?.Value?.[0] || 0,
      }));

      // Log dữ liệu đã chuyển đổi
      console.log("Dữ liệu series sau khi chuyển đổi:", seriesList);

      set({ seriesList, isLoading: false });

      // Return the seriesList
      return seriesList;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách series:", error);
      set({
        error: error instanceof Error ? error.message : "Lỗi không xác định",
        isLoading: false,
      });

      // Return an empty array in case of error
      return [];
    }
  },

  // Lấy danh sách instances cho một series
  fetchSeriesInstances: async (
    studyInstanceUID: string,
    seriesInstanceUID: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      // Gọi API để lấy danh sách instances
      const instancesData = await dicomWebService.getInstancesForSeries(
        studyInstanceUID,
        seriesInstanceUID
      );

      console.log("Dữ liệu instances:", instancesData);

      // Chuyển đổi dữ liệu instances
      const formattedInstances: InstanceItem[] = instancesData.map(
        (instance: any) => ({
          instanceUID: instance["00080018"]?.Value?.[0] || "",
          // Sửa lại URL cho Cornerstone - loại bỏ backticks và khoảng trắng
          imageId: `wadouri:${dicomWebService.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${instance["00080018"]?.Value?.[0]}`,
          instanceNumber: instance["00200013"]?.Value?.[0] || 0,
          rows: instance["00280010"]?.Value?.[0] || 0,
          columns: instance["00280011"]?.Value?.[0] || 0,
          sliceLocation: instance["00201041"]?.Value?.[0] || 0,
          sliceThickness: instance["00180050"]?.Value?.[0] || 0,
        })
      );

      // Sắp xếp instances theo số thứ tự
      formattedInstances.sort((a, b) => a.instanceNumber - b.instanceNumber);

      // Tạo mảng imageStack từ instances
      const imageStack = formattedInstances.map((instance) => instance.imageId);

      set({
        instances: formattedInstances,
        imageStack,
        currentImageIndex: 0,
        isLoading: false,
        currentSeriesUID: seriesInstanceUID,
      });
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách instances:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Thiết lập series hiện tại
  setCurrentSeries: (seriesInstanceUID: string) => {
    set({ currentSeriesUID: seriesInstanceUID });
  },

  // Thiết lập chỉ số ảnh hiện tại
  setCurrentImageIndex: (index: number) => {
    set({ currentImageIndex: index });
  },

  // Reset state
  resetState: () => {
    set({
      studyInfo: null,
      seriesList: [],
      currentSeriesUID: null,
      instances: [],
      imageStack: [],
      currentImageIndex: 0,
      error: null,
    });
  },

  // Lấy danh sách nghiên cứu
  fetchStudyList: async () => {
    set({ isLoading: true, error: null });
    try {
      // Gọi API để lấy danh sách study
      const response = await fetch(`https://localhost:7200/dicom-web/studies`, {
        headers: {
          Accept: "application/dicom+json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy danh sách study: ${response.status}`);
      }

      const data = await response.json();
      const studyList = get().parseStudyData(data);

      set({ studyList, isLoading: false });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách study:", error);
      set({
        error: error instanceof Error ? error.message : "Lỗi không xác định",
        isLoading: false,
      });
    }
  },

  // Lấy frames cho các instances
  fetchFramesForInstances: (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    imageIds: string[]
  ) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Đang tải frames cho các instances...");

      // Lấy danh sách instanceUIDs từ imageIds
      const instanceUIDs = imageIds.map((imageId) => {
        // Trích xuất instanceUID từ imageId
        const parts = imageId.split("/");
        return parts[parts.length - 1];
      });

      // Tạo mảng imageStack mới với URL frames
      const updatedImageStack = instanceUIDs.map(
        (instanceUID) =>
          `wadouri:${dicomWebService.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${instanceUID}`
      );

      set({
        imageStack: updatedImageStack,
        isLoading: false,
      });

      return true;
    } catch (error: any) {
      console.error("Lỗi khi tải frames:", error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Phân tích dữ liệu study từ JSON
  parseStudyData: (data: any) => {
    // Chuyển đổi dữ liệu từ API thành mảng các đối tượng study
    return data.map((studyData: any) => ({
      StudyInstanceUID: studyData["0020000D"]?.Value?.[0] || "",
      PatientName: studyData["00100010"]?.Value?.[0] || "Anonymous",
      PatientID: studyData["00100020"]?.Value?.[0] || "",
      StudyDate: formatDicomDate(studyData["00080020"]?.Value?.[0]) || "",
      StudyDescription: studyData["00081030"]?.Value?.[0] || "",
      AccessionNumber: studyData["00080050"]?.Value?.[0] || "",
      Modalities: studyData["00080061"]?.Value?.join(", ") || "",
    }));
  },

  fetchFrame: async (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    instanceUID: string,
    frameNumber: number
  ) => {
    set({ isLoading: true, error: null });
    try {
      // Tạo URL để lấy frame cụ thể
      const frameUrl = `${dicomWebService.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${instanceUID}/frames/${frameNumber}`;

      // Tạo imageId cho frame
      const frameImageId = `wadouri:${frameUrl}`;

      // Cập nhật currentImageIndex
      set({
        currentImageIndex: frameNumber - 1,
        isLoading: false,
      });

      return frameImageId;
    } catch (error: any) {
      console.error("Lỗi khi tải frame:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  // Thêm phương thức để lấy số lượng frames của một instance
  fetchInstanceFrames: async (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    instanceUID: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      // Gọi API để lấy metadata của instance
      const response = await fetch(
        `https://localhost:7200/dicom-web/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${instanceUID}/metadata`,
        {
          headers: {
            Accept: "application/dicom+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Lỗi khi lấy metadata của instance: ${response.status}`
        );
      }

      const data = await response.json();
      const instanceData = Array.isArray(data) ? data[0] : data;

      // Lấy số lượng frames từ metadata
      const numberOfFrames = instanceData["00280008"]?.Value?.[0] || 1;

      // Cập nhật state
      set((state) => ({
        multiFrameInstances: {
          ...state.multiFrameInstances,
          [instanceUID]: numberOfFrames,
        },
        isLoading: false,
      }));

      return numberOfFrames;
    } catch (error) {
      console.error("Lỗi khi lấy số lượng frames:", error);
      set({
        error: error instanceof Error ? error.message : "Lỗi không xác định",
        isLoading: false,
      });
      return 1; // Mặc định là 1 frame nếu có lỗi
    }
  },

  // Thêm phương thức để tải một frame cụ thể
  loadFrame: async (
    studyInstanceUID: string,
    seriesInstanceUID: string,
    instanceUID: string,
    frameNumber: number
  ) => {
    set({ isLoading: true, error: null });
    try {
      // Tạo URL để lấy frame
      const frameUrl = `https://localhost:7200/dicom-web/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${instanceUID}/frames/${frameNumber}`;

      // Tạo imageId cho frame
      const frameImageId = `wadouri:${frameUrl}`;

      set({ isLoading: false });
      return frameImageId;
    } catch (error) {
      console.error("Lỗi khi tải frame:", error);
      set({
        error: error instanceof Error ? error.message : "Lỗi không xác định",
        isLoading: false,
      });
      return null;
    }
  },
}));

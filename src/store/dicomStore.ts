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

  // Actions
  fetchStudyInfo: (studyInstanceUID: string) => Promise<void>;
  fetchSeriesList: (studyInstanceUID: string) => Promise<void>;
  fetchSeriesInstances: (
    studyInstanceUID: string,
    seriesInstanceUID: string
  ) => Promise<void>;
  setCurrentSeries: (seriesInstanceUID: string) => void;
  setCurrentImageIndex: (index: number) => void;
  resetState: () => void;
  fetchStudyList: () => Promise<void>;
  parseStudyData: (data: any) => any[]; // Thay đổi kiểu dữ liệu từ ArrayBuffer sang any
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
        // Xử lý dữ liệu multipart/related
        // Đây là một định dạng phức tạp, cần thư viện chuyên dụng để xử lý
        // Tạm thời, chúng ta sẽ sử dụng dữ liệu mẫu
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
    set({ isLoading: true, error: null });
    try {
      // Giả lập API call đến PACS server
      const response = await fetch(
        `https://localhost:7200/dicom-web/studies/${studyInstanceUID}/series`
      );

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy danh sách series: ${response.status}`);
      }

      const data = await response.json();

      // Chuyển đổi dữ liệu thành mảng SeriesItem
      const seriesList: SeriesItem[] = data.map((item: any) => ({
        seriesInstanceUID: item.SeriesInstanceUID,
        seriesDescription: item.SeriesDescription || "Không có mô tả",
        seriesNumber: parseInt(item.SeriesNumber) || 0,
        modality: item.Modality || "Unknown",
        instanceCount: item.NumberOfSeriesRelatedInstances || 0,
      }));

      set({ seriesList, isLoading: false });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách series:", error);
      set({
        error: error instanceof Error ? error.message : "Lỗi không xác định",
        isLoading: false,
      });
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

      // Chuyển đổi dữ liệu instances
      const formattedInstances: InstanceItem[] = instancesData.map(
        (instance: any) => ({
          instanceUID: instance["00080018"]?.Value?.[0] || "",
          // Thay đổi từ wadors: sang wadouri: hoặc dicomweb:
          imageId: `wadouri:${dicomWebService.baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${instance["00080018"]?.Value?.[0]}/frames/1`,
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
}));

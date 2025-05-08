import { create } from 'zustand';
import { DicomWebApi } from '../api/DicomWebApi';
import { Study, Series, Instance } from '../api/types';

interface StudyState {
  studies: Study[];
  currentStudy: Study | null;
  currentSeries: Series | null;
  series: Series[];
  instances: Instance[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStudies: (params?: Record<string, string>) => Promise<void>;
  setCurrentStudy: (study: Study) => void;
  fetchStudyByUID: (studyInstanceUID: string) => Promise<void>;
  fetchSeriesForStudy: (studyInstanceUID: string) => Promise<void>;
  setCurrentSeries: (series: Series) => void;
  fetchInstancesForSeries: (studyInstanceUID: string, seriesInstanceUID: string) => Promise<void>;
  clearStudy: () => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  studies: [],
  currentStudy: null,
  currentSeries: null,
  series: [],
  instances: [],
  isLoading: false,
  error: null,
  
  fetchStudies: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const studies = await DicomWebApi.getStudies(params);
      set({ studies, isLoading: false });
    } catch (error) {
      console.error('Lỗi khi tải danh sách nghiên cứu:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Lỗi không xác định khi tải nghiên cứu'
      });
    }
  },
  
  setCurrentStudy: (study) => {
    set({ currentStudy: study });
    get().fetchSeriesForStudy(study.StudyInstanceUID);
  },
  
  // Thêm hàm mới để lấy thông tin study theo UID
  fetchStudyByUID: async (studyInstanceUID) => {
    set({ isLoading: true, error: null });
    try {
      // Sử dụng tham số tìm kiếm để lấy study cụ thể
      const studies = await DicomWebApi.getStudies({ StudyInstanceUID: studyInstanceUID });
      
      if (studies.length > 0) {
        // Cập nhật currentStudy
        set({ currentStudy: studies[0], isLoading: false });
      } else {
        throw new Error('Không tìm thấy nghiên cứu với ID đã cho');
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin nghiên cứu:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Lỗi không xác định khi tải thông tin nghiên cứu'
      });
    }
  },
  
  fetchSeriesForStudy: async (studyInstanceUID) => {
    set({ isLoading: true, error: null });
    try {
      const series = await DicomWebApi.getSeriesOfStudy(studyInstanceUID);
      set({ series, isLoading: false });
      
      // Nếu có series, tự động chọn series đầu tiên
      if (series.length > 0) {
        get().setCurrentSeries(series[0]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách series:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Lỗi không xác định khi tải series'
      });
    }
  },
  
  setCurrentSeries: (series) => {
    set({ currentSeries: series });
    const { currentStudy } = get();
    if (currentStudy) {
      get().fetchInstancesForSeries(currentStudy.StudyInstanceUID, series.SeriesInstanceUID);
    }
  },
  
  fetchInstancesForSeries: async (studyInstanceUID, seriesInstanceUID) => {
    set({ isLoading: true, error: null });
    try {
      const instances = await DicomWebApi.getInstancesOfSeries(studyInstanceUID, seriesInstanceUID);
      set({ instances, isLoading: false });
    } catch (error) {
      console.error('Lỗi khi tải danh sách instances:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Lỗi không xác định khi tải instances'
      });
    }
  },
  
  clearStudy: () => {
    set({ 
      currentStudy: null, 
      currentSeries: null, 
      series: [], 
      instances: [] 
    });
  },
}));
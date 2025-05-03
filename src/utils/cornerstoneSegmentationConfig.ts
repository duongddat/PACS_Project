import * as cornerstoneTools from "cornerstone-tools";

export function configureSegmentation() {
  try {
    // Tạo colorLUT với số lượng segment hợp lý hơn
    const colorLUT = [];
    const segmentsPerLabelmap = 256; // Giảm xuống từ 65535

    // Tạo màu cho mỗi segment
    for (let i = 0; i < segmentsPerLabelmap; i++) {
      // Tạo màu ngẫu nhiên cho mỗi segment
      colorLUT.push([
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
      ]);
    }

    // Cấu hình segmentation - sử dụng cách truy cập phù hợp với phiên bản cornerstone-tools
    if ((cornerstoneTools as any).store?.modules?.segmentation) {
      (
        cornerstoneTools as any
      ).store.modules.segmentation.configuration.segmentsPerLabelmap =
        segmentsPerLabelmap;

      if (
        (cornerstoneTools as any).store.modules.segmentation.setters?.colorLUT
      ) {
        (cornerstoneTools as any).store.modules.segmentation.setters.colorLUT(
          colorLUT
        );
      } else if (
        (cornerstoneTools as any).store.modules.segmentation.setColorLUT
      ) {
        // Một số phiên bản có thể sử dụng setColorLUT trực tiếp
        (cornerstoneTools as any).store.modules.segmentation.setColorLUT(
          colorLUT
        );
      }

      console.log(
        `Đã cấu hình segmentation với ${segmentsPerLabelmap} segments và colorLUT tương ứng`
      );
    } else if ((cornerstoneTools as any).modules?.segmentation) {
      // Một số phiên bản có thể có cấu trúc khác
      (cornerstoneTools as any).modules.segmentation.configuration = {
        ...(cornerstoneTools as any).modules.segmentation.configuration,
        segmentsPerLabelmap,
      };

      console.log(
        `Đã cấu hình segmentation với ${segmentsPerLabelmap} segments (API khác)`
      );
    } else {
      console.log("Không tìm thấy module segmentation trong cornerstone-tools");
    }
  } catch (error) {
    console.warn("Lỗi khi cấu hình segmentation:", error);
  }
}

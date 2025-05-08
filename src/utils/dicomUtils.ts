import * as dicomParser from "dicom-parser";

export interface DicomStudy {
  StudyInstanceUID: string;
  PatientName: string;
  PatientID: string;
  StudyDate: string;
  StudyDescription: string;
  AccessionNumber: string;
  Modalities?: string;
  NumberOfSeries?: number;
  NumberOfInstances?: number;
}

export const parseDicomTag = (dataset: any, tag: string): string => {
  try {
    const element = dataset[tag];
    if (!element || !element.Value || !element.Value.length) return "";

    // Sử dụng dicomParser để xử lý các kiểu dữ liệu DICOM
    const vr = element.vr;
    const value = element.Value[0];

    switch (vr) {
      case "PN": // Person Name
        if (typeof value === "object") {
          const { Alphabetic, Ideographic, Phonetic } = value;
          return Alphabetic || Ideographic || Phonetic || "";
        }
        return value;

      case "DA": // Date
        const parsedDate = dicomParser.parseDA(value);
        return `${parsedDate.year}${String(parsedDate.month).padStart(
          2,
          "0"
        )}${String(parsedDate.day).padStart(2, "0")}`;

      case "TM": // Time
        const time = dicomParser.parseTM(value);
        return `${String(time.hours).padStart(2, "0")}${
          time.minutes ? String(time.minutes).padStart(2, "0") : "00"
        }${time.seconds ? String(time.seconds).padStart(2, "0") : "00"}`;

      case "DT": // DateTime
        const dateTime = value.split(/[\s.]/)[0]; // Get date part only
        return dateTime;

      case "DS": // Decimal String
        return parseFloat(value).toString();

      case "IS": // Integer String
        return parseInt(value, 10).toString();

      default:
        return value;
    }
  } catch (error) {
    console.error(`Lỗi khi parse tag ${tag}:`, error);
    return "";
  }
};

export const formatDicomDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    // Format: YYYYMMDD -> YYYY-MM-DD
    return `${dateString.slice(0, 4)}-${dateString.slice(
      4,
      6
    )}-${dateString.slice(6, 8)}`;
  } catch {
    return dateString;
  }
};

export const parseDicomStudy = (study: any): DicomStudy => {
  const studyDate = parseDicomTag(study, "00080020");
  const modalities = study["00080061"]?.Value?.join("/") || "";
  const numberOfSeries = parseInt(parseDicomTag(study, "00201206") || "0", 10);
  const numberOfInstances = parseInt(parseDicomTag(study, "00201208") || "0", 10);

  return {
    StudyInstanceUID: parseDicomTag(study, "0020000D"),
    PatientName: parseDicomTag(study, "00100010"),
    PatientID: parseDicomTag(study, "00100020"),
    StudyDate: formatDicomDate(studyDate),
    StudyDescription: parseDicomTag(study, "00081030"),
    AccessionNumber: parseDicomTag(study, "00080050"),
    Modalities: modalities,
    NumberOfSeries: numberOfSeries,
    NumberOfInstances: numberOfInstances
  };
};

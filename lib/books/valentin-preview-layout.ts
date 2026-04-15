export interface PreviewTextPlacement {
  title: {
    left: number;
    top: number;
    width: number;
    align?: "left" | "center";
  };
  body: {
    left: number;
    top: number;
    width: number;
    align?: "left" | "center";
  };
}

export const VALENTIN_PREVIEW_LAYOUTS: Record<string, PreviewTextPlacement> = {
  "spread-01-02": {
    title: { left: 28.7, top: 6.7, width: 44, align: "left" },
    body: { left: 28.7, top: 16.7, width: 44, align: "left" },
  },
  "spread-03-04": {
    title: { left: 29.9, top: 6.3, width: 50, align: "center" },
    body: { left: 30, top: 16.3, width: 50, align: "center" },
  },
  "spread-05-06": {
    title: { left: 25.3, top: 5.7, width: 54.7, align: "center" },
    body: { left: 25.3, top: 14.8, width: 54.7, align: "center" },
  },
  "spread-07-08": {
    title: { left: 20.7, top: 5.7, width: 60, align: "center" },
    body: { left: 20.7, top: 15, width: 60, align: "center" },
  },
  "spread-09-10": {
    title: { left: 36, top: 6.5, width: 46.7, align: "left" },
    body: { left: 36, top: 16.5, width: 46.7, align: "left" },
  },
  "spread-11-12": {
    title: { left: 20.7, top: 5.7, width: 58.7, align: "center" },
    body: { left: 20.7, top: 15, width: 58.7, align: "center" },
  },
  "spread-13-14": {
    title: { left: 17.3, top: 5.2, width: 65.4, align: "center" },
    body: { left: 17.3, top: 13.8, width: 65.4, align: "center" },
  },
  "spread-15-16": {
    title: { left: 17.3, top: 5.8, width: 65.4, align: "center" },
    body: { left: 17.3, top: 13.8, width: 65.4, align: "center" },
  },
  "spread-17-18": {
    title: { left: 11.3, top: 4.8, width: 62.7, align: "center" },
    body: { left: 11.3, top: 13.8, width: 62.7, align: "center" },
  },
  "spread-19-20": {
    title: { left: 38, top: 5.3, width: 44, align: "left" },
    body: { left: 38, top: 14, width: 44, align: "left" },
  },
};

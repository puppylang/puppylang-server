export interface KakaoLocalWithGeoType {
  documents: {
    region_type: string;
    code: string;
    address_name: string;
    region_2depth_name: string;
    region_1depth_name: string;
    region_3depth_name: string;
    region_4depth_name: string;
    x: number;
    y: number;
  }[];
  meta: {
    total_count: number;
  };
}

export interface DongRegionType {
  response: {
    service: {
      name: "search";
      version: "2.0";
      operation: "search";
      time: string;
    };
    status: "OK" | "NOT_FOUND";
    record: {
      total: string;
      current: string;
    };
    page: {
      total: string;
      current: string;
      size: string;
    };
    result?: {
      crs: string;
      type: string;
      items: {
        id: string;
        title: string;
        geometry: string;
        point: { x: string; y: string };
      }[];
    };
  };
}

export interface UserRegionReqType {
  x?: string;
  y?: string;
  text?: string;
}

export interface KakaoLocalWithGeoType {
  documents: {
    address: {
      address_name: string;
      b_code: string;
      h_code: string;
      main_address_no: string;
      mountain_yn: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_h_name: string;
      region_3depth_name: string;
      sub_address_no: string;
      x: string;
      y: string;
    };
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
    service?: {
      name: "search";
      version: "2.0";
      operation: "search";
      time: string;
    };
    status: "OK" | "NOT_FOUND";
    record?: {
      total: string;
      current: string;
    };
    page?: {
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

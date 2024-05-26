export interface KakaoLocalType {
  documents: {
    address: {
      address_name: string;
      b_code: string;
      h_code: string;
      main_address_no: string;
      mountain_yn: "N";
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_h_name: string;
      region_3depth_name: string;
      sub_address_no: string;
      x: string;
      y: string;
    } | null;
    address_name: string;
    address_type: string;
    road_address: {
      address_name: string;
      building_name: string;
      main_building_no: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      road_name: string;
      sub_building_no: string;
      underground_yn: string;
      x: string;
      y: string;
      zone_no: string;
    } | null;
    x: string;
    y: string;
  }[];
  meta: {
    is_end: boolean;
    pageable_count: number;
    total_count: number;
  };
}

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

export interface UserRegionReqType {
  x?: string;
  y?: string;
  text?: string;
}

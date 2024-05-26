import type { KakaoLocalType, KakaoLocalWithGeoType } from "../types/region";

export const getLocalInfo = async (query: string) => {
  try {
    const KAKAO_LOCAL_URL = `https://dapi.kakao.com/v2/local/search/address.json?query=${query}`;
    const response = await fetch(KAKAO_LOCAL_URL, {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
      },
    });
    const data = (await response.json()) as KakaoLocalType;
    const isRoadType =
      data.documents.length && data.documents[0].address_type === "ROAD";
    if (isRoadType) {
      const regionTypeData = { ...data.documents[0] };
      regionTypeData.address_name = `${regionTypeData.road_address?.region_1depth_name} ${regionTypeData.road_address?.region_2depth_name} ${regionTypeData.road_address?.region_3depth_name}`;
      return { ...data, documents: [regionTypeData] };
    }

    return data;
  } catch (err) {
    console.error(err);
  }
};

export const getLocalInfoWithGeo = async ({
  x,
  y,
}: {
  x: string;
  y: string;
}) => {
  const KAKAO_LOCAL_URL = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${x}&y=${y}`;
  const response = await fetch(KAKAO_LOCAL_URL, {
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    },
  });
  const data = (await response.json()) as KakaoLocalWithGeoType;
  return data;
};

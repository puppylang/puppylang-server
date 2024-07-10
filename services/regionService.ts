import type { KakaoLocalWithGeoType } from "../types/region";

export const getLocalInfo = async (query: string) => {
  try {
    const DATA_URL = `https://dapi.kakao.com/v2/local/search/address?query=${query}`;
    const response = await fetch(DATA_URL, {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
      },
      proxy: process.env.NOBLE_PROXY_URL,
    });
    const data = (await response.json()) as KakaoLocalWithGeoType;
    const dongRegionData = data
      ? data.documents.filter(
          (document) =>
            document.address.region_3depth_h_name ||
            document.address.region_3depth_name
        )
      : [];

    return {
      status: dongRegionData.length ? "OK" : "NOT_FOUND",
      regions: dongRegionData.map((document) => ({
        id: document.x + document.y,
        title: document.address_name,
        geometry: "KAKAO",
        point: {
          x: document.x,
          y: document.y,
        },
      })),
    };
  } catch (err) {
    console.error(err);
    return {
      status: "NOT_FOUND",
      regions: [],
    };
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
    proxy: process.env.NOBLE_PROXY_URL,
  });

  const data = (await response.json()) as KakaoLocalWithGeoType;

  return {
    status: "OK",
    regions: data.documents.map(({ code, address_name, x, y }) => {
      return {
        id: code,
        title: address_name,
        geometry: "KAKAO",
        point: {
          x,
          y,
        },
      };
    }),
  };
};

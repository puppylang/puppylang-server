import type { DongRegionType, KakaoLocalWithGeoType } from "../types/region";

export const getLocalInfo = async (query: string) => {
  try {
    const DATA_URL = `https://api.vworld.kr/req/search?service=search&request=search&version=2.0&size=50&page=1&query=${query}&type=district&category=L4&format=json&errorformat=json&key=${process.env.DONG_REST_API_KEY}`;
    const response = await fetch(DATA_URL, {
      headers: {
        "Content-type": "application/json;charset=UTF-8",
      },
    });

    if (
      response.headers.get("content-type") === "application/json;charset=UTF-8"
    ) {
      const data = await response.json();
      console.log("JSON DATA=", data);
      return data;
    }

    const data = await response.text();
    console.log("text DATA=", data);
    console.log("data");
    return undefined;
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
    proxy: process.env.NOBLE_PROXY_URL,
  });

  const data = (await response.json()) as KakaoLocalWithGeoType;
  const changedDongRegionType: DongRegionType = {
    response: {
      status: "OK",
      result: {
        crs: "",
        type: "",
        items: data.documents.map(({ code, address_name, x, y }) => {
          return {
            id: code,
            title: address_name,
            geometry: "KAKAO",
            point: {
              x: String(x),
              y: String(y),
            },
          };
        }),
      },
    },
  };

  return changedDongRegionType;
};

import type { CustomErrorType } from "../types/request";

export const CustomError = ({ message, status }: CustomErrorType) => {
  console.error({
    message,
    timestamp: new Date(),
    status,
  });

  return new Response(
    JSON.stringify({ message, timestamp: new Date(), data: null }),
    {
      headers: { "Content-Type": "application/json" },
      status,
    }
  );
};

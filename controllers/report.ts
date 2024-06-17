import { PrismaClient } from "@prisma/client";

import type { CreateReportReqType } from "../types/reportType";
import type { CustomRequest } from "../types/request";
import { CustomError } from "../utils/CustomError";

const prisma = new PrismaClient({});

export default class Report {
  static async createReport(request: CustomRequest<CreateReportReqType>) {
    try {
      if (
        !request.body ||
        !request.body.detail ||
        !request.body.reported_id ||
        !request.body.title ||
        !request.body.reporter_id
      ) {
        return CustomError({
          message: "body값이 유효하지 않습니다.",
          status: 400,
        });
      }

      const newReport = await prisma.reportedUser.create({
        data: request.body,
      });

      if (newReport) {
        request.set.status = 201;
      }
    } catch (err) {
      console.error(err);
    }
  }

  static async deleteReport(request: CustomRequest<{ id: string }>) {
    const token = request.headers.authorization;
    if (!token) return;

    if (!request.body || !request.body.id) {
      return CustomError({
        message: "body값이 유효하지 않습니다.",
        status: 400,
      });
    }

    const deletedReport = await prisma.reportedUser.delete({
      where: {
        id: Number(request.body.id),
      },
    });

    if (deletedReport) {
      request.set.status = 201;
    }
  }

  static async createBlock(
    request: CustomRequest<{ blocker_id: string; blocked_id: string }>
  ) {
    if (!request.body || !request.body.blocked_id || !request.body.blocker_id) {
      return CustomError({
        message: "body값이 유효하지 않습니다.",
        status: 401,
      });
    }

    const { blocked_id, blocker_id } = request.body;

    const newBlock = await prisma.blockedUser.create({
      data: {
        blocked_id,
        blocker_id,
      },
    });

    if (newBlock) {
      request.set.status = 201;
    }
  }

  static async deleteBlock(
    request: CustomRequest<{ blocker_id: string; blocked_id: string }>
  ) {
    if (!request.body || !request.body.blocked_id || !request.body.blocker_id) {
      return CustomError({
        message: "body값이 유효하지 않습니다.",
        status: 401,
      });
    }

    const { blocked_id, blocker_id } = request.body;

    const deletedBlock = await prisma.blockedUser.delete({
      where: {
        blocked_id_blocker_id: {
          blocker_id,
          blocked_id,
        },
      },
    });

    if (deletedBlock) {
      request.set.status = 201;
    }
  }
}

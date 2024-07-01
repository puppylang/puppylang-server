import { PrismaClient, type Caution } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { CustomError } from "../utils/CustomError";
import {
  StatusType,
  type PostFormType,
  type PostQuery,
} from "../types/postType";
import {
  type CustomRequest,
  type PageQuery,
  type Params,
} from "../types/request";
import User from "./user";

const prisma = new PrismaClient({});

interface PaginatedPostProps {
  page: number;
  size: number;
  usePagination: boolean;
  statusQuery?: undefined | StatusType;
  authorId?: string;
  userId?: string;
  regionId: number;
  useRegion: boolean;
}

class Post {
  static async createPost(request: CustomRequest<PostFormType>) {
    try {
      const {
        title,
        content,
        proposed_fee,
        preferred_walk_location,
        start_at,
        end_at,
        cautions,
        pet_id,
        region_id,
      } = request.body;

      const token = request.headers.authorization;

      if (!token) {
        return CustomError({
          message: "게시글은 로그인 후 작성이 가능합니다.",
          status: 401,
        });
      }

      const user = await User.getUserInfo(token);

      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      if (!title || !content || !start_at || !end_at || !proposed_fee) {
        return CustomError({
          message: "제목, 내용, 산책 보수, 시작일시, 종료일시 값은 필수입니다.",
          status: 400,
        });
      }

      if (!pet_id) {
        return CustomError({
          message: "게시글 작성시 반려견 등록은 필수입니다.",
          status: 400,
        });
      }

      const convertedCautions = cautions.map((caution) => {
        return { content: caution.content };
      });

      const createdPost = await prisma.post.create({
        data: {
          title,
          content,
          start_at,
          end_at,
          proposed_fee,
          preferred_walk_location,
          author_id: user?.id,
          pet_id,
          region_id,
          cautions: {
            create: convertedCautions || [],
          },
        },
        include: { cautions: true, author: true, pet: true, region: true },
      });

      if (createdPost) {
        const {
          title,
          content,
          proposed_fee,
          preferred_walk_location,
          start_at,
          end_at,
          status,
          author,
          cautions,
          region_id,
        } = createdPost;

        return {
          title,
          content,
          proposed_fee,
          preferred_walk_location,
          start_at,
          end_at,
          status,
          author,
          cautions,
          region_id,
        };
      }
    } catch (err) {
      console.log(err, "ERR");
      return CustomError({ message: "error ", status: 500 });
    }
  }

  static async getPosts(request: CustomRequest<PageQuery & Params>) {
    try {
      if (!request.query) return;

      const token = request.headers.authorization;
      if (!token) {
        return CustomError({
          message: "게시글은 로그인 후 확인 가능합니다.",
          status: 401,
        });
      }

      const user = await User.getUserInfo(token);
      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      const page = Number(request.query.page);
      const size = Number(request.query.size);
      const usePagination =
        request.query.page !== undefined && request.query.size !== undefined;
      const regionId = Number(request.query.region_id);
      const useRegion = request.query.region_id !== undefined;

      return Post.fetchPaginatedPosts({
        page,
        size,
        usePagination,
        userId: user.id,
        regionId,
        useRegion,
      });
    } catch (err) {
      console.log(err);
      return CustomError({ message: "error ", status: 500 });
    }
  }

  static async getDetailPost(request: CustomRequest<Params>) {
    try {
      if (!request.params) return;

      const { id: post_id } = request.params;
      if (!post_id) {
        return CustomError({
          message: "Invalid request. ID is missing.",
          status: 404,
        });
      }

      const token = request.headers.authorization;

      if (!token) {
        return CustomError({
          message: "게시글은 로그인 후 확인 가능합니다.",
          status: 401,
        });
      }

      const user = await User.getUserInfo(token);

      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      const post = await prisma.post.findUnique({
        where: { id: Number(post_id) },
        include: { cautions: true, author: true, pet: true, region: true },
      });

      if (!post) {
        return CustomError({
          message: "Post not found.",
          status: 200,
        });
      }

      const like_count = await prisma.like.count({
        where: { post_id: Number(post_id) },
      });
      const view = await prisma.postView.count({
        where: { author_id: user?.id, post_id: Number(post_id) },
      });

      const is_liked = Boolean(
        await prisma.like.findFirst({
          where: { author_id: user.id, post_id: Number(post_id) },
        })
      );

      const view_count = await Post.findPostView(
        user?.id,
        Number(post_id),
        Boolean(view)
      );

      const { pet, ...postData } = post;

      return {
        ...postData,
        pet: !pet ? null : pet,
        is_liked,
        like_count,
        view_count,
      };
    } catch (err) {
      console.log(err);
      return CustomError({ message: "error ", status: 500 });
    }
  }

  static async deletePost(request: CustomRequest<Params>) {
    try {
      if (!request.params) return;

      const { id: postId } = request.params;

      if (!postId) {
        return CustomError({
          message: "Invalid request. ID is missing.",
          status: 404,
        });
      }

      return prisma.$transaction([
        prisma.caution.deleteMany({ where: { post_id: Number(postId) } }),
        prisma.post.delete({ where: { id: Number(postId) } }),
      ]);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        const { code } = err;

        if (code === "P2025") {
          return CustomError({
            message: "Not existed ID",
            status: 404,
          });
        }

        console.log(err);
      }
    }
  }

  static async updatePost(request: CustomRequest<Params & PostFormType>) {
    try {
      if (!request.params) return;

      const { id: postId } = request.params;

      if (!postId) {
        return CustomError({
          message: "Invalid request. ID is missing.",
          status: 404,
        });
      }

      const {
        title,
        content,
        start_at,
        end_at,
        status,
        cautions: requestCautions,
        proposed_fee,
        preferred_walk_location,
        pet_id,
        matched_user_id,
      } = request.body;

      await Post.updateCaution(requestCautions, postId);

      const updatedPost = await prisma.post.update({
        where: { id: Number(postId) },
        data: {
          title,
          content,
          proposed_fee,
          preferred_walk_location,
          start_at,
          end_at,
          status,
          updated_at: new Date(),
          pet_id,
          matched_user_id,
        },
        include: { cautions: true, author: true, pet: true, region: true },
      });

      if (updatedPost) {
        return updatedPost;
      }
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        const { code } = err;

        if (code === "P2025") {
          return CustomError({
            message: "Not existed ID",
            status: 404,
          });
        }

        console.log(err);
      }
    }
  }

  static async updateCaution(requestCautions: Caution[], postId: number) {
    try {
      const originCautions = await prisma.caution.findMany({
        where: { post_id: Number(postId) },
      });
      const addCautions = Post.findAddedCautions(requestCautions, postId);
      const deleteCautions = Post.findDeletedCautions(
        originCautions,
        requestCautions
      );
      const existedCautions = Post.findExistedCautions(
        requestCautions,
        originCautions
      );

      //  Action Create
      if (addCautions.length) {
        await prisma.caution.createMany({ data: addCautions });
      }

      // Action Delete
      if (deleteCautions.length) {
        deleteCautions.forEach(
          async (caution) =>
            await prisma.caution.delete({
              where: { id: caution.id },
            })
        );
      }

      const findCaution = (targetId: number) =>
        originCautions.filter(({ id }) => id === targetId);

      // Action ExistedCautions Update
      if (existedCautions.length) {
        existedCautions.forEach(
          async (caution) =>
            await prisma.caution.updateMany({
              where: { id: caution.id },
              data: {
                ...caution,
                updated_at:
                  caution.content === findCaution(caution.id)[0].content
                    ? caution.updated_at
                    : new Date(),
              },
            })
        );
      }
    } catch (err) {
      console.log(err);
    }
  }

  static findExistedCautions(cautions: Caution[], originCautions: Caution[]) {
    return cautions.filter((caution) => {
      return originCautions.some((originCaution) => {
        return caution.id === originCaution.id;
      });
    });
  }

  static findAddedCautions(cautions: Caution[], postId: number) {
    return cautions
      .filter((caution) => !caution.hasOwnProperty("id") || caution.id === null)
      .map((caution) => {
        return { content: caution.content, post_id: Number(postId) };
      });
  }

  static findDeletedCautions(origin: Caution[], update: Caution[]) {
    const updateIds = new Set(update.map((item) => item.id));
    return origin.filter((item) => !updateIds.has(item.id));
  }

  static async findPostView(
    author_id: string | undefined,
    post_id: number,
    is_viewed: boolean
  ) {
    try {
      if (!author_id) return;

      if (is_viewed) {
        return await prisma.postView.count({ where: { post_id } });
      } else {
        const result = await prisma.$transaction([
          prisma.postView.create({ data: { author_id, post_id } }),
          prisma.postView.count({ where: { post_id } }),
        ]);

        return result[1];
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async fetchPaginatedPosts({
    page,
    size,
    usePagination,
    statusQuery,
    authorId,
    userId,
    regionId,
    useRegion,
  }: PaginatedPostProps) {
    const posts = await prisma.post.findMany({
      ...(usePagination && { skip: page * size }),
      ...(usePagination && { take: size }),
      orderBy: [{ created_at: "desc" }],
      include: {
        cautions: true,
        pet: true,
        author: { include: { blocked_user: true } },
      },
      where: {
        author: { blocked_user: { none: { blocker_id: { equals: userId } } } },
        ...(statusQuery && { status: statusQuery }),
        ...(authorId && { author_id: authorId }),
        ...(useRegion && { region_id: regionId }),
      },
    });
    const totalPage = await prisma.post.count({
      ...(statusQuery && { where: { status: statusQuery } }),
    });

    const currentPostCount = posts.length;

    return new Response(
      JSON.stringify({
        total_pages: totalPage,
        page: usePagination ? page : null,
        size: usePagination ? size : null,
        first: usePagination ? page === 0 : true,
        last: usePagination
          ? !(totalPage - (page * size + currentPostCount) > 0)
          : true,
        content: posts,
      })
    );
  }

  static async updatePostStatus(
    request: CustomRequest<Params & { status: StatusType }>
  ) {
    try {
      if (!request.params) return;

      const { id: postId } = request.params;

      if (!postId) {
        return CustomError({
          message: "Invalid request. ID is missing.",
          status: 404,
        });
      }

      const { status } = request.body;

      if (!status) {
        return CustomError({
          status: 400,
          message: "Invalid request. status is missing",
        });
      }

      const updatePost = await prisma.post.update({
        where: { id: Number(postId) },
        data: { status, updated_at: new Date() },
        include: { cautions: true, author: true, pet: true },
      });

      if (updatePost) {
        return updatePost;
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async matchPetSitter(
    request: CustomRequest<Params & { matched_user_id: string }>
  ) {
    try {
      if (!request.params) return;

      const { id: post_id } = request.params;
      if (!post_id) {
        return CustomError({
          message: "Invalid request. ID is missing.",
          status: 404,
        });
      }

      const token = request.headers.authorization;
      if (!token) return;

      const user = await User.getUserInfo(token);
      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      const post = await prisma.post.update({
        data: {
          is_matched: true,
          matched_user_id: request.body.matched_user_id,
          status: StatusType.COMING,
        },
        where: { id: Number(post_id) },
        include: { author: true, pet: true },
      });

      return post;
    } catch (err) {
      console.log(err);
    }
  }

  static async unMatchPetSitter(request: CustomRequest<Params>) {
    try {
      if (!request.params) return;

      const { id: post_id } = request.params;
      if (!post_id) {
        return CustomError({
          message: "Invalid request. ID is missing.",
          status: 404,
        });
      }

      const token = request.headers.authorization;
      if (!token) return;

      const user = await User.getUserInfo(token);
      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      const post = await prisma.post.update({
        data: {
          is_matched: false,
          matched_user_id: null,
          status: StatusType.IN_PROGRESS,
        },
        where: { id: Number(post_id) },
        include: { author: true, pet: true },
      });

      return post;
    } catch (err) {
      console.log(err);
    }
  }

  static async getMatchedPosts(request: CustomRequest<PostQuery>) {
    try {
      if (!request.query) return;

      const { user_id } = request.query;
      if (!user_id) {
        return CustomError({
          message: "Invalid request. User ID is missing.",
          status: 404,
        });
      }

      const token = request.headers.authorization;
      if (!token) return;

      const user = await User.getUserInfo(token);
      if (!user) {
        return CustomError({
          message: "가입되어 있지 않은 사용자입니다.",
          status: 401,
        });
      }

      const posts = await prisma.post.findMany({
        where: {
          matched_user_id: user_id,
          status: StatusType.COMING,
          pet_sitter_walk_record: {
            none: {},
          },
        },
        include: { author: true, pet: true },
      });

      return posts;
    } catch (err) {
      console.log(err);
    }
  }
}

export default Post;

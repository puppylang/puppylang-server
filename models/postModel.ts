import type Post from "../controllers/post";
import type { PostFormType } from "../types/postType";
import type { PageQuery, Params } from "../types/request";

import client from "./connect";

export const readPost = ({
  page,
  size,
  sort,
  id,
}: PageQuery & Params): Promise<Post[]> => {
  return new Promise((resolve, reject) => {
    let query = "";

    if (id) {
      query = `SELECT * FROM "Post" WHERE id = ${id} `;
    } else {
      const pageSize = size ? `LIMIT ${size}` : "";

      query = `SELECT * FROM "Post" ORDER BY created_at DESC ${pageSize}`;
    }

    client.query(query, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.rows);
      }
    });
  });
};

export const deletePost = (id: number) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM "Post" where id = ${id}`;

    client.query(query, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.rows);
      }
    });
  });
};

export const createPost = ({
  title,
  content,
  start_at,
  end_at,
}: PostFormType) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO "Post" (title, content, start_at, end_at) VALUES('${title}', '${content}', '${start_at}', '${end_at}')`;

    client.query(query, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

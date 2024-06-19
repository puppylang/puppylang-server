import { LoggedFrom } from "@prisma/client";

export enum StatusType {
  IN_PROGRESS = "IN_PROGRESS",
  COMING = "COMING",
  FINISHED = "FINISHED",
}

export interface Caution {
  id: number;
  content: string;
  is_completed?: boolean;
  created_at: Date;
  updated_at: Date;
  post_id: number;
}

export interface PostFormType {
  title: string;
  content: string;
  start_at: Date;
  end_at: Date;
  status?: StatusType;
  proposed_fee: number;
  preferred_walk_location: string;
  cautions: Caution[];
  author_id: string;
  author: Author;
  pet_id: number;
  is_matched: boolean;
  matched_user_id: null | string;
}

export interface Author {
  id: string;
  name: string;
  image: string | null;
  logged_from: LoggedFrom;
  is_first_login: boolean;
}

export interface PostQuery {
  status?: StatusType;
  author_id?: string;
  user_id?: string;
}

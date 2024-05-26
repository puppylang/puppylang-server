import type { Gender } from "@prisma/client";

export interface CreateResumeReqType {
  image: string;
  birth_year: string;
  introduction: string;
  phone_number: string;
  name: string | null;
  have_puppy: boolean | null;
  gender: Gender | null;
  user_id: string;
  post_id: number;
}

export interface UpdateResumeReqType {
  id: number;
  name: string;
  phone_number: string;
  birth_year: string;
  introduction: string;
  gender: Gender;
  created_at: Date;
  is_checked: boolean;
  is_selected: boolean;

  has_puppy?: boolean;
  image?: string;
  post_id: number;
  user_id: string;
}

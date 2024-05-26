import type { Gender } from "@prisma/client";

export interface CreatePetFormReqType {
  user_id: string;
  name: string;
  is_newtralize: boolean;
  weight: number;
  gender: Gender;
  breed: string;
  birthday: string;
  character?: string;
  image?: string;
}

export interface ReadPetsReqType {
  user_id: string;
}

export interface DeletePetReqType {
  id: number;
}

export interface UpdatePetReqType extends CreatePetFormReqType {
  id: number;
}

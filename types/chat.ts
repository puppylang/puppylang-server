export interface CreateMessageType {
  chat_id: number;
  user_id: string;
  time: Date;
  text: string;
  other_user_id: string;
}

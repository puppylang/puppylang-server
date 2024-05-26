export interface CreateMessageType {
  message: {
    chat_id: number;
    user_id: string;
    time: Date;
    text: string;
  };
}

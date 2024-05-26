import type { CustomRequest } from "../types/request";
import { uploadImage } from "../services/awsUpload";

class Image {
  static async uploadImageToAWS(
    request: CustomRequest<{ image: Blob; name: string }>
  ) {
    const { image, name } = request.body;

    try {
      const uploadedImageURL = await uploadImage(image, name);

      return uploadedImageURL;
    } catch (err) {
      console.error(err);
    }
  }
}

export default Image;

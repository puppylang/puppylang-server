import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const getUniqueImageName = async (client: S3Client, name: string) => {
  const baseName = name.split(".")[0];
  const extName = name.split(".")[1];
  let newFileName = `${baseName}(1).${extName}`;
  let i = 2;

  while (true) {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: newFileName,
      });
      await client.send(headCommand);
      newFileName = `${baseName}(${i}).${extName}`;
      i++;
    } catch (err) {
      break;
    }
  }

  return newFileName;
};

export const uploadImage = async (image: Blob, name: string) => {
  const CLOUDFRONT_URL = "https://d7nesdjea7aah.cloudfront.net";
  const extName = name.split(".")[1];
  const buf = await image.arrayBuffer();
  const nodeBuffer = Buffer.from(buf);

  const client = new S3Client({
    region: "ap-southeast-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY as string,
      secretAccessKey: process.env.AWS_SECRET_KEY as string,
    },
  });

  const headCommand = new HeadObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: name,
  });

  try {
    const sameNameFile = await client.send(headCommand);
    if (sameNameFile) {
      const newNameFile = await getUniqueImageName(client, name);

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: newNameFile,
        ContentType: `image/${extName}`,
        Body: nodeBuffer,
      };

      await client.send(new PutObjectCommand(uploadParams));
      return `${CLOUDFRONT_URL}/${newNameFile}`;
    }
  } catch (err) {
    try {
      const putCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: name,
        ContentType: `image/${extName}`,
        Body: nodeBuffer,
      });

      await client.send(putCommand);
      return `${CLOUDFRONT_URL}/${name}`;
    } catch (err) {
      console.error(err);
    }
  }
};

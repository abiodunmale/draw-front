import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { image, data } = req.body;

    // Ensure directories exist
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const dataDir = path.join(process.cwd(), "public/data");

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    // Extract Base64 image data
    const base64Image = image.split(";base64,").pop();
    // const imageName = `image_${Date.now()}.png`;
    // const imagePath = path.join(uploadDir, imageName);

    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const imagePath = path.join(uploadDir, `${Date.now()}.png`);
    fs.writeFileSync(imagePath, base64Data, 'base64');

    // Save image file
    // fs.writeFileSync(imagePath, base64Image, { encoding: "base64" });

    // Save JSON data
    const jsonFilePath = path.join(dataDir, `data_${Date.now()}.json`);
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));

    return res.status(200).json({ message: "Upload successful", imagePath, jsonFilePath });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

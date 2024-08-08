import OpenAI from "openai";
import { getStorage, ref, getBytes } from "firebase/storage";
import { db } from "../firebase"; // Adjust this import to match your Firebase setup

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
const storage = getStorage(); // Initialize Firebase Storage with default app

export default async function category(imgRef) {
  try {
    // Create a reference to the image in Firebase Storage
    const imageRef = ref(storage, imgRef);

    // Download the image as bytes
    const imageBytes = await getBytes(imageRef);

    // Convert image bytes to base64
    const base64Image = Buffer.from(imageBytes).toString("base64");
    const base64ImageUrl = `data:image/jpeg;base64,${base64Image}`;

    const prompt =
      "Give me the category of this pantry item. Give response in only one word.";

    // Note: `openai.images.create` may need different parameters based on OpenAI's API
    const response = await openai.images.create({
      model: "gpt-4-vision-preview", // Ensure this is a valid model name
      prompt: prompt,
      image: base64ImageUrl,
      max_tokens: 2,
    });

    return response.choices[0].text.trim(); // Adjust according to the response structure
  } catch (error) {
    console.error("Error fetching category:", error);
    return "Sorry, couldn't fetch category.";
  }
}

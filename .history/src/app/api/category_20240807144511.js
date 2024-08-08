import OpenAI from "openai";
import { getStorage, ref, getBytes } from "firebase/storage"; // Add Firebase Storage imports
import firebaseApp from "./firebase"; // Adjust this import to match your Firebase setup

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
const storage = getStorage(firebaseApp); // Initialize Firebase Storage

export default async function category(imgRef) {
  try {
    // Create a reference to the image in Firebase Storage
    const imageRef = ref(storage, imgRef);

    // Download the image as bytes
    const imageBytes = await getBytes(imageRef);

    // Convert image bytes to base64
    const base64Image = imageBytes.toString("base64");

    const prompt =
      "Give me the category of this pantry item. Give response in only one word.";

    const response = await openai.images.create({
      model: "gpt-4-vision-preview", // Use a valid model name
      prompt: prompt,
      image: base64Image,
      max_tokens: 2,
    });

    return response.choices[0].text.trim(); // Adjust according to the response structure
  } catch (error) {
    console.error("Error fetching category:", error);
    return "Sorry, couldn't fetch category.";
  }
}

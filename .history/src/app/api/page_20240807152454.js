import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

export default async function category(imgRef) {
  try {
    const base64Image = fs.readFileSync(imgRef, { encoding: "base64" });
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

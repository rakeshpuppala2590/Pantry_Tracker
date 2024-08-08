import OpenAI from "openai";
import fs from "fs";
const openai = new OpenAI();

export default async function category(imgRef) {
  const base64Image = fs.readFileSync(imgRef, {
    encoding: "base64",
  });
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview", // Use a valid model name
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });
    return response.choices[0].message.content.trim(); // Adjust according to the response structure
  } catch (error) {
    console.error("Error fetching category:", error);
    return "Sorry, couldn't fetch category.";
  }
}

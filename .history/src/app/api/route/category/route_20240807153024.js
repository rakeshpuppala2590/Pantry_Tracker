import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

export async function POST(request) {
  const { imgRef } = await request.json();

  try {
    // Ensure imgRef is a valid path or URL
    const base64Image = fs.readFileSync(path.resolve(imgRef), {
      encoding: "base64",
    });
    const prompt =
      "Give me the category of this pantry item. Give response in only one word.";

    const response = await openai.images.create({
      model: "gpt-4-vision-preview",
      prompt: prompt,
      image: base64Image,
      max_tokens: 2,
    });

    return new Response(
      JSON.stringify({ category: response.choices[0].text.trim() }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching category:", error);
    return new Response(
      JSON.stringify({ error: "Sorry, couldn't fetch category." }),
      { status: 500 }
    );
  }
}

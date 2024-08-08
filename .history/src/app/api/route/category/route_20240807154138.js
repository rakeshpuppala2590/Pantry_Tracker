import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const base64Image = image;

    const prompt =
      "Give me the category of this pantry item. Give response in only one word.";

    const response = await openai.images.create({
      model: "gpt-4-vision-preview",
      prompt: prompt,
      image: base64Image,
      max_tokens: 2,
    });

    return NextResponse.json({ category: response.choices[0].text.trim() });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Sorry, couldn't fetch category." },
      { status: 500 }
    );
  }
}

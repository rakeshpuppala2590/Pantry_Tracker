import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });

import fetch from "node-fetch"; // Use node-fetch to handle HTTP requests

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Fetch image data from URL
    const imageResponse = await fetch(image);
    const imageBuffer = await imageResponse.buffer();

    const base64Image = imageBuffer.toString("base64");

    const prompt =
      "Give me the category of this pantry item. Give response in only one word.";

    const response = await openai.images.create({
      model: "gpt-4o-mini",
      prompt: prompt,
      image: base64Image,
      max_tokens: 2,
    });

    if (response && response.choices && response.choices.length > 0) {
      return NextResponse.json({ category: response.choices[0].text.trim() });
    } else {
      return NextResponse.json({ error: "No category found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Sorry, couldn't fetch category." },
      { status: 500 }
    );
  }
}

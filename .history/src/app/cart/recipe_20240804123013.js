"use client";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Ensure to handle this securely in production
});

export default async function fetchRecipeSuggestions(pantryItems) {
  const prompt = `Suggest 5 recipes using the following ingredients: ${pantryItems.join(
    ", "
  )}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use a valid model name
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });
    return response.choices[0].message.content.trim(); // Adjust according to the response structure
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return "Sorry, couldn't fetch recipe suggestions.";
  }
}

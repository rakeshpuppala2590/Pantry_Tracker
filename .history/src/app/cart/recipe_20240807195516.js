"use client";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Ensure to handle this securely in production
});

export default async function fetchRecipeSuggestions(pantryItems) {
  const prompt = `1. Suggest only 4 finished recipes using the following ingredients in less than 150 words and each recipe in with only 30 words 2. if the items i have provided is empty please respond as none: ${pantryItems.join(
    ", "
  )}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use a valid model name
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });
    return response.choices[0].message.content.trim(); // Adjust according to the response structure
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return "Sorry, couldn't fetch recipe suggestions.";
  }
}

import * as dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you are storing your API key securely
});

async function fetchRecipeSuggestions(pantryItems) {
  const prompt = `Suggest some recipes using the following ingredients: ${pantryItems.join(
    ", "
  )}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return "Sorry, couldn't fetch recipe suggestions.";
  }
}

export default fetchRecipeSuggestions;

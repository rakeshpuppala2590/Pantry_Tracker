import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Store your API key in an environment variable
});
const openai = new OpenAIApi(configuration);

async function fetchRecipeSuggestions(pantryItems) {
  const prompt = `Suggest some recipes using the following ingredients: ${pantryItems.join(
    ", "
  )}`;

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 150,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return "Sorry, couldn't fetch recipe suggestions.";
  }
}

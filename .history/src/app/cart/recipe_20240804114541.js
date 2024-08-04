import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey:
    "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",
  dangerouslyAllowBrowser: true, // Store your API key in an environment variable
});
console.log(1);
async function fetchRecipeSuggestions(pantryItems) {
  console.log(3);
  const prompt = `Suggest some recipes using the following ingredients: ${pantryItems.join(
    ", "
  )}`;

  try {
    console.log(2);
    const response = await openai.completions.create({
      model: "gpt-4o-mini",
      prompt: prompt,
      max_tokens: 150,
    });
    console.log(response);
    return response.choices[0].text.trim();
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return "Sorry, couldn't fetch recipe suggestions.";
  }
}

export default fetchRecipeSuggestions;

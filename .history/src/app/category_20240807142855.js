import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { image, prompt } = req.body;
      const response = await openai.images.create({
        model: "gpt-4-vision-preview", // Use a valid model name
        prompt,
        image: image.replace(/^data:image\/[a-z]+;base64,/, ""), // Strip off the data URL prefix
        max_tokens: 2,
      });

      res.status(200).json({ category: response.choices[0].text.trim() });
    } catch (error) {
      console.error("Error in API route:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

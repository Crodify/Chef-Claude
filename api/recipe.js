// Vercel serverless function — the HF API key stays here, never in the browser.
const SYSTEM_PROMPT = `You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page.`

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const { ingredients } = req.body || {}
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    res.status(400).json({ error: "ingredients must be a non-empty array" })
    return
  }

  const apiKey = process.env.HF_ACCESS_TOKEN
  if (!apiKey) {
    res.status(500).json({ error: "HF_ACCESS_TOKEN is not configured" })
    return
  }

  const ingredientsString = ingredients.join(", ")

  try {
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.1-8B-Instruct",
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!` },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("HF router error:", response.status, errText)
      res.status(502).json({ error: "AI provider error" })
      return
    }

    const data = await response.json()
    const recipe = data?.choices?.[0]?.message?.content
    if (!recipe) {
      res.status(502).json({ error: "Empty response from AI provider" })
      return
    }

    res.status(200).json({ recipe })
  } catch (err) {
    console.error("Recipe generation failed:", err.message)
    res.status(500).json({ error: "Failed to generate recipe" })
  }
}

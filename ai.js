// Client-side AI calls — routes through our /api/recipe serverless function
// so API keys never ship to the browser.

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page
`

async function requestRecipe(ingredientsArr) {
    const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientsArr, systemPrompt: SYSTEM_PROMPT }),
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `Recipe request failed (${response.status})`)
    }

    const data = await response.json()
    return data.recipe
}

export async function getRecipeFromChefClaude(ingredientsArr) {
    return requestRecipe(ingredientsArr)
}

export async function getRecipeFromMistral(ingredientsArr) {
    return requestRecipe(ingredientsArr)
}

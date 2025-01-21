// app/routes/api.tokenize.ts
import type { ActionFunctionArgs } from "@remix-run/node"

// Types based on the OpenAPI spec
interface TokenizeResponse {
  text: string
  tokens: string[]
  token_ids: number[]
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  const FASTAPI_URL = process.env.FASTAPI_URL
  const API_KEY = process.env.FASTAPI_KEY

  if (!API_KEY) {
    console.error("API key not configured")
    return Response.json(
      { error: "Server configuration error" },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const { text, taskType } = body

    if (!taskType || !["NER", "PR"].includes(taskType)) {
      return Response.json(
        { error: "Valid taskType (NER or PR) is required" },
        { status: 400 },
      )
    }

    // Return 0 for non-string text
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({
        text: "",
        taskType,
        tokenCount: 0,
        totalTokens: 0,
        tokens: [],
      })
    }

    // Determine endpoint based on taskType
    const endpoint = taskType === "NER" ? "ner/tokenize" : "punc/tokenize"

    // Make request to Python backend
    const response = await fetch(`${FASTAPI_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        text,
        add_special_tokens: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to tokenize text: ${response.statusText}`)
    }

    const apiResponse: TokenizeResponse = await response.json()

    return Response.json({
      taskType,
      text: apiResponse.text,
      tokens: apiResponse.tokens,
      token_ids: apiResponse.token_ids,
    })
  } catch (error) {
    console.error("Text processing error:", error)
    return Response.json(
      {
        error: "Failed to process text",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

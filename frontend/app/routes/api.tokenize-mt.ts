// app/routes/api.tokenize-mt.ts
import type { ActionFunctionArgs } from "@remix-run/node"

// Simplified types for completion-only tokenization
interface TokenizeRequest {
  model: string
  prompt: string
  add_special_tokens?: boolean
}

interface TokenizeResponse {
  tokens: number[]
  text?: string
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  const VLLM_URL = process.env.VLLM_URL
  const API_KEY = process.env.VLLM_API_KEY

  if (!API_KEY || !VLLM_URL) {
    console.error("API configuration missing")
    return Response.json(
      { error: "Server configuration error" },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const { text } = body

    // Return empty response for invalid input
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({
        text: "",
        tokens: [],
        token_count: 0,
      })
    }

    // Prepare request body for tokenization
    const requestBody: TokenizeRequest = {
      model: "seyoungsong/Qwen2-7B-HanjaMT-AJD-KLC-AWQ",
      prompt: text,
      add_special_tokens: false,
    }

    // Make request to vLLM backend
    const response = await fetch(`${VLLM_URL}/tokenize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Failed to tokenize text: ${response.statusText}`)
    }

    const apiResponse: TokenizeResponse = await response.json()

    // Return formatted response
    return Response.json({
      text,
      tokens: apiResponse.tokens,
      token_count: apiResponse.tokens.length,
    })
  } catch (error) {
    console.error("Tokenization error:", error)
    return Response.json(
      {
        error: "Failed to tokenize text",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// app/routes/api.ner.ts
import type { ActionFunction } from "@remix-run/node"

// API response types matching the OpenAPI spec
interface NERResult {
  original: string
  xml: string
  iob: string
}

interface NERResponse {
  results: NERResult[]
}

interface NERRequest {
  texts: string[]
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const FASTAPI_URL = process.env.FASTAPI_URL
  const API_KEY = process.env.FASTAPI_KEY

  if (!API_KEY) {
    console.error("API key not configured")
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  try {
    const body = await request.json()
    const { text } = body

    // Make request to Python backend
    const response = await fetch(`${FASTAPI_URL}/ner/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        texts: [text], // API expects an array of texts
      } as NERRequest),
    })

    if (!response.ok) {
      throw new Error(`Failed to process text: ${response.statusText}`)
    }

    const apiResponse: NERResponse = await response.json()

    // Handle the case where no results were returned
    if (!apiResponse.results?.[0]) {
      throw new Error("No results returned from API")
    }

    return new Response(
      JSON.stringify({
        result: apiResponse.results[0],
        allResults: apiResponse.results,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Error processing NER:", error)

    const errorMessage =
      error instanceof Error ? error.message : "Failed to process text"

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

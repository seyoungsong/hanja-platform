// app/routes/api.translate.ts
import type { ActionFunctionArgs } from "@remix-run/node"
import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.VLLM_API_KEY,
  baseURL: process.env.VLLM_BASE_URL,
})

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  const { sourceLang, targetLang, sourceText } = await request.json()

  // Set up SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await client.chat.completions.create({
          model: "seyoungsong/Qwen2-7B-HanjaMT-AJD-KLC-AWQ",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            {
              role: "user",
              content: `Translate the following text from ${sourceLang} into ${targetLang}.\n${sourceLang}: ${sourceText}\n${targetLang}: `,
            },
          ],
          stream: true,
          temperature: 0,
          seed: 42,
          frequency_penalty: 0.4,
        })

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || ""
          controller.enqueue(new TextEncoder().encode(content))
        }
        controller.close()
      } catch (error) {
        console.error("Translation error:", error)
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Encoding": "none", // Prevents gzip compression
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no", // Prevents nginx buffering
      Connection: "keep-alive",
    },
  })
}

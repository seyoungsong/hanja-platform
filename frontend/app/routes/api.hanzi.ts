// app/routes/api.hanzi.ts
import type { ActionFunctionArgs } from "@remix-run/node"
import hanzi from "hanzi"

// Initialize hanzi once when the server starts
if (!hanzi.ifComponentExists("一")) {
  hanzi.start()
}

interface DefinitionsMap {
  [key: string]: string[] | undefined
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const { text } = await request.json()

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 })
    }

    const characters = text.split("")
    const definitionsMap: DefinitionsMap = characters.reduce(
      (acc: DefinitionsMap, char: string) => {
        if (!/\s/.test(char)) {
          const definitions = hanzi
            .definitionLookup(char)
            ?.map((def: { definition: string }) => def.definition)
          acc[char] = definitions
        }
        return acc
      },
      {} as DefinitionsMap,
    )

    return Response.json({ definitions: definitionsMap })
  } catch (error) {
    console.error("Error processing characters:", error)
    return Response.json(
      { error: "Failed to process characters" },
      { status: 500 },
    )
  }
}

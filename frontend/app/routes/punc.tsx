// app/routes/punc.tsx
import { MetaFunction, useNavigate, useSearchParams } from "@remix-run/react"
import { Bolt, Copy, Languages, Quote, Save, UserSearch } from "lucide-react"
import { useEffect, useState } from "react"
import { InteractiveGlossary } from "~/components/InteractiveGlossary"
import { MyContainer, MyHeader } from "~/components/MyCommon"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { useToast } from "~/hooks/use-toast"
import { cenv } from "~/lib/cenv"
import { normalizeStr } from "~/lib/normalize"
import { getPocketBaseBrowserClient } from "~/lib/pocketbase"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Punctuation" }]
}

const MAX_TOKENS = 512

interface TextStats {
  chars: number
  tokenCount: number
  tokens: string[]
  token_ids?: number[]
}

interface Stats {
  source: TextStats
  model: TextStats
  user: TextStats
}

const DEFAULT_STATS: TextStats = {
  chars: 0,
  tokenCount: 0,
  tokens: [],
  token_ids: [],
}

interface TokenizeResponse {
  taskType: string
  text: string
  tokens: string[]
  token_ids: number[]
}

const isPunctuationOrSpace = (char: string) =>
  char.match(/\p{gc=P}|\p{gc=Z}/u) !== null

const cleanText = (text: string) =>
  Array.from(text)
    .filter(char => !isPunctuationOrSpace(char))
    .join("")

const PunctuationRestoration = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sourceText, setSourceText] = useState("")
  const [modelOutput, setModelOutput] = useState("")
  const [userEditOutput, setUserEditOutput] = useState("")
  const [style, setStyle] = useState("comprehensive")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [shouldNormalize, setShouldNormalize] = useState(true)
  const [stats, setStats] = useState<Stats>({
    source: DEFAULT_STATS,
    model: DEFAULT_STATS,
    user: DEFAULT_STATS,
  })

  // Load history item if ID is provided
  const loadHistoryItem = async (id: string) => {
    setIsLoading(true)
    try {
      const pb = getPocketBaseBrowserClient()
      const record = await pb.collection("history").getOne(id)

      if (record.action !== "PR") {
        throw new Error("Invalid history item type")
      }

      const details = record.details as {
        text?: string
        mode?: string
        pred?: string
        user?: string
      }

      if (details.text) setSourceText(details.text)
      if (details.mode) setStyle(details.mode)
      if (details.pred) setModelOutput(details.pred)
      if (details.user) setUserEditOutput(details.user)
    } catch (error) {
      console.error("Failed to load history item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load history item",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Save input to history before processing
  const saveInputToHistory = async (text: string, mode?: string) => {
    const pb = getPocketBaseBrowserClient()

    if (!pb.authStore.isValid) {
      console.warn("Not logged in, skipping history save")
      return
    }

    try {
      await pb.collection("history").create({
        action: "PR",
        details: {
          text: text,
          mode: mode || style,
        },
        owner: pb.authStore.record?.id,
        inputOnly: true,
      })
    } catch (error) {
      console.error("Failed to save input to history:", error)
    }
  }

  // Handle URL parameters
  useEffect(() => {
    const id = searchParams.get("id")

    if (id) {
      loadHistoryItem(id)
      setSearchParams({}, { replace: true })
      return
    }

    const textParam = searchParams.get("text")
    const predParam = searchParams.get("pred")
    const editParam = searchParams.get("edit")
    const runParam = searchParams.get("run")
    const modeParam = searchParams.get("mode")

    if (textParam) {
      const decodedText = decodeURIComponent(textParam)
      // If mode=clean, remove punctuation from input text
      const processedText =
        modeParam === "clean" ? cleanText(decodedText) : decodedText
      setSourceText(processedText)
    }

    if (predParam) {
      const decodedPred = decodeURIComponent(predParam)
      setModelOutput(decodedPred)
    }

    if (editParam) {
      const decodedEdit = decodeURIComponent(editParam)
      setUserEditOutput(decodedEdit)
    }

    // Auto-run prediction if run parameter is present and we have source text
    if (runParam && textParam) {
      const decodedText = decodeURIComponent(textParam)
      const processedText =
        modeParam === "clean" ? cleanText(decodedText) : decodedText
      processText(processedText).catch(console.error)
    }

    // Clean up URL after reading the parameters
    setSearchParams({}, { replace: true })
  }, [])

  const sendToPage = (page: "translation" | "ner") => {
    if (!userEditOutput.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some text to send",
      })
      return
    }

    const encodedText = encodeURIComponent(userEditOutput)
    const url = `/${page}?text=${encodedText}&run=true`

    navigate(url)
  }

  const updateTextStats = async (text: string, section: keyof Stats) => {
    try {
      const response = await fetch("/api/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, taskType: "PR" }),
      })

      if (!response.ok) throw new Error("Failed to count tokens")

      const data: TokenizeResponse = await response.json()

      setStats(prev => ({
        ...prev,
        [section]: {
          chars: text.length,
          tokenCount: data.token_ids.length,
          tokens: data.tokens,
          token_ids: data.token_ids,
        },
      }))
    } catch (error) {
      console.error("Token counting error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to count tokens",
      })
    }
  }

  useEffect(() => {
    if (sourceText.trim()) updateTextStats(sourceText, "source")
    if (modelOutput.trim()) updateTextStats(modelOutput, "model")
    if (userEditOutput.trim()) updateTextStats(userEditOutput, "user")
  }, [sourceText, modelOutput, userEditOutput])

  const removePunctuation = () => {
    setSourceText(cleanText(sourceText))
  }

  const copyModelOutput = async () => {
    try {
      await navigator.clipboard.writeText(modelOutput)
      toast({
        title: "Success",
        description: "Copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard",
      })
    }
  }

  const processText = async (textToProcess?: string) => {
    const textToUse = textToProcess || sourceText

    if (!textToUse.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some text to process",
      })
      return
    }

    // Save input to history before processing
    await saveInputToHistory(textToUse)

    setIsProcessing(true)
    try {
      // Normalize the text first if the toggle is enabled
      const normalizedText = shouldNormalize
        ? normalizeStr(textToUse)
        : textToUse

      const response = await fetch("/api/punctuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: normalizedText, style }),
      })

      if (!response.ok) throw new Error("Failed to process text")

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setModelOutput(data.punctuatedText)
      setUserEditOutput(data.punctuatedText)
    } catch (error) {
      console.error("Error processing text:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to process text",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStats = (section: keyof Stats) => (
    <div className="space-y-1 text-sm text-muted-foreground">
      <div>
        Characters: {stats[section].chars} | Tokens:{" "}
        <span
          className={
            stats[section].tokenCount > MAX_TOKENS ? "text-red-500" : ""
          }
        >
          {stats[section].tokenCount}
        </span>
        /{MAX_TOKENS}
      </div>
    </div>
  )

  const saveToHistory = async () => {
    const pb = getPocketBaseBrowserClient()

    if (!pb.authStore.isValid) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please log in to save to history.",
      })
      return
    }

    try {
      // Create history entry with all relevant data
      await pb.collection("history").create({
        action: "PR",
        details: {
          text: sourceText,
          pred: modelOutput,
          user: userEditOutput,
          mode: style,
        },
        owner: pb.authStore.record?.id,
        inputOnly: false,
      })
      toast({
        title: "Success",
        description: "Progress saved to history.",
      })
    } catch (error) {
      console.error("Failed to save to history:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save to history.",
      })
    }
  }

  const headerButtons = (
    <div className="flex justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => sendToPage("ner")}
        className="flex items-center gap-2"
        disabled={!userEditOutput.trim()}
      >
        <UserSearch className="h-4 w-4" />
        <span className="hidden sm:inline">Open in NER</span>
      </Button>
      <Button
        variant="outline"
        onClick={() => sendToPage("translation")}
        className="flex items-center gap-2"
        disabled={!userEditOutput.trim()}
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">Open in Translation</span>
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <MyContainer>
      <MyHeader
        title="Punctuation Restoration"
        description="Restore modern punctuation to historical texts using advanced natural language processing."
        buttons={headerButtons}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="punctuation-style"
              className="text-sm text-muted-foreground"
            >
              Punctuation Style
            </label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger id="punctuation-style" className="w-[180px]">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="simple-space">Simple (w/ space)</SelectItem>
                <SelectItem value="comprehensive">Comprehensive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={removePunctuation}
            className="flex items-center gap-2"
            title="Remove Punctuation"
          >
            <Quote className="h-4 w-4" />
            <span className="hidden sm:inline">Remove Punctuation</span>
          </Button>

          <Button
            onClick={() => processText()}
            disabled={isProcessing}
            className="flex items-center gap-2"
            title="Process"
          >
            <Bolt className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isProcessing ? "Processing..." : "Process"}
            </span>
          </Button>
        </div>
      </div>

      <Card className={cenv.isCompact ? "mb-2" : "mb-6"}>
        <CardContent className="pt-6">
          <Textarea
            placeholder="Enter text without punctuation..."
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            className="mb-2 h-[150px] min-h-[30px] resize-y"
          />
          {renderStats("source")}
        </CardContent>
      </Card>

      <div
        className={
          cenv.isCompact
            ? "mb-2 grid grid-cols-1 gap-2 lg:grid-cols-2"
            : "mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
        }
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Model Prediction</CardTitle>
            <Button
              variant="outline"
              onClick={copyModelOutput}
              className="flex items-center gap-2"
              title="Copy"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Model output will appear here..."
              value={modelOutput}
              className="mb-2 h-[300px] min-h-[30px] resize-y bg-muted"
              readOnly
            />
            {renderStats("model")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>User Annotations</CardTitle>
            <Button
              variant="outline"
              onClick={saveToHistory}
              className="flex items-center gap-2"
              title="Save"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Edit the model's output here..."
              value={userEditOutput}
              onChange={e => setUserEditOutput(e.target.value)}
              className="mb-2 h-[300px] min-h-[30px] resize-y"
            />
            {renderStats("user")}
          </CardContent>
        </Card>
      </div>

      <InteractiveGlossary text={userEditOutput} />
    </MyContainer>
  )
}

export default PunctuationRestoration

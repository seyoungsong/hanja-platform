// app/routes/translation.tsx
import { MetaFunction, useNavigate, useSearchParams } from "@remix-run/react"
import { Bolt, Copy, Quote, Save, UserSearch } from "lucide-react"
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
import { getPocketBaseBrowserClient } from "~/lib/pocketbase"

const MAX_TOKENS = 512

interface TextStats {
  chars: number
  tokenCount: number
  tokens: string[]
}

interface Stats {
  source: TextStats
  model: TextStats
  user: TextStats
}

interface TokenizeResponse {
  text: string
  tokens: string[]
  token_count: number
  error?: string
}

const DEFAULT_STATS: TextStats = {
  chars: 0,
  tokenCount: 0,
  tokens: [],
}

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Translation" }]
}

const TranslationInterface = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sourceLang, setSourceLang] = useState("Hanja")
  const [targetLang, setTargetLang] = useState("Korean")
  const [sourceText, setSourceText] = useState("")
  const [modelOutput, setModelOutput] = useState("")
  const [userEditOutput, setUserEditOutput] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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

      if (record.action !== "MT") {
        throw new Error("Invalid history item type")
      }

      const details = record.details as {
        text?: string
        source?: string
        target?: string
        pred?: string
        user?: string
      }

      if (details.text) setSourceText(details.text)
      if (details.source) setSourceLang(details.source)
      if (details.target) setTargetLang(details.target)
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
    const sourceLangParam = searchParams.get("source")
    const targetLangParam = searchParams.get("target")
    const runParam = searchParams.get("run")

    if (textParam) {
      const decodedText = decodeURIComponent(textParam)
      setSourceText(decodedText)
    }

    if (predParam) {
      const decodedPred = decodeURIComponent(predParam)
      setModelOutput(decodedPred)
    }

    if (editParam) {
      const decodedEdit = decodeURIComponent(editParam)
      setUserEditOutput(decodedEdit)
    }

    if (sourceLangParam) {
      const decodedSourceLang = decodeURIComponent(sourceLangParam)
      setSourceLang(decodedSourceLang)
    }

    if (targetLangParam) {
      const decodedTargetLang = decodeURIComponent(targetLangParam)
      setTargetLang(decodedTargetLang)
    }

    // Auto-run translation if run parameter is present and we have source text
    if (runParam && textParam) {
      const decodedText = decodeURIComponent(textParam)
      const decodedSourceLang = sourceLangParam
        ? decodeURIComponent(sourceLangParam)
        : sourceLang
      const decodedTargetLang = targetLangParam
        ? decodeURIComponent(targetLangParam)
        : targetLang
      handleTranslate(decodedText, decodedSourceLang, decodedTargetLang).catch(
        console.error,
      )
    }

    // Clean up URL after reading the parameters
    setSearchParams({}, { replace: true })
  }, [])

  const updateTextStats = async (text: string, section: keyof Stats) => {
    try {
      const response = await fetch("/api/tokenize-mt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error("Failed to count tokens")

      const data: TokenizeResponse = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setStats(prev => ({
        ...prev,
        [section]: {
          chars: text.length,
          tokenCount: data.token_count,
          tokens: data.tokens,
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

  const sendToPage = (page: "punc" | "ner") => {
    if (!sourceText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some text to send",
      })
      return
    }

    const encodedText = encodeURIComponent(sourceText)
    const url = `/${page}?text=${encodedText}&run=true`

    navigate(url)
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

  const saveInputToHistory = async (
    text: string,
    sourceLanguage?: string,
    targetLanguage?: string,
  ) => {
    const pb = getPocketBaseBrowserClient()

    if (!pb.authStore.isValid) {
      console.warn("Not logged in, skipping history save")
      return
    }

    try {
      await pb.collection("history").create({
        action: "MT",
        details: {
          text: text,
          source: sourceLanguage || sourceLang,
          target: targetLanguage || targetLang,
        },
        owner: pb.authStore.record?.id,
        inputOnly: true,
      })
    } catch (error) {
      console.error("Failed to save input to history:", error)
    }
  }

  const handleTranslate = async (
    textToTranslate?: string,
    sourceLanguage?: string,
    targetLanguage?: string,
  ) => {
    const textToUse = textToTranslate || sourceText
    if (!textToUse.trim()) return

    setIsTranslating(true)
    setModelOutput("")

    // Save input to history before translation
    await saveInputToHistory(textToUse, sourceLanguage, targetLanguage)

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLang: sourceLanguage || sourceLang,
          targetLang: targetLanguage || targetLang,
          sourceText: textToUse,
        }),
      })

      if (!response.ok) {
        throw new Error("Translation failed")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to read response body")
      }

      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        fullText += chunk
        setModelOutput(fullText)
        setUserEditOutput(fullText)
      }
    } catch (err) {
      console.error("Translation error:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error occurred during translation. Please try again.",
      })
    } finally {
      setIsTranslating(false)
    }
  }

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
      await pb.collection("history").create({
        action: "MT",
        details: {
          text: sourceText,
          pred: modelOutput,
          user: userEditOutput,
          source: sourceLang,
          target: targetLang,
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

  const headerButtons = (
    <div className="flex justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => sendToPage("punc")}
        className="flex items-center gap-2"
        disabled={!sourceText.trim()}
      >
        <Quote className="h-4 w-4" />
        <span className="hidden sm:inline">Open in Punctuation</span>
      </Button>
      <Button
        variant="outline"
        onClick={() => sendToPage("ner")}
        className="flex items-center gap-2"
        disabled={!sourceText.trim()}
      >
        <UserSearch className="h-4 w-4" />
        <span className="hidden sm:inline">Open in NER</span>
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
        title="Machine Translation"
        description="Convert historical Hanja texts into modern Korean and English with state-of-the-art machine translation."
        buttons={headerButtons}
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="source-language"
              className="text-sm text-muted-foreground"
            >
              Source Language
            </label>
            <Select value={sourceLang} onValueChange={setSourceLang} disabled>
              <SelectTrigger id="source-language" className="w-36">
                <SelectValue placeholder="Source Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hanja">Hanja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="target-language"
              className="text-sm text-muted-foreground"
            >
              Target Language
            </label>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger id="target-language" className="w-36">
                <SelectValue placeholder="Target Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Korean">Korean</SelectItem>
                <SelectItem value="English">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={() => handleTranslate()}
          disabled={isTranslating || !sourceText}
          className="flex items-center gap-2"
        >
          <Bolt className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isTranslating ? "Processing..." : "Process"}
          </span>
        </Button>
      </div>

      <Card className={cenv.isCompact ? "mb-2" : "mb-6"}>
        <CardContent className="pt-6">
          <Textarea
            id="source-text"
            placeholder="Enter text to translate..."
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            className="mb-2 h-[150px] min-h-[30px] resize-y"
            aria-label="Source text"
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
              placeholder="Translation will appear here..."
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
              placeholder="Edit the translation here..."
              value={userEditOutput}
              onChange={e => setUserEditOutput(e.target.value)}
              className="mb-2 h-[300px] min-h-[30px] resize-y"
            />
            {renderStats("user")}
          </CardContent>
        </Card>
      </div>

      <InteractiveGlossary text={sourceText} />
    </MyContainer>
  )
}

export default TranslationInterface

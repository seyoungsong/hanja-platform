// app/routes/_index.tsx
import { Link, MetaFunction } from "@remix-run/react"
import { ArrowRight, Languages, Quote, UserSearch } from "lucide-react"
import { MyContainer, MyHeader } from "~/components/MyCommon"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Home" }]
}

export default function HanjaNLP() {
  const authButtons = (
    <div className="flex justify-center gap-4">
      <Button asChild variant="outline">
        <Link
          to="/login"
          data-umami-event="click_login"
          data-umami-event-type="navigation"
        >
          Join as Annotator
        </Link>
      </Button>
      <Button asChild>
        <Link
          to="/example"
          data-umami-event="click_examples"
          data-umami-event-type="navigation"
        >
          View Examples
        </Link>
      </Button>
    </div>
  )

  return (
    <MyContainer>
      <MyHeader
        title="🏛️ Hanja Processing Platform"
        description="A collaborative platform for processing and annotating historical Korean documents written in Hanja, featuring advanced NLP capabilities."
        buttons={authButtons}
      />

      <section className="mb-12">
        <h2 className="mb-8 text-center text-2xl font-semibold">
          Processing Pipeline
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {/* Punctuation Card */}
          <Link
            to="/punc"
            className="group"
            data-umami-event="click_pipeline_punctuation"
            data-umami-event-type="pipeline_navigation"
            data-umami-event-feature="punctuation"
          >
            <Card className="flex h-48 w-48 flex-col items-center justify-center transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <Quote className="mx-auto mb-4 h-12 w-12 transition-colors group-hover:text-primary" />
                <h3 className="mb-2 font-semibold">Punctuation</h3>
                <p className="text-sm text-muted-foreground">
                  Restore modern punctuation to historical texts
                </p>
              </CardContent>
            </Card>
          </Link>

          <ArrowRight className="h-8 w-8 text-muted-foreground" />

          {/* NER Card */}
          <Link
            to="/ner"
            className="group"
            data-umami-event="click_pipeline_ner"
            data-umami-event-type="pipeline_navigation"
            data-umami-event-feature="ner"
          >
            <Card className="flex h-48 w-48 flex-col items-center justify-center transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <UserSearch className="mx-auto mb-4 h-12 w-12 transition-colors group-hover:text-primary" />
                <h3 className="mb-2 font-semibold">Named Entities</h3>
                <p className="text-sm text-muted-foreground">
                  Identify and tag important entities in the document
                </p>
              </CardContent>
            </Card>
          </Link>

          <ArrowRight className="h-8 w-8 text-muted-foreground" />

          {/* Translation Card */}
          <Link
            to="/translation"
            className="group"
            data-umami-event="click_pipeline_translation"
            data-umami-event-type="pipeline_navigation"
            data-umami-event-feature="translation"
          >
            <Card className="flex h-48 w-48 flex-col items-center justify-center transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <Languages className="mx-auto mb-4 h-12 w-12 transition-colors group-hover:text-primary" />
                <h3 className="mb-2 font-semibold">Translation</h3>
                <p className="text-sm text-muted-foreground">
                  Translate Hanja to modern Korean or English
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </MyContainer>
  )
}

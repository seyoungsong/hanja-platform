// app/components/MyCommon.tsx
import React from "react"
import { Separator } from "~/components/ui/separator"
import { cenv } from "~/lib/cenv"

interface MyHeaderProps {
  title: string
  description?: string
  buttons?: React.ReactNode
}

interface MyContainerProps {
  children: React.ReactNode
}

export const MyHeader = ({ title, description, buttons }: MyHeaderProps) => {
  if (cenv.isCompact)
    // for demo purposes
    return (
      <>
        <section className="space-y-4 py-4 text-center">
          <h1 className="text-4xl font-bold">{title}</h1>
          {buttons && <div className="pt-0">{buttons}</div>}
        </section>

        <Separator className="mb-2" />
      </>
    )

  return (
    <>
      <section className="space-y-4 py-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && (
          <p className="mx-auto max-w-6xl text-base text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
        {buttons && <div className="pt-4">{buttons}</div>}
      </section>

      <Separator className="mb-8" />
    </>
  )
}

const MyFooter = () => {
  return (
    <>
      <Separator className="my-8" />
      <footer className="pb-8 text-center">
        <p className="text-sm text-muted-foreground">
          Developed for Historical Document Research
        </p>
      </footer>
    </>
  )
}

export const MyContainer: React.FC<MyContainerProps> = ({ children }) => {
  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {children}
        <MyFooter />
      </div>
    </main>
  )
}

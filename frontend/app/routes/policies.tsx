// app/routes/policies.tsx
import { MetaFunction } from "@remix-run/react"
import { FileText, Shield } from "lucide-react"
import { MyContainer, MyHeader } from "~/components/MyCommon"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Terms & Policies" }]
}

interface PolicySection {
  title: string
  content: string
}

interface PolicySectionProps {
  title: string
  content: string
}

const PolicySection: React.FC<PolicySectionProps> = ({ title, content }) => (
  <div className="space-y-3">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm leading-relaxed text-muted-foreground">{content}</p>
  </div>
)

export default function TermsPage() {
  const privacyPolicySections: PolicySection[] = [
    {
      title: "1. Data Collection",
      content:
        "Our data collection process involves gathering user interaction data with our NLP tools to enhance our model performance through research. For account holders, we collect essential information including email addresses and basic profile details. We utilize Umami analytics for anonymous usage statistics tracking, and we gather feedback submissions along with model interactions to support our ongoing research initiatives.",
    },
    {
      title: "2. Data Usage",
      content:
        "The data we collect serves primarily non-profit research purposes, particularly in advancing our Reinforcement Learning from Human Feedback (RLHF) systems. We may publish aggregated, anonymized data in academic research papers to contribute to the broader scientific community. Additionally, we collaborate with research partners and may share data with third parties for research purposes. In the future, we may also share anonymized data with other third parties to further advance research in this field.",
    },
    {
      title: "3. Data Protection",
      content:
        "We take data protection seriously and implement comprehensive security measures to safeguard your information. All personal information is stored securely and maintained separately from research data to ensure privacy. We respect your right to data privacy, and you may request the deletion of your personal data at any time through our designated channels.",
    },
  ]

  const termsOfServiceSections: PolicySection[] = [
    {
      title: "1. Service Description",
      content:
        "Our platform is a research project dedicated to providing specialized NLP tools for processing Hanja text. We offer a range of services including punctuation restoration, named entity recognition, and machine translation. As a non-profit, research-oriented service, our primary goal is to advance the field of natural language processing while providing valuable tools to our users.",
    },
    {
      title: "2. User Agreement",
      content:
        "By choosing to use our service, you acknowledge and consent to several important terms. This includes the collection of interaction data for research purposes, the implementation of Umami analytics for usage tracking, and the potential use of your feedback for model improvement. We may share anonymized data with third parties for research purposes, though you retain full ownership of any text you submit for processing through our system.",
    },
    {
      title: "3. Usage Terms",
      content:
        "Our service is provided 'as is' for research purposes, and while we strive for excellence, we cannot guarantee continuous availability or absolute accuracy of results. Users must engage with the service responsibly and refrain from any attempts to abuse or harm the system. Please note that any commercial use of our service requires explicit permission from our team.",
    },
  ]

  return (
    <MyContainer>
      <MyHeader
        title="Terms & Policies"
        description="Please read our terms of service and privacy policy carefully."
      />
      <div className="space-y-8">
        <Card className="shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            </div>
            <CardDescription className="text-base">
              How we collect and use your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {privacyPolicySections.map((section, index) => (
              <PolicySection key={index} {...section} />
            ))}
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Terms of Service</CardTitle>
            </div>
            <CardDescription className="text-base">
              Rules and guidelines for using our service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {termsOfServiceSections.map((section, index) => (
              <PolicySection key={index} {...section} />
            ))}
          </CardContent>
        </Card>
      </div>
    </MyContainer>
  )
}

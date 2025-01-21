// app/routes/example.tsx
import { Link, MetaFunction } from "@remix-run/react"
import { ArrowRight, Languages, Quote, UserSearch } from "lucide-react"
import { MyContainer, MyHeader } from "~/components/MyCommon"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardHeader } from "~/components/ui/card"

export const meta: MetaFunction = () => {
  return [{ title: "Hanja Platform | Examples" }]
}

interface Example {
  title: string
  text: string
  task: string
  source: string
  hashtags?: string[]
}

const examples: Example[] = [
  {
    // http://esillok.history.go.kr/record/recordView.do?id=eda_11004104_007
    title: "Translate Historical Record to English",
    text: '○禮曹啓: "今當農月, 雨澤愆期, 將來可慮。 請申明修溝壑、淨阡陌、審理冤獄、賑恤窮乏、掩骼埋胔等事。" 從之。',
    task: "MT-English",
    source: "Annals of the Joseon Dynasty",
    hashtags: ["세종실록", "1428년 윤4월 4일"],
  },
  {
    // https://sillok.history.go.kr/id/kva_11003003_001
    title: "Translate Historical Record to Korean",
    text: '○丁未/敎曰: "肅廟御製, 有三忠圖像贊, 而祠在永柔縣 臥龍山, 三忠畫像, 俱在此寺云。 祭文當親撰, 遣近侍致祭。 聞忠烈祠致祭在今日, 而寧遠伯影堂, 在本府云, 亦令一體致祭。"',
    task: "MT-Korean",
    source: "Annals of the Joseon Dynasty",
    hashtags: ["정조실록", "1786년 3월 3일"],
  },
  {
    // https://sillok.history.go.kr/id/kda_10707005_002
    // https://sillok.history.go.kr/id/kda_10707011_009
    // ○司憲府啓: "文昭殿行香使許權叱勑陪香之吏, 使之徒步馬前。 又於敦化門外據胡床, 令陪香吏立侍於前, 殊無敬上之心。 請按律科罪。" 不允。 權之爲人, 徒以害人爲心, 人皆鄙之。
    title: "Extract Named Entities from Historical Record",
    text: '○封盧閈之妻閔氏爲明惠宅主, 南暉之母方氏 寧淑宅主。 以李孟畇爲禮曹判書, 曺備衡工曹判書, 崔閏德議政府參贊, 李之剛中軍都摠制, 申商右軍都摠制平安道都觀察使, 金自知禮曹參判, 李明德中軍摠制黃海道都觀察使, 李興發右軍摠制全羅道兵馬都節制使, 崔府左軍同知摠制全羅道都觀察使, 權蹈集賢殿副提學。 上曰: "明德老母在江原道 伊川, 境接黃海道, 明德宜爲黃海監司。" 遂命之。',
    task: "NER",
    source: "Annals of the Joseon Dynasty",
    hashtags: ["세종실록", "1425년 7월 5일"],
  },
  {
    // https://sillok.history.go.kr/id/kda_10707007_001
    title: "Restore Punctuation in Historical Record",
    text: `○甲戌/上憫雨, 召領敦寧柳廷顯、左議政李原、贊成黃喜、刑曹判書權軫、兵曹判書趙末生、吏曹判書許稠、戶曹判書安純、禮曹判書李孟畇、大提學卞季良曰: "二十年以來, 如此旱災, 未之見焉。 惟予寡德, 不敢安居廈屋, 欲避居於本宮, 但慮酷熱, 無軍士可居之所, 肆居於此宮。 宮中所居有三, 予不居正寢, 而就外側室居之, 以思弭災之道。 然猶欲出西離宮, 以答天譴, 何如?" 僉曰: "殿下憂旱自責, 欲避厥居, 大哉言乎! 誠萬世之嘉言也。 然出御離宮, 則軍士侍衛、臣寮進退、膳羞轉輸, 亦皆有弊, 莫若仍御此宮之爲可也。" 上曰: "予欲除弊, 而慮不及此。 卿等之言甚當, 予其從之。" 上又曰: "觀各道雨澤之報, 外方則雨澤足矣, 而獨不雨於京城, 恐或上天有爲而然也。 且於政事之間, 猶恐有可疑之事也。 以孟溫之事觀之, 諸宰相初則皆以刑曹所啓爲是, 及臺諫上疏論請, 則又以刑曹爲非, 而臺諫爲是, 其所以爲是爲非, 別無他意, 一人曰是, 而衆以爲是; 一人曰非, 而衆以爲非。 予以爲, 此則不致精思, 雷同之弊也。 擧此一事, 可知其他, 政事之失, 豈可謂必無也? 其各勉思弭災之(等)〔策〕 , 悉陳無隱。" 僉曰: "聖上恐懼修省, 爲日已久, 政敎號令, 意謂無失, 臣等向於求言之日, 尙未講救旱之策以答, 以答宵旰之憂, 更有何策可陳? 但前日所上各品陳言, 更裁擇施行。"`,
    task: "PR-clean",
    source: "Annals of the Joseon Dynasty",
    hashtags: ["세종실록", "1425년 7월 7일"],
  },
  {
    // https://db.itkc.or.kr/dir/item?itemId=BT#/dir/node?dataId=ITKC_BT_1260A_0010_020_0010
    title: "Translate Ancient Korean Poetry to Korean",
    text: `東嶽絶殊異，紫崿疊靑㟽。雕鍥入纖微，神匠洩機巧。仙賞委瀛壖，幽姿獨窈窕。惜無棲隱客，瀟洒脫塵表。`,
    task: "MT-Korean",
    source: "Korean Literary Collections",
    hashtags: ["정약용", "여유당전서", "동악을 그리며"],
  },
  {
    // https://db.itkc.or.kr/dir/item?itemId=BT#/dir/node?dataId=ITKC_BT_0001A_0210_040_0100
    title: "Translate Ancient Korean Poetry to English",
    text: `巉嵒絶頂欲摩天，海日初開一朶蓮。勢削不容凡樹木，格高唯惹好雲煙。點酥寒影粧新雪，戛玉淸音噴細泉。靜想蓬萊只如此，應當月夜會群仙。`,
    task: "MT-English",
    source: "Korean Literary Collections",
    hashtags: ["최치원", "계원필경집", "바위 봉우리"],
  },
  {
    // https://db.itkc.or.kr/dir/item?itemId=BT#/dir/node?dataId=ITKC_BT_1260A_0090_010_0020
    title: "Extract Named Entities from Literary Text",
    text: `問，鹽者，百事之所需，萬口之所仰，佐民食而裕國用，未有大於鹽者矣。絺鹽之貢，始見堯代，則燧食之初，未及煮海歟？剛鹵之象，已著〈說卦〉，則羲畫之時，早有鹺地歟？祭祀必貴美物，則反用苦鹽者，何義？賓客不嫌褻味，則特用形鹽者，何禮？〈齊語〉曰：“夷吾通魚鹽之路，爲諸侯利。” 《管子》曰：“管子榷鹽鐵之權，爲萬民毒。” 二人之毀譽，若是不同，兩書之是非，其可明言歟？得齊未久，秦已失國，則董子稱鹽利之倍於古，得無誤歟？纂漢之志，吳旣素蓄，則班固稱鹽利之萌其亂，無乃疎歟？官剏於元狩，而庫府虛耗，鹽價減於地節，而郡國殷富，鹽固不足以佐國用歟？禺筴者，何法？牢盆者，何物？發難文學者，何說？諫復鹽官者，何人？以經則池鹽ㆍ石鹽ㆍ井鹽ㆍ地鹽，已作於成周，以史則通池取石煮井刮地，始見於後魏，豈此諸鹽之法，中廢於秦ㆍ漢之際歟？鹽池ㆍ鹽井，總有幾穴？水鹽ㆍ厓鹽，凡有幾種？靑鹽ㆍ綠鹽ㆍ白鹽ㆍ紅鹽ㆍ黑鹽，其色不同，蠶鹽ㆍ欒鹽ㆍ蓬鹽ㆍ冷鹽ㆍ陌鹽，其名各殊，其所出之地，所用之事，皆可指陳歟？甄琛力言罷官，無乃議論太高歟？劉彤全言利民，無乃名實不副歟？劉晏之常平法，得失未明，韓愈之官賣議，掊擊太嚴，熙ㆍ豐之法，竝榷河北，大明之律，至擬斬決，其是非曲直，皆可詳言歟？寒鹽見於何書？乳鹽見於何地？`,
    task: "NER",
    source: "Korean Literary Collections",
    hashtags: ["정약용", "다산시문집", "염책(鹽策)"],
  },
  {
    // https://db.itkc.or.kr/dir/item?itemId=BT#/dir/node?dataId=ITKC_BT_1550A_0030_000_0220
    title: "Restore Punctuation in Literary Text",
    text: `濊者，東夷舊號。《三國史》：“北溟人耕田，得濊王印。” 《三國志》：“夫餘印文曰‘濊王之印’。” 蓋急讀之爲濊，緩讀之爲夫餘，其實則一也。後凡言蒲與路、福餘衛，皆夫餘之音轉也。濊故都在我江陵府，夫餘故都在今開原縣，蒲與路在吉林以北，福餘衛在瀋陽以東，百濟故都扶餘縣在我湖西，是皆濊也。我人呼倭爲濊，則未知何據。倭亦東夷，故混稱之歟？`,
    task: "PR-clean",
    source: "Korean Literary Collections",
    hashtags: ["유득공", "고운당필기", "왜를 예라 부르다"],
  },
]

const getTaskIcon = (task: string) => {
  const taskType = task.split("-")[0]
  switch (taskType) {
    case "MT":
      return <Languages className="h-4 w-4" />
    case "NER":
      return <UserSearch className="h-4 w-4" />
    case "PR":
      return <Quote className="h-4 w-4" />
    default:
      return <ArrowRight className="h-4 w-4" />
  }
}

const getTaskRoute = (task: string, text: string): string => {
  const encodedText = encodeURIComponent(text)
  const [taskType, taskMode] = task.split("-")
  switch (taskType) {
    case "MT":
      return `/translation?text=${encodedText}&target=${
        taskMode || "English"
      }&run=true`
    case "NER":
      return `/ner?text=${encodedText}&run=true`
    case "PR":
      return `/punc?text=${encodedText}&mode=${taskMode || "clean"}&run=true`
    default:
      return "/"
  }
}

// Helper function to generate event data
const getExampleEventData = (example: Example) => ({
  "data-umami-event": "click_example",
  "data-umami-event-task": example.task,
  "data-umami-event-source": example.source,
  "data-umami-event-title": example.title,
})

export default function Examples() {
  return (
    <MyContainer>
      <MyHeader
        title="Example Tasks"
        description="Explore our NLP tools with these example scenarios"
      />
      {examples.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {examples.map((example, index) => (
            <Link
              key={`${example.title}-${index}`}
              to={getTaskRoute(example.task, example.text)}
              className="w-full text-left"
              {...getExampleEventData(example)}
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <h3
                    className="truncate pr-4 font-semibold"
                    title={example.title}
                  >
                    {example.title}
                  </h3>
                  <div className="text-muted-foreground">
                    {getTaskIcon(example.task)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p
                    className="line-clamp-2 text-sm text-muted-foreground"
                    title={example.text}
                  >
                    {example.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {example.source}
                    </Badge>
                    {example.hashtags?.map((tag, tagIndex) => (
                      <Badge
                        key={`${tag}-${tagIndex}`}
                        variant="outline"
                        className="text-xs"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No examples available at the moment.
        </p>
      )}
    </MyContainer>
  )
}

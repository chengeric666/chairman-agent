import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";
import { ThreadPrimitive, useThreadRuntime } from "@assistant-ui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FC, useMemo, useState } from "react";
import { TighterText } from "../ui/header";
import { NotebookPen, FileBarChart } from "lucide-react";
import { ProgrammingLanguagesDropdown } from "../ui/programming-lang-dropdown";
import { Button } from "../ui/button";
import { ReportTemplateDialog } from "../report/ReportTemplateDialog";
import { ReportTemplateId } from "@/lib/report-templates";

const QUICK_START_PROMPTS_SEARCH = [
  "分析2025年人工智能芯片制造商的市场情况",
  "撰写关于最新气候变化政策及其影响的博客文章",
  "起草本季度可再生能源趋势投资者更新报告",
  "写一份关于云计算当前网络安全威胁的报告",
  "分析量子计算领域的最新发展，用于技术通讯",
  "总结癌症治疗领域的新兴医学突破",
  "撰写当前利率变化对房产市场的影响",
  "起草关于电池技术突破的文章",
  "分析半导体制造领域当前的供应链中断",
  "分析最近的人工智能法规如何影响商业创新",
];

const QUICK_START_PROMPTS = [
  "为一个勇敢的小机器人写一个睡前故事",
  "用TypeScript创建一个计算斐波那契数列的函数",
  "为一个我已经做了2年的职位草拟辞职信",
  "用React和Tailwind构建一个简单的天气仪表板",
  "写一首关于人工智能的诗",
  "创建一个基本的Express.js REST API，包含两个端点",
  "为我妹妹的毕业典礼起草祝贺词",
  "用Python构建一个命令行计算器",
  "写一份制作完美炒鸡蛋的说明",
  "用HTML canvas创建一个简单的蛇游戏",
  "用React为我创建一个TODO应用",
  "用简短的文章解释为什么天空是蓝色的",
  "帮我起草一封给我教授Craig的电子邮件",
  "用Python写一个网络爬虫程序",
];

function getRandomPrompts(prompts: string[], count: number = 4): string[] {
  return [...prompts].sort(() => Math.random() - 0.5).slice(0, count);
}

interface QuickStartButtonsProps {
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions,
    reportTemplate?: ReportTemplateId
  ) => void;
  composer: React.ReactNode;
  searchEnabled: boolean;
}

interface QuickStartPromptsProps {
  searchEnabled: boolean;
}

const QuickStartPrompts = ({ searchEnabled }: QuickStartPromptsProps) => {
  const threadRuntime = useThreadRuntime();

  const handleClick = (text: string) => {
    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text }],
    });
  };

  const selectedPrompts = useMemo(
    () =>
      getRandomPrompts(
        searchEnabled ? QUICK_START_PROMPTS_SEARCH : QUICK_START_PROMPTS
      ),
    [searchEnabled]
  );

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {selectedPrompts.map((prompt, index) => (
          <Button
            key={`quick-start-prompt-${index}`}
            onClick={() => handleClick(prompt)}
            variant="outline"
            className="min-h-[60px] w-full flex items-center justify-center p-6 whitespace-normal text-gray-500 hover:text-gray-700 transition-colors ease-in rounded-2xl"
          >
            <p className="text-center break-words text-sm font-normal">
              {prompt}
            </p>
          </Button>
        ))}
      </div>
    </div>
  );
};

const QuickStartButtons = (props: QuickStartButtonsProps) => {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handleLanguageSubmit = (language: ProgrammingLanguageOptions) => {
    props.handleQuickStart("code", language);
  };

  const handleReportTemplateSelect = (templateId: ReportTemplateId) => {
    props.handleQuickStart("code", "html", templateId);
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center w-full">
      <div className="flex flex-col gap-6">
        <p className="text-gray-600 text-sm">从空白画布开始</p>
        <div className="flex flex-row gap-2 items-center justify-center w-full flex-wrap">
          <Button
            variant="outline"
            className="text-gray-500 hover:text-gray-700 transition-colors ease-in rounded-2xl flex items-center justify-center gap-2 w-[180px] h-[64px]"
            onClick={() => props.handleQuickStart("text")}
          >
            新建文章
            <NotebookPen className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            className="text-blue-500 hover:text-blue-700 border-blue-200 hover:border-blue-400 transition-colors ease-in rounded-2xl flex items-center justify-center gap-2 w-[180px] h-[64px]"
            onClick={() => setReportDialogOpen(true)}
          >
            数字化报告
            <FileBarChart className="w-5 h-5" />
          </Button>
          <ProgrammingLanguagesDropdown handleSubmit={handleLanguageSubmit} />
        </div>
      </div>
      <div className="flex flex-col gap-6 mt-2 w-full">
        <p className="text-gray-600 text-sm">或输入您的想法</p>
        {props.composer}
        <QuickStartPrompts searchEnabled={props.searchEnabled} />
      </div>

      {/* 报告模板选择对话框 */}
      <ReportTemplateDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        onSelectTemplate={handleReportTemplateSelect}
      />
    </div>
  );
};

interface ThreadWelcomeProps {
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  composer: React.ReactNode;
  searchEnabled: boolean;
}

export const ThreadWelcome: FC<ThreadWelcomeProps> = (
  props: ThreadWelcomeProps
) => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex items-center justify-center mt-16 w-full">
        <div className="text-center max-w-3xl w-full">
          <Avatar className="mx-auto">
            <AvatarImage src="/lc_logo.jpg" alt="董智 Logo" />
            <AvatarFallback>董智</AvatarFallback>
          </Avatar>
          <TighterText className="mt-4 text-lg font-medium">
            今天想要创作什么呢？
          </TighterText>
          <div className="mt-8 w-full">
            <QuickStartButtons
              composer={props.composer}
              handleQuickStart={props.handleQuickStart}
              searchEnabled={props.searchEnabled}
            />
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};

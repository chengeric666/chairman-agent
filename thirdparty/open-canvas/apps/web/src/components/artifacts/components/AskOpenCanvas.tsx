import { Dispatch, FormEvent, forwardRef, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArtifactV3 } from "@opencanvas/shared/types";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import { isArtifactCodeContent } from "@opencanvas/shared/utils/artifacts";
import { useToast } from "@/hooks/use-toast";

interface AskOpenCanvasProps {
  isInputVisible: boolean;
  selectionBox: { top: number; left: number };
  setIsInputVisible: (visible: boolean) => void;
  handleSubmitMessage: (inputValue: string) => Promise<void>;
  handleSelectionBoxMouseDown: (e: React.MouseEvent) => void;
  artifact: ArtifactV3;
  selectionIndexes: { start: number; end: number } | undefined;
  handleCleanupState: () => void;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
}

export const AskOpenCanvas = forwardRef<HTMLDivElement, AskOpenCanvasProps>(
  (props, ref) => {
    const { toast } = useToast();

    const {
      isInputVisible,
      selectionBox,
      selectionIndexes,
      inputValue,
      setInputValue,
      setIsInputVisible,
      handleSubmitMessage,
      handleSelectionBoxMouseDown,
      handleCleanupState,
    } = props;

    const handleSubmit = async (
      e:
        | FormEvent<HTMLFormElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      e.preventDefault();

      const artifactContent = props.artifact
        ? getArtifactContent(props.artifact)
        : undefined;
      if (
        !selectionIndexes &&
        artifactContent &&
        isArtifactCodeContent(artifactContent)
      ) {
        toast({
          title: "⚠️ 选择错误",
          description:
            "无法获取所选文本的起始/结束位置。请重新尝试。",
          duration: 5000,
        });
        handleCleanupState();
        return;
      }

      if (selectionBox && props.artifact) {
        await handleSubmitMessage(inputValue);
      } else {
        toast({
          title: "⚠️ 选择错误",
          description: "无法获取选择框。请重新尝试。",
          duration: 5000,
        });
        handleCleanupState();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "absolute bg-white border border-gray-200 shadow-md p-2 flex gap-2",
          isInputVisible ? "rounded-3xl" : "rounded-md"
        )}
        style={{
          top: `${selectionBox.top + 65}px`,
          left: `${selectionBox.left}px`,
          width: isInputVisible ? "400px" : "250px",
          marginLeft: isInputVisible ? "0" : "150px",
        }}
        onMouseDown={handleSelectionBoxMouseDown}
      >
        {isInputVisible ? (
          <form
            onSubmit={handleSubmit}
            className="relative w-full overflow-hidden flex flex-row items-center gap-1"
          >
            <Input
              className="w-full transition-all duration-300 focus:ring-0 ease-in-out p-1 focus:outline-none border-0 focus-visible:ring-0"
              placeholder="请输入您的创意想法..."
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              title="在此输入您的想法，AI将帮您进行创意创作"
            />
            <Button
              onClick={(e) => handleSubmit(e)}
              type="submit"
              variant="ghost"
              size="icon"
              title="提交创意指令"
            >
              <CircleArrowUp
                className="cursor-pointer"
                fill="black"
                stroke="white"
                size={30}
              />
            </Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setIsInputVisible(true)}
            className="transition-all duration-300 ease-in-out w-full"
            title="点击此处与OpenCanvas互动，获得创意建议"
          >
            💡 与开智创作互动
          </Button>
        )}
      </div>
    );
  }
);

AskOpenCanvas.displayName = "AskOpenCanvas";

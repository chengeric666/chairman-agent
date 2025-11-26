"use client";

import { FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { REPORT_TEMPLATES, ReportTemplateId } from "@/lib/report-templates";
import {
  Globe,
  Clock,
  BookOpen,
  User,
  BarChart3,
  Sparkles,
  LucideIcon,
} from "lucide-react";

// 图标映射
const ICON_MAP: Record<string, LucideIcon> = {
  Globe,
  Clock,
  BookOpen,
  User,
  BarChart3,
  Sparkles,
};

// 颜色样式映射
const COLOR_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "hover:border-blue-400",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "hover:border-amber-400",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "hover:border-green-400",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "hover:border-purple-400",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "hover:border-rose-400",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "hover:border-violet-400",
  },
};

interface ReportTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: ReportTemplateId) => void;
}

export const ReportTemplateDialog: FC<ReportTemplateDialogProps> = ({
  open,
  onClose,
  onSelectTemplate,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">选择报告模板</DialogTitle>
          <DialogDescription>
            基于专业方法论，选择最适合您内容的报告类型
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {REPORT_TEMPLATES.map((template) => {
            const Icon = ICON_MAP[template.icon];
            const colorStyle = COLOR_STYLES[template.color] || COLOR_STYLES.blue;

            return (
              <Card
                key={template.id}
                className={`cursor-pointer border-2 border-transparent
                  ${colorStyle.border} hover:shadow-lg
                  transition-all duration-200 ease-in-out`}
                onClick={() => {
                  onSelectTemplate(template.id);
                  onClose();
                }}
              >
                <CardHeader className="p-5">
                  <div
                    className={`w-12 h-12 rounded-xl ${colorStyle.bg}
                      flex items-center justify-center mb-3`}
                  >
                    {Icon && <Icon className={`w-6 h-6 ${colorStyle.text}`} />}
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">
                    {template.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {template.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            <span className="font-medium">提示：</span>
            选择模板后，在聊天窗口输入您的内容，AI 将根据模板结构生成专业报告。
            如果预设模板不满足需求，可选择"AI 自定义"让 AI 智能设计。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTemplateDialog;

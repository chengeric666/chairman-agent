"use client"

import { Control, FieldErrors, UseFormRegister, useWatch } from "react-hook-form"
import { FileIcon, LinkIcon, FileTextIcon } from "lucide-react"
import { FormSection } from "@/components/ui/form-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Controller } from "react-hook-form"

interface CreateSourceFormData {
  type: 'link' | 'upload' | 'text'
  title?: string
  url?: string
  content?: string
  file?: FileList | File
  notebooks?: string[]
  transformations?: string[]
  embed: boolean
  async_processing: boolean
}

const SOURCE_TYPES = [
  {
    value: 'link' as const,
    label: '链接',
    icon: LinkIcon,
    description: '添加网页或URL',
  },
  {
    value: 'upload' as const,
    label: '上传',
    icon: FileIcon,
    description: '上传文档或文件',
  },
  {
    value: 'text' as const,
    label: '文本',
    icon: FileTextIcon,
    description: '直接添加文本内容',
  },
]

interface SourceTypeStepProps {
  control: Control<CreateSourceFormData>
  register: UseFormRegister<CreateSourceFormData>
  errors: FieldErrors<CreateSourceFormData>
}

export function SourceTypeStep({ control, register, errors }: SourceTypeStepProps) {
  // Watch the selected type to make title conditional
  const selectedType = useWatch({ control, name: 'type' })
  return (
    <div className="space-y-6">
      <FormSection
        title="来源类型"
        description="选择添加内容的方式"
      >
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Tabs 
              value={field.value || ''} 
              onValueChange={(value) => field.onChange(value as 'link' | 'upload' | 'text')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                {SOURCE_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <TabsTrigger key={type.value} value={type.value} className="gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              
              {SOURCE_TYPES.map((type) => (
                <TabsContent key={type.value} value={type.value} className="mt-4">
                  <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                  
                  {/* Type-specific fields */}
                  {type.value === 'link' && (
                    <div>
                      <Label htmlFor="url" className="mb-2 block">URL *</Label>
                      <Input
                        id="url"
                        {...register('url')}
                        placeholder="https://example.com/article"
                        type="url"
                      />
                      {errors.url && (
                        <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
                      )}
                    </div>
                  )}
                  
                  {type.value === 'upload' && (
                    <div>
                      <Label htmlFor="file" className="mb-2 block">文件 *</Label>
                      <Input
                        id="file"
                        type="file"
                        {...register('file')}
                        accept=".pdf,.doc,.docx,.pptx,.ppt,.xlsx,.xls,.txt,.md,.epub,.mp4,.avi,.mov,.wmv,.mp3,.wav,.m4a,.aac,.jpg,.jpeg,.png,.tiff,.zip,.tar,.gz,.html"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        支持：文档 (PDF, DOC, DOCX, PPT, XLS, EPUB, TXT, MD)，媒体 (MP4, MP3, WAV, M4A)，图片 (JPG, PNG)，压缩包 (ZIP)
                      </p>
                      {errors.file && (
                        <p className="text-sm text-destructive mt-1">{errors.file.message}</p>
                      )}
                    </div>
                  )}
                  
                  {type.value === 'text' && (
                    <div>
                      <Label htmlFor="content" className="mb-2 block">文本内容 *</Label>
                      <Textarea
                        id="content"
                        {...register('content')}
                        placeholder="在此粘贴或输入您的内容..."
                        rows={6}
                      />
                      {errors.content && (
                        <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        />
        {errors.type && (
          <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
        )}
      </FormSection>

      <FormSection
        title={selectedType === 'text' ? "标题 *" : "标题（可选）"}
        description={selectedType === 'text'
          ? "文本内容需要标题"
          : "如果留空，将从内容生成标题"
        }
      >
        <Input
          id="title"
          {...register('title')}
          placeholder="为您的来源命名一个描述性标题"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </FormSection>
    </div>
  )
}

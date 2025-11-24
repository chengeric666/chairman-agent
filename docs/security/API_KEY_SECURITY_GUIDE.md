# API密钥安全指南

**日期**: 2025-11-24
**优先级**: 🔴 **关键**
**适用范围**: 所有项目开发人员

---

## ⚠️ 安全事件记录

### 事件#1: OpenRouter API Key泄露 (2025-11-24)

**问题描述**:
OpenRouter API key (`sk-or-v1-***67a3`) 被意外提交到公共GitHub仓库中。

**发现时间**: 2025-11-24 20:15
**通知来源**: OpenRouter自动监测系统
**影响范围**:
- 泄露文件: `OPENCANVAS_OPTIMIZATION_SUMMARY.md`
- 泄露commit: `8df87da`
- 泄露位置: https://github.com/chengeric666/chairman-agent/blob/8df87dacb6094131101b84aff60d1a3c82b46abc/OPENCANVAS_OPTIMIZATION_SUMMARY.md

**处理措施**:
1. ✅ OpenRouter已自动禁用该API key
2. ✅ 从文档中删除完整API key，替换为占位符
3. ✅ 生成新的API key并更新`.env`文件
4. ⏳ 使用BFG Repo-Cleaner从git历史中清除敏感信息
5. ⏳ 强制推送清理后的历史到远程仓库

**经验教训**:
- 文档中示例代码不应包含真实的API key
- 需要建立自动扫描机制
- 开发者需要接受安全培训

---

## 🛡️ API密钥安全最佳实践

### 1. 存储规范

#### ✅ 正确的方式

**使用环境变量文件**:
```bash
# .env (永远不要提交到git)
OPENROUTER_API_KEY=your_actual_key_here
ANTHROPIC_API_KEY=your_actual_key_here
```

**在代码中引用**:
```typescript
const apiKey = process.env.OPENROUTER_API_KEY;
```

**确保`.env`在`.gitignore`中**:
```gitignore
# 环境变量文件
.env
.env.local
.env.*.local
*.env

# API密钥文件
**/keys/**
**/*.key
**/*.pem
```

#### ❌ 错误的方式

```typescript
// ❌ 永远不要这样做！
const apiKey = "sk-or-v1-ab4e443dedfec...";
```

```markdown
// ❌ 文档中不要包含真实密钥
OPENROUTER_API_KEY=sk-or-v1-ab4e443dedfec...
```

### 2. 文档规范

#### 文档中API密钥示例格式

```bash
# ✅ 使用占位符
API_KEY=sk-xxx-YOUR_KEY_HERE

# ✅ 使用通用示例
OPENROUTER_API_KEY=sk-or-v1-***YOUR_KEY***

# ✅ 明确说明
API_KEY=<your-api-key-from-provider-dashboard>
```

#### 添加安全警告

在所有包含API密钥配置的文档中添加：

```markdown
> ⚠️ **安全提示**: 请使用您自己的API key。切勿将API key提交到公共仓库。
```

### 3. Git提交前检查

#### 使用pre-commit hooks

创建 `.git/hooks/pre-commit`:
```bash
#!/bin/bash

# 检查是否包含潜在的API密钥
if git diff --cached | grep -E "(sk-[a-zA-Z0-9]{48}|sk-or-v1-[a-zA-Z0-9]{64})"; then
    echo "❌ 检测到潜在的API密钥！请移除后再提交。"
    exit 1
fi

echo "✅ 安全检查通过"
exit 0
```

#### 提交前自检清单

- [ ] 检查所有`.env`文件是否在`.gitignore`中
- [ ] 搜索代码中是否有硬编码的密钥：`git grep -E "sk-[a-zA-Z0-9]{20,}"`
- [ ] 检查文档中的示例是否使用占位符
- [ ] 确认没有包含实际的API响应或调试日志

### 4. 密钥轮换策略

#### 定期轮换

- **生产环境**: 每90天轮换一次
- **开发环境**: 每6个月或在泄露后立即轮换
- **测试环境**: 使用受限的测试密钥

#### 泄露后立即操作

1. **立即禁用**泄露的密钥
2. **生成新密钥**
3. **更新所有环境**的配置
4. **从git历史中清除**（见下文）
5. **通知团队成员**
6. **记录事件**

### 5. 访问控制

#### 团队权限管理

- 使用最小权限原则
- 不同环境使用不同的密钥
- 限制可以查看密钥的人员

#### 密钥管理工具

推荐使用：
- **1Password / Bitwarden**: 团队密码管理
- **AWS Secrets Manager**: 云端密钥管理
- **HashiCorp Vault**: 企业级密钥管理

---

## 🚨 密钥泄露应急响应

### 发现泄露时的操作步骤

#### 1. 立即禁用 (< 5分钟)

```bash
# 登录提供商dashboard立即禁用密钥
# OpenRouter: https://openrouter.ai/keys
# Anthropic: https://console.anthropic.com/settings/keys
```

#### 2. 生成新密钥 (< 10分钟)

```bash
# 生成新密钥
# 更新本地.env文件
# 更新生产环境配置
```

#### 3. 从git历史中清除 (< 30分钟)

**使用BFG Repo-Cleaner** (推荐):

```bash
# 1. 安装BFG
brew install bfg

# 2. 克隆镜像
git clone --mirror git@github.com:yourusername/repo.git

# 3. 创建替换文件
echo "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==>***REMOVED***" > replacements.txt

# 4. 清除敏感信息
cd repo.git
bfg --replace-text replacements.txt

# 5. 清理和推送
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**或使用git filter-repo**:

```bash
# 1. 安装
pip install git-filter-repo

# 2. 清除文件
git filter-repo --path OPENCANVAS_OPTIMIZATION_SUMMARY.md --invert-paths

# 3. 强制推送
git push origin --force --all
```

#### 4. 通知团队 (< 1小时)

通知内容模板：
```
【紧急安全通知】

发现时间: 2025-11-24 20:15
问题类型: API密钥泄露
影响范围: OpenRouter API key
处理状态: ✅ 已禁用 → ✅ 已轮换 → ⏳ 清理中

行动要求:
1. 立即pull最新代码
2. 更新本地.env文件（见团队密码管理器）
3. 不要使用旧密钥

详情见: docs/security/API_KEY_SECURITY_GUIDE.md
```

---

## 📋 检查清单

### 开发前

- [ ] 已阅读本安全指南
- [ ] 配置了`.gitignore`
- [ ] 设置了pre-commit hooks
- [ ] 了解密钥管理工具

### 提交前

- [ ] 运行 `git diff --cached` 检查暂存区
- [ ] 搜索敏感信息：`git grep -E "sk-|key.*="`
- [ ] 确认`.env`文件未被追踪
- [ ] 文档中使用占位符

### 代码审查时

- [ ] 检查是否有硬编码密钥
- [ ] 验证环境变量使用是否正确
- [ ] 确认文档示例安全
- [ ] 检查日志输出是否包含敏感信息

---

## 🔗 相关资源

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)

---

## 📞 联系方式

**安全问题报告**:
如发现任何安全问题，请立即联系项目维护者。

**紧急联系**: 项目负责人

---

**最后更新**: 2025-11-24
**文档版本**: 1.0
**下次审查**: 2026-02-24

# Dockerfile for OpenCanvas Agents Service
# 使用Open Notebook镜像作为基础（已包含Node.js 20）
FROM lfnovo/open_notebook:v1-latest-single

# 设置工作目录
WORKDIR /app

# 复制monorepo根目录的package文件
COPY package.json yarn.lock ./
COPY packages ./packages

# 复制agents应用
COPY apps/agents ./apps/agents

# 复制langgraph配置
COPY langgraph.json ./

# 安装依赖
RUN yarn install --frozen-lockfile

# 构建agents服务
WORKDIR /app/apps/agents
RUN yarn build

# 复制环境变量文件
COPY apps/agents/.env .env

# 暴露LangGraph端口
EXPOSE 54367

# 启动LangGraph dev服务器
CMD ["yarn", "langgraphjs", "dev", "--port", "54367", "--config", "../../langgraph.json", "--no-browser"]

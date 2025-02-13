import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Dify API 配置
const difyConfig = {
    apiKey: 'app-OozuuCSbv10oTCIpKwz8hi4G',
    apiEndpoint: 'https://api.dify.ai/v1',
};
// 创建 MCP 服务器
const server = new McpServer({
    name: "dify-langgpt-server",
    version: "1.0.0"
});
// 注册 Dify 对话工具
server.tool("generate-langgpt-prompt", "使用 Dify 生成 LangGPT 格式的 prompt 模板", {
    message: z.string().describe("需要转换成 LangGPT 格式的原始 prompt 描述"),
}, async ({ message }) => {
    try {
        const response = await fetch(`${difyConfig.apiEndpoint}/chat-messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${difyConfig.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: {},
                query: message,
                user: "user",
                stream: false,
                conversation_id: null,
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText} ${response.body}`);
        }
        const data = await response.json();
        return {
            content: [
                {
                    type: "text",
                    text: data.answer
                }
            ]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        return {
            content: [
                {
                    type: "text",
                    text: `调用 Dify API 时发生错误: ${errorMessage}`
                }
            ]
        };
    }
});
// 启动服务器
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("服务器已启动");
}
main().catch((error) => {
    console.error("服务器启动失败:", error);
    process.exit(1);
});

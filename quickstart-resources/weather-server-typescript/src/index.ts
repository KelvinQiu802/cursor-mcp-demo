import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 定义天气数据类型
type WeatherInfo = {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
};

// 模拟城市天气数据
const weatherData: Record<string, WeatherInfo> = {
    "北京": { temperature: 20, condition: "晴朗", humidity: 45, windSpeed: 8 },
    "上海": { temperature: 25, condition: "多云", humidity: 60, windSpeed: 12 },
    "广州": { temperature: 28, condition: "小雨", humidity: 75, windSpeed: 6 },
    "深圳": { temperature: 27, condition: "阴天", humidity: 70, windSpeed: 10 }
};

// 创建 MCP 服务器
const server = new McpServer({
    name: "weather-server",
    version: "1.0.0"
});

// 注册天气查询工具
server.tool(
    "get-weather",
    "获取指定城市的天气信息",
    {
        city: z.string().describe("城市名称（如：北京、上海、广州、深圳）")
    },
    async ({ city }) => {
        const weather = weatherData[city];
        if (!weather) {
            return {
                content: [
                    {
                        type: "text",
                        text: `未找到城市 ${city} 的天气信息。支持的城市包括：${Object.keys(weatherData).join("、")}`
                    }
                ]
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: `${city}的天气信息：
温度：${weather.temperature}°C
天气：${weather.condition}
湿度：${weather.humidity}%
风速：${weather.windSpeed}m/s`
                }
            ]
        };
    }
);

// 启动服务器
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("天气服务器已启动");
}

main().catch((error) => {
    console.error("服务器启动失败:", error);
    process.exit(1);
});

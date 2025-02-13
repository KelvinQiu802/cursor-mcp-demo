#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface Story {
  title: string;
  url?: string;
  points: number;
  author: string;
  time: string;
  commentCount: number;
  rank: number;
}

const isValidStoryType = (type: string): boolean => {
  return ['top', 'new', 'ask', 'show', 'jobs'].includes(type);
};

class HackerNewsServer {
  private server: Server;
  private baseUrl = 'https://news.ycombinator.com';

  constructor() {
    this.server = new Server(
      {
        name: 'hn-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private async fetchStories(type: string = 'top'): Promise<Story[]> {
    try {
      const url = type === 'top' ? this.baseUrl : `${this.baseUrl}/${type}`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const stories: Story[] = [];

      $('.athing').each((i, elem) => {
        const titleRow = $(elem);
        const metadataRow = titleRow.next();
        
        const rank = parseInt(titleRow.find('.rank').text(), 10);
        const titleElement = titleRow.find('.titleline > a').first();
        const title = titleElement.text();
        const url = titleElement.attr('href');
        const sitebit = titleRow.find('.sitebit');
        
        const points = parseInt(metadataRow.find('.score').text(), 10) || 0;
        const author = metadataRow.find('.hnuser').text();
        const time = metadataRow.find('.age').attr('title') || '';
        const commentText = metadataRow.find('a').last().text();
        const commentCount = parseInt(commentText.split('&nbsp;')[0]) || 0;

        stories.push({
          title,
          url: url?.startsWith('item?id=') ? `${this.baseUrl}/${url}` : url,
          points,
          author,
          time,
          commentCount,
          rank
        });
      });

      return stories;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to fetch stories: ${error.message}`
        );
      }
      throw error;
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_stories',
          description: 'Get stories from Hacker News',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: 'Type of stories to fetch (top, new, ask, show, jobs)',
                enum: ['top', 'new', 'ask', 'show', 'jobs'],
                default: 'top'
              },
              limit: {
                type: 'number',
                description: 'Number of stories to return (max 30)',
                minimum: 1,
                maximum: 30,
                default: 10
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'get_stories') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const args = request.params.arguments as { type?: string; limit?: number };
      const type = args.type || 'top';
      const limit = Math.min(args.limit || 10, 30);

      if (!isValidStoryType(type)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid story type: ${type}. Must be one of: top, new, ask, show, jobs`
        );
      }

      try {
        const stories = await this.fetchStories(type);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stories.slice(0, limit), null, 2)
            }
          ]
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to fetch stories: ${error}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Hacker News MCP server running on stdio');
  }
}

const server = new HackerNewsServer();
server.run().catch(console.error);

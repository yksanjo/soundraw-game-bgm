import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { generateBgmToolDefinition, handleGenerateBgm } from './tools/generate-bgm.js';
import { getVariationsToolDefinition, handleGetVariations } from './tools/get-variations.js';
import { adaptiveLayerToolDefinition, handleAdaptiveLayers } from './tools/adaptive-layers.js';
import { sceneTransitionToolDefinition, handleSceneTransition } from './tools/scene-transition.js';
import { logger } from './utils/logger.js';

const TOOLS = [
  generateBgmToolDefinition,
  getVariationsToolDefinition,
  adaptiveLayerToolDefinition,
  sceneTransitionToolDefinition,
];

export function createServer(): Server {
  const server = new Server(
    {
      name: 'soundraw-game-bgm',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list_tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Listing tools');
    return {
      tools: TOOLS,
    };
  });

  // Handle call_tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info(`Tool called: ${name}`, { args });

    try {
      let result: unknown;

      switch (name) {
        case 'generate_bgm':
          result = await handleGenerateBgm(args || {});
          break;

        case 'get_bgm_variations':
          result = await handleGetVariations(args || {});
          break;

        case 'adaptive_layer_control':
          result = await handleAdaptiveLayers(args || {});
          break;

        case 'scene_transition_music':
          result = await handleSceneTransition(args || {});
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Tool error: ${name}`, { error: errorMessage });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function runServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  logger.info('Starting Soundraw Game BGM MCP Server');

  await server.connect(transport);

  logger.info('Soundraw Game BGM MCP Server connected and ready');
}

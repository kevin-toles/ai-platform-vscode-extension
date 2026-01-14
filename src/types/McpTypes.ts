/**
 * Configuration for an MCP server connection
 */
export interface McpServerConfig {
    /** Display name for the server */
    name: string;
    /** Command to start the MCP server */
    command: string;
    /** Arguments for the command */
    args?: string[];
    /** Environment variables for the server process */
    env?: Record<string, string>;
    /** Whether to auto-connect on extension activation */
    autoConnect?: boolean;
}

/**
 * Represents an MCP tool definition
 */
export interface McpTool {
    /** Unique name of the tool */
    name: string;
    /** Human-readable description */
    description?: string;
    /** JSON Schema for the tool's input parameters */
    inputSchema?: McpToolInputSchema;
    /** The server this tool belongs to */
    serverName: string;
}

/**
 * JSON Schema for tool input parameters
 */
export interface McpToolInputSchema {
    type: string;
    properties?: Record<string, McpToolProperty>;
    required?: string[];
    additionalProperties?: boolean;
}

/**
 * A property in the tool input schema
 */
export interface McpToolProperty {
    type: string;
    description?: string;
    enum?: string[];
    default?: any;
    items?: McpToolProperty;
}

/**
 * Result of executing an MCP tool
 */
export interface McpToolResult {
    content: McpToolResultContent[];
    isError?: boolean;
}

/**
 * Content item in a tool result
 */
export interface McpToolResultContent {
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
}

/**
 * Connection status for an MCP server
 */
export enum ConnectionStatus {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Error = 'error'
}

/**
 * Represents the state of a connected MCP server
 */
export interface McpServerState {
    config: McpServerConfig;
    status: ConnectionStatus;
    tools: McpTool[];
    error?: string;
}

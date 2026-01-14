# MCP Container Tools

A VS Code extension that wraps MCP (Model Context Protocol) container tools to provide a graphical interface for managing Docker containers, images, networks, and volumes.

## Features

### Container Management
- 🟢 **View running and stopped containers** in a tree view
- ▶️ **Start/Stop/Restart** containers with one click
- 📋 **View container logs** directly in VS Code
- 🔍 **Inspect containers** to see detailed configuration
- 🗑️ **Remove containers** with confirmation

### Image Management
- 📦 **Browse all Docker images** with size and creation date
- ⬇️ **Pull new images** from registries
- 🏷️ **Tag images** with custom tags
- 🔍 **Inspect images** for detailed metadata
- 🗑️ **Remove unused images**

### Network Management
- 🌐 **View all Docker networks**
- See network driver, scope, and configuration

### Volume Management
- 💾 **View all Docker volumes**
- See mount points and labels

### Cleanup Tools
- 🧹 **Prune containers** - Remove stopped containers
- 🧹 **Prune images** - Remove unused images
- 🧹 **Prune volumes** - Remove unused volumes
- 🧹 **Prune networks** - Remove unused networks
- 🧹 **Prune all** - Clean up all unused resources

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "MCP Container Tools"
4. Click Install

Or install from VSIX:
```bash
code --install-extension mcp-container-tools-0.0.1.vsix
```

## Usage

### Activity Bar
After installation, you'll see a new **MCP Containers** icon in the Activity Bar (left sidebar). Click it to open the container explorer.

### Tree Views
The extension provides four tree views:
- **Containers** - Shows running and stopped containers
- **Images** - Shows all Docker images
- **Networks** - Shows Docker networks
- **Volumes** - Shows Docker volumes

### Commands
All commands are available via:
- **Context menu** - Right-click on items in the tree view
- **Command Palette** - Press `Ctrl+Shift+P` and type "MCP Containers"
- **Toolbar buttons** - Use icons in the tree view headers

### Quick Actions

#### Start a stopped container:
1. Expand "Stopped" in the Containers view
2. Right-click on the container
3. Click "Start Container" or use the play icon

#### View container logs:
1. Right-click on any container
2. Click "View Logs"
3. Logs open in a new editor tab

#### Pull a new image:
1. Click the download icon in the Images view header
2. Enter the image name (e.g., `nginx:latest`)
3. Wait for the pull to complete

## Configuration

Open VS Code settings and search for "MCP Container Tools":

| Setting | Default | Description |
|---------|---------|-------------|
| `mcpContainerTools.logLevel` | `info` | Log level (debug, info, warn, error) |
| `mcpContainerTools.autoRefresh` | `false` | Auto-refresh container lists |
| `mcpContainerTools.refreshInterval` | `30` | Refresh interval in seconds |

## Requirements

- VS Code 1.85.0 or later
- MCP container tools must be available (provided by Copilot MCP integration)
- Docker must be running on your system

## Your AI Platform Containers

This extension will automatically discover your AI Platform containers:

| Container | Description |
|-----------|-------------|
| `ai-platform-redis` | Redis cache for the platform |
| `ai-platform-qdrant` | Vector database for semantic search |
| `ai-platform-neo4j` | Graph database for relationships |
| `llm-gateway` | LLM Gateway microservice |
| `semantic-search` | Semantic search service |
| `ai-agents` | AI agents service |
| `code-orchestrator` | Code orchestration service |

## Development

### Building from Source

```bash
# Clone the repository
cd ai-platform-vscode-extension

# Install dependencies
npm install

# Compile
npm run compile

# Watch mode (for development)
npm run watch
```

### Running in Development

1. Open the project in VS Code
2. Press F5 to start debugging
3. A new VS Code window will open with the extension loaded

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Changelog

### 0.0.1
- Initial release
- Container management (start, stop, restart, remove, logs, inspect)
- Image management (pull, remove, tag, inspect)
- Network and volume browsing
- Prune commands for cleanup

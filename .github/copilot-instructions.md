# MCP Container Tools - Copilot Instructions

This is a VS Code extension that wraps MCP container management tools.

## Project Structure

- `src/extension.ts` - Main extension entry point, registers all commands
- `src/providers/` - Tree data providers for the sidebar views
  - `ContainersTreeProvider.ts` - Displays containers grouped by status
  - `ImagesTreeProvider.ts` - Displays Docker images
  - `NetworksTreeProvider.ts` - Displays Docker networks
  - `VolumesTreeProvider.ts` - Displays Docker volumes
- `src/types/` - TypeScript type definitions
- `src/utils/Logger.ts` - Logging utility

## MCP Tools Used

This extension wraps the following MCP tools:
- `mcp_copilot_conta_list_containers` - List all containers
- `mcp_copilot_conta_list_images` - List all images
- `mcp_copilot_conta_list_networks` - List all networks
- `mcp_copilot_conta_list_volumes` - List all volumes
- `mcp_copilot_conta_act_container` - Start/stop/restart/remove containers
- `mcp_copilot_conta_act_image` - Pull/remove images
- `mcp_copilot_conta_inspect_container` - Get container details
- `mcp_copilot_conta_inspect_image` - Get image details
- `mcp_copilot_conta_logs_for_container` - View container logs
- `mcp_copilot_conta_run_container` - Run a new container
- `mcp_copilot_conta_tag_image` - Tag an image
- `mcp_copilot_conta_prune` - Clean up unused resources

## Development Commands

```bash
npm install     # Install dependencies
npm run compile # Compile TypeScript
npm run watch   # Watch mode
```

## Testing

Press F5 in VS Code to launch the extension in debug mode.

## Key Patterns

- Tree providers implement `vscode.TreeDataProvider<T>`
- Commands are registered in `extension.ts` and defined in `package.json`
- MCP tools are called via `vscode.commands.executeCommand()`

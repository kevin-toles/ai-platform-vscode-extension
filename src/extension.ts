import * as vscode from 'vscode';
import { ContainersTreeProvider, ContainerTreeItem } from './providers/ContainersTreeProvider';
import { ImagesTreeProvider, ImageTreeItem } from './providers/ImagesTreeProvider';
import { NetworksTreeProvider } from './providers/NetworksTreeProvider';
import { VolumesTreeProvider } from './providers/VolumesTreeProvider';
import { Logger } from './utils/Logger';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function dockerCommand(command: string): Promise<string> {
    const { stdout } = await execAsync(`docker ${command}`);
    return stdout;
}

export async function activate(context: vscode.ExtensionContext) {
    // Show activation message immediately
    console.log('MCP Container Tools: Activating...');
    vscode.window.showInformationMessage('MCP Container Tools is activating!');
    
    Logger.initialize(context);
    Logger.info('MCP Container Tools extension is activating...');

    // Create tree data providers
    const containersProvider = new ContainersTreeProvider();
    const imagesProvider = new ImagesTreeProvider();
    const networksProvider = new NetworksTreeProvider();
    const volumesProvider = new VolumesTreeProvider();

    // Register tree views
    const containersTreeView = vscode.window.createTreeView('mcpContainers', {
        treeDataProvider: containersProvider,
        showCollapseAll: true
    });

    const imagesTreeView = vscode.window.createTreeView('mcpImages', {
        treeDataProvider: imagesProvider,
        showCollapseAll: true
    });

    const networksTreeView = vscode.window.createTreeView('mcpNetworks', {
        treeDataProvider: networksProvider,
        showCollapseAll: true
    });

    const volumesTreeView = vscode.window.createTreeView('mcpVolumes', {
        treeDataProvider: volumesProvider,
        showCollapseAll: true
    });

    // ============== CONTAINER COMMANDS ==============
    
    const refreshContainersCmd = vscode.commands.registerCommand('mcpContainerTools.refreshContainers', () => {
        containersProvider.refresh();
    });

    const startContainerCmd = vscode.commands.registerCommand('mcpContainerTools.startContainer', async (item?: ContainerTreeItem) => {
        const containerName = item?.container?.name || await promptForContainerName('start');
        if (containerName) {
            try {
                await dockerCommand(`start ${containerName}`);
                vscode.window.showInformationMessage(`Container "${containerName}" started`);
                containersProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to start container: ${error}`);
            }
        }
    });

    const stopContainerCmd = vscode.commands.registerCommand('mcpContainerTools.stopContainer', async (item?: ContainerTreeItem) => {
        const containerName = item?.container?.name || await promptForContainerName('stop');
        if (containerName) {
            try {
                await dockerCommand(`stop ${containerName}`);
                vscode.window.showInformationMessage(`Container "${containerName}" stopped`);
                containersProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to stop container: ${error}`);
            }
        }
    });

    const restartContainerCmd = vscode.commands.registerCommand('mcpContainerTools.restartContainer', async (item?: ContainerTreeItem) => {
        const containerName = item?.container?.name || await promptForContainerName('restart');
        if (containerName) {
            try {
                await dockerCommand(`restart ${containerName}`);
                vscode.window.showInformationMessage(`Container "${containerName}" restarted`);
                containersProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to restart container: ${error}`);
            }
        }
    });

    const removeContainerCmd = vscode.commands.registerCommand('mcpContainerTools.removeContainer', async (item?: ContainerTreeItem) => {
        const containerName = item?.container?.name || await promptForContainerName('remove');
        if (containerName) {
            const confirm = await vscode.window.showWarningMessage(
                `Are you sure you want to remove container "${containerName}"?`,
                { modal: true },
                'Remove'
            );
            if (confirm === 'Remove') {
                try {
                    await dockerCommand(`rm ${containerName}`);
                    vscode.window.showInformationMessage(`Container "${containerName}" removed`);
                    containersProvider.refresh();
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to remove container: ${error}`);
                }
            }
        }
    });

    const viewContainerLogsCmd = vscode.commands.registerCommand('mcpContainerTools.viewContainerLogs', async (item?: ContainerTreeItem) => {
        const containerName = item?.container?.name || await promptForContainerName('view logs for');
        if (containerName) {
            try {
                const logs = await dockerCommand(`logs --tail 500 ${containerName}`);
                const doc = await vscode.workspace.openTextDocument({
                    content: logs,
                    language: 'log'
                });
                await vscode.window.showTextDocument(doc);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get logs: ${error}`);
            }
        }
    });

    const inspectContainerCmd = vscode.commands.registerCommand('mcpContainerTools.inspectContainer', async (item?: ContainerTreeItem) => {
        const containerName = item?.container?.name || await promptForContainerName('inspect');
        if (containerName) {
            try {
                const result = await dockerCommand(`inspect ${containerName}`);
                const doc = await vscode.workspace.openTextDocument({
                    content: result,
                    language: 'json'
                });
                await vscode.window.showTextDocument(doc);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to inspect container: ${error}`);
            }
        }
    });

    // ============== IMAGE COMMANDS ==============

    const refreshImagesCmd = vscode.commands.registerCommand('mcpContainerTools.refreshImages', () => {
        imagesProvider.refresh();
    });

    const pullImageCmd = vscode.commands.registerCommand('mcpContainerTools.pullImage', async () => {
        const imageName = await vscode.window.showInputBox({
            prompt: 'Enter image name to pull',
            placeHolder: 'nginx:latest'
        });
        if (imageName) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Pulling image ${imageName}...`,
                cancellable: false
            }, async () => {
                await dockerCommand(`pull ${imageName}`);
            });
            vscode.window.showInformationMessage(`Image "${imageName}" pulled`);
            imagesProvider.refresh();
        }
    });

    const removeImageCmd = vscode.commands.registerCommand('mcpContainerTools.removeImage', async (item?: ImageTreeItem) => {
        const imageName = item?.image?.image.originalName || await vscode.window.showInputBox({
            prompt: 'Enter image name or ID to remove'
        });
        if (imageName) {
            const confirm = await vscode.window.showWarningMessage(
                `Are you sure you want to remove image "${imageName}"?`,
                { modal: true },
                'Remove'
            );
            if (confirm === 'Remove') {
                try {
                    await dockerCommand(`rmi ${imageName}`);
                    vscode.window.showInformationMessage(`Image "${imageName}" removed`);
                    imagesProvider.refresh();
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to remove image: ${error}`);
                }
            }
        }
    });

    const inspectImageCmd = vscode.commands.registerCommand('mcpContainerTools.inspectImage', async (item?: ImageTreeItem) => {
        const imageName = item?.image?.image.originalName || await vscode.window.showInputBox({
            prompt: 'Enter image name or ID to inspect'
        });
        if (imageName) {
            try {
                const result = await dockerCommand(`inspect ${imageName}`);
                const doc = await vscode.workspace.openTextDocument({
                    content: result,
                    language: 'json'
                });
                await vscode.window.showTextDocument(doc);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to inspect image: ${error}`);
            }
        }
    });

    const tagImageCmd = vscode.commands.registerCommand('mcpContainerTools.tagImage', async (item?: ImageTreeItem) => {
        const imageName = item?.image?.image.originalName || await vscode.window.showInputBox({
            prompt: 'Enter image name or ID to tag'
        });
        if (imageName) {
            const newTag = await vscode.window.showInputBox({
                prompt: 'Enter new tag',
                placeHolder: 'my-registry/my-image:v1.0'
            });
            if (newTag) {
                try {
                    await dockerCommand(`tag ${imageName} ${newTag}`);
                    vscode.window.showInformationMessage(`Image tagged as "${newTag}"`);
                    imagesProvider.refresh();
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to tag image: ${error}`);
                }
            }
        }
    });

    // ============== NETWORK COMMANDS ==============

    const refreshNetworksCmd = vscode.commands.registerCommand('mcpContainerTools.refreshNetworks', () => {
        networksProvider.refresh();
    });

    // ============== VOLUME COMMANDS ==============

    const refreshVolumesCmd = vscode.commands.registerCommand('mcpContainerTools.refreshVolumes', () => {
        volumesProvider.refresh();
    });

    // ============== PRUNE COMMANDS ==============

    const pruneContainersCmd = vscode.commands.registerCommand('mcpContainerTools.pruneContainers', async () => {
        const confirm = await vscode.window.showWarningMessage(
            'Remove all stopped containers?',
            { modal: true },
            'Prune'
        );
        if (confirm === 'Prune') {
            try {
                await dockerCommand('container prune -f');
                vscode.window.showInformationMessage('Stopped containers pruned');
                containersProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to prune containers: ${error}`);
            }
        }
    });

    const pruneImagesCmd = vscode.commands.registerCommand('mcpContainerTools.pruneImages', async () => {
        const confirm = await vscode.window.showWarningMessage(
            'Remove all unused images?',
            { modal: true },
            'Prune'
        );
        if (confirm === 'Prune') {
            try {
                await dockerCommand('image prune -f');
                vscode.window.showInformationMessage('Unused images pruned');
                imagesProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to prune images: ${error}`);
            }
        }
    });

    const pruneVolumesCmd = vscode.commands.registerCommand('mcpContainerTools.pruneVolumes', async () => {
        const confirm = await vscode.window.showWarningMessage(
            'Remove all unused volumes? This may result in data loss!',
            { modal: true },
            'Prune'
        );
        if (confirm === 'Prune') {
            try {
                await dockerCommand('volume prune -f');
                vscode.window.showInformationMessage('Unused volumes pruned');
                volumesProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to prune volumes: ${error}`);
            }
        }
    });

    const pruneNetworksCmd = vscode.commands.registerCommand('mcpContainerTools.pruneNetworks', async () => {
        const confirm = await vscode.window.showWarningMessage(
            'Remove all unused networks?',
            { modal: true },
            'Prune'
        );
        if (confirm === 'Prune') {
            try {
                await dockerCommand('network prune -f');
                vscode.window.showInformationMessage('Unused networks pruned');
                networksProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to prune networks: ${error}`);
            }
        }
    });

    const pruneAllCmd = vscode.commands.registerCommand('mcpContainerTools.pruneAll', async () => {
        const confirm = await vscode.window.showWarningMessage(
            'Remove all unused containers, images, networks, and volumes? This may result in data loss!',
            { modal: true },
            'Prune All'
        );
        if (confirm === 'Prune All') {
            try {
                await dockerCommand('system prune -f --volumes');
                vscode.window.showInformationMessage('All unused resources pruned');
                containersProvider.refresh();
                imagesProvider.refresh();
                networksProvider.refresh();
                volumesProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to prune: ${error}`);
            }
        }
    });

    // ============== RUN CONTAINER COMMAND ==============

    const runContainerCmd = vscode.commands.registerCommand('mcpContainerTools.runContainer', async () => {
        const image = await vscode.window.showInputBox({
            prompt: 'Enter image name',
            placeHolder: 'nginx:latest'
        });
        if (!image) { return; }

        const name = await vscode.window.showInputBox({
            prompt: 'Enter container name (optional)',
            placeHolder: 'my-container'
        });

        const publishAllPorts = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Publish all exposed ports?'
        });

        try {
            const nameArg = name ? `--name ${name}` : '';
            const portsArg = publishAllPorts === 'Yes' ? '-P' : '';
            await dockerCommand(`run -d ${nameArg} ${portsArg} ${image}`);
            vscode.window.showInformationMessage(`Container started from image "${image}"`);
            containersProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to run container: ${error}`);
        }
    });

    // ============== REFRESH ALL ==============

    const refreshAllCmd = vscode.commands.registerCommand('mcpContainerTools.refreshAll', () => {
        containersProvider.refresh();
        imagesProvider.refresh();
        networksProvider.refresh();
        volumesProvider.refresh();
    });

    // ============== SHOW OUTPUT ==============

    const showOutputCmd = vscode.commands.registerCommand('mcpContainerTools.showOutput', () => {
        Logger.show();
    });

    // Register all disposables
    context.subscriptions.push(
        containersTreeView,
        imagesTreeView,
        networksTreeView,
        volumesTreeView,
        refreshContainersCmd,
        startContainerCmd,
        stopContainerCmd,
        restartContainerCmd,
        removeContainerCmd,
        viewContainerLogsCmd,
        inspectContainerCmd,
        refreshImagesCmd,
        pullImageCmd,
        removeImageCmd,
        inspectImageCmd,
        tagImageCmd,
        refreshNetworksCmd,
        refreshVolumesCmd,
        pruneContainersCmd,
        pruneImagesCmd,
        pruneVolumesCmd,
        pruneNetworksCmd,
        pruneAllCmd,
        runContainerCmd,
        refreshAllCmd,
        showOutputCmd
    );

    Logger.info('MCP Container Tools extension activated successfully');
}

async function promptForContainerName(action: string): Promise<string | undefined> {
    return vscode.window.showInputBox({
        prompt: `Enter container name or ID to ${action}`,
        placeHolder: 'container-name'
    });
}

export function deactivate() {
    Logger.info('MCP Container Tools extension deactivated');
}

import * as vscode from 'vscode';
import { Container, TreeDataEventType } from '../types';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function listContainers(): Promise<Container[]> {
    try {
        const { stdout } = await execAsync('docker ps -a --format "{{json .}}"');
        const lines = stdout.trim().split('\n').filter(Boolean);
        return lines.map(line => {
            const data = JSON.parse(line);
            return {
                id: data.ID,
                name: data.Names,
                labels: {},
                image: {
                    originalName: data.Image,
                    image: data.Image.split(':')[0],
                    tag: data.Image.split(':')[1] || 'latest'
                },
                ports: [],
                networks: [data.Networks],
                createdAt: data.CreatedAt,
                state: data.State as Container['state'],
                status: data.Status
            };
        });
    } catch (error) {
        console.error('Failed to list containers:', error);
        return [];
    }
}

export class ContainerTreeItem extends vscode.TreeItem {
    constructor(
        public readonly container: Container,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(container.name, collapsibleState);
        
        this.tooltip = `${container.name}\n${container.image.originalName}\nStatus: ${container.status}`;
        this.description = container.status;
        
        // Set icon based on state
        if (container.state === 'running') {
            this.iconPath = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('charts.green'));
            this.contextValue = 'container-running';
        } else if (container.state === 'paused') {
            this.iconPath = new vscode.ThemeIcon('debug-pause', new vscode.ThemeColor('charts.yellow'));
            this.contextValue = 'container-paused';
        } else {
            // All other states (exited, created, dead, etc.) are considered "stopped" and can be started
            this.iconPath = new vscode.ThemeIcon('debug-stop', new vscode.ThemeColor('charts.red'));
            this.contextValue = 'container-stopped';
        }
    }
}

export class ContainerDetailItem extends vscode.TreeItem {
    constructor(label: string, value: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = value;
        this.iconPath = new vscode.ThemeIcon('symbol-property');
    }
}

export class ContainersTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataEventType> = new vscode.EventEmitter<TreeDataEventType>();
    readonly onDidChangeTreeData: vscode.Event<TreeDataEventType> = this._onDidChangeTreeData.event;

    private containers: Container[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    private getLabelText(element: vscode.TreeItem): string {
        const label = element.label;
        if (typeof label === 'string') {
            return label;
        }
        if (label && typeof label === 'object' && 'label' in label) {
            return label.label;
        }
        return '';
    }

    private createGroupHeaders(): vscode.TreeItem[] {
        const running = this.containers.filter(c => c.state === 'running');
        const stopped = this.containers.filter(c => c.state !== 'running');
        const items: vscode.TreeItem[] = [];
        
        if (running.length > 0) {
            const runningHeader = new vscode.TreeItem(`Running (${running.length})`, vscode.TreeItemCollapsibleState.Expanded);
            runningHeader.iconPath = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('charts.green'));
            runningHeader.contextValue = 'container-group-running';
            items.push(runningHeader);
        }

        if (stopped.length > 0) {
            const stoppedHeader = new vscode.TreeItem(`Stopped (${stopped.length})`, vscode.TreeItemCollapsibleState.Collapsed);
            stoppedHeader.iconPath = new vscode.ThemeIcon('debug-stop', new vscode.ThemeColor('charts.red'));
            stoppedHeader.contextValue = 'container-group-stopped';
            items.push(stoppedHeader);
        }

        return items;
    }

    private getContainerDetails(container: Container): vscode.TreeItem[] {
        const details: vscode.TreeItem[] = [
            new ContainerDetailItem('ID', container.id.substring(0, 12)),
            new ContainerDetailItem('Image', container.image.originalName),
            new ContainerDetailItem('Status', container.status),
            new ContainerDetailItem('Created', new Date(container.createdAt).toLocaleString()),
        ];

        if (container.networks.length > 0) {
            details.push(new ContainerDetailItem('Networks', container.networks.join(', ')));
        }

        if (container.ports.length > 0) {
            const portStr = container.ports
                .filter(p => p.hostPort)
                .map(p => `${p.hostPort}:${p.containerPort}`)
                .join(', ');
            if (portStr) {
                details.push(new ContainerDetailItem('Ports', portStr));
            }
        }

        return details;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            try {
                this.containers = await listContainers();
                
                if (this.containers.length === 0) {
                    return [new vscode.TreeItem('No containers found')];
                }

                return this.createGroupHeaders();
            } catch (error) {
                return [new vscode.TreeItem(`Error: ${error}`)];
            }
        }

        const labelText = this.getLabelText(element);
        
        if (labelText.startsWith('Running')) {
            return this.containers
                .filter(c => c.state === 'running')
                .map(c => new ContainerTreeItem(c, vscode.TreeItemCollapsibleState.Collapsed));
        }

        if (labelText.startsWith('Stopped')) {
            return this.containers
                .filter(c => c.state !== 'running')
                .map(c => new ContainerTreeItem(c, vscode.TreeItemCollapsibleState.Collapsed));
        }

        if (element instanceof ContainerTreeItem) {
            return this.getContainerDetails(element.container);
        }

        return [];
    }
}

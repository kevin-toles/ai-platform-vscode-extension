import * as vscode from 'vscode';
import { Network, TreeDataEventType } from '../types';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function listNetworks(): Promise<Network[]> {
    try {
        const { stdout } = await execAsync('docker network ls --format "{{json .}}"');
        const lines = stdout.trim().split('\n').filter(Boolean);
        return lines.map(line => {
            const data = JSON.parse(line);
            return {
                id: data.ID,
                name: data.Name,
                driver: data.Driver,
                labels: {},
                scope: data.Scope,
                ipv6: false,
                internal: false,
                createdAt: data.CreatedAt || new Date().toISOString()
            };
        });
    } catch (error) {
        console.error('Failed to list networks:', error);
        return [];
    }
}

export class NetworkTreeItem extends vscode.TreeItem {
    constructor(
        public readonly network: Network,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(network.name, collapsibleState);
        
        this.tooltip = `${network.name}\nDriver: ${network.driver}\nScope: ${network.scope}`;
        this.description = network.driver;
        this.iconPath = new vscode.ThemeIcon('globe');
        this.contextValue = 'network';
    }
}

export class NetworkDetailItem extends vscode.TreeItem {
    constructor(label: string, value: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = value;
        this.iconPath = new vscode.ThemeIcon('symbol-property');
    }
}

export class NetworksTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataEventType> = new vscode.EventEmitter<TreeDataEventType>();
    readonly onDidChangeTreeData: vscode.Event<TreeDataEventType> = this._onDidChangeTreeData.event;

    private networks: Network[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            // Root level - fetch and return networks
            try {
                this.networks = await listNetworks();
                
                if (this.networks.length === 0) {
                    return [new vscode.TreeItem('No networks found')];
                }

                // Sort by name
                this.networks.sort((a, b) => a.name.localeCompare(b.name));

                return this.networks.map(net => 
                    new NetworkTreeItem(net, vscode.TreeItemCollapsibleState.Collapsed)
                );
            } catch (error) {
                return [new vscode.TreeItem(`Error: ${error}`)];
            }
        }

        // Children of network items - show details
        if (element instanceof NetworkTreeItem) {
            const network = element.network;
            
            return [
                new NetworkDetailItem('ID', network.id.substring(0, 12)),
                new NetworkDetailItem('Driver', network.driver),
                new NetworkDetailItem('Scope', network.scope),
                new NetworkDetailItem('IPv6', network.ipv6 ? 'Enabled' : 'Disabled'),
                new NetworkDetailItem('Internal', network.internal ? 'Yes' : 'No'),
                new NetworkDetailItem('Created', new Date(network.createdAt).toLocaleString()),
            ];
        }

        return [];
    }
}

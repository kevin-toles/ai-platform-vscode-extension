import * as vscode from 'vscode';
import { Volume, TreeDataEventType } from '../types';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function listVolumes(): Promise<Volume[]> {
    try {
        const { stdout } = await execAsync('docker volume ls --format "{{json .}}"');
        const lines = stdout.trim().split('\n').filter(Boolean);
        return lines.map(line => {
            const data = JSON.parse(line);
            return {
                name: data.Name,
                driver: data.Driver,
                labels: {},
                mountpoint: data.Mountpoint || '',
                scope: data.Scope || 'local'
            };
        });
    } catch (error) {
        console.error('Failed to list volumes:', error);
        return [];
    }
}

export class VolumeTreeItem extends vscode.TreeItem {
    constructor(
        public readonly volume: Volume,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(volume.name, collapsibleState);
        
        this.tooltip = `${volume.name}\nDriver: ${volume.driver}\nMountpoint: ${volume.mountpoint}`;
        this.description = volume.driver;
        this.iconPath = new vscode.ThemeIcon('database');
        this.contextValue = 'volume';
    }
}

export class VolumeDetailItem extends vscode.TreeItem {
    constructor(label: string, value: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = value;
        this.iconPath = new vscode.ThemeIcon('symbol-property');
    }
}

export class VolumesTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataEventType> = new vscode.EventEmitter<TreeDataEventType>();
    readonly onDidChangeTreeData: vscode.Event<TreeDataEventType> = this._onDidChangeTreeData.event;

    private volumes: Volume[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            // Root level - fetch and return volumes
            try {
                this.volumes = await listVolumes();
                
                if (this.volumes.length === 0) {
                    return [new vscode.TreeItem('No volumes found')];
                }

                // Sort by name
                this.volumes.sort((a, b) => a.name.localeCompare(b.name));

                return this.volumes.map(vol => 
                    new VolumeTreeItem(vol, vscode.TreeItemCollapsibleState.Collapsed)
                );
            } catch (error) {
                return [new vscode.TreeItem(`Error: ${error}`)];
            }
        }

        // Children of volume items - show details
        if (element instanceof VolumeTreeItem) {
            const volume = element.volume;
            
            const details: vscode.TreeItem[] = [
                new VolumeDetailItem('Driver', volume.driver),
                new VolumeDetailItem('Scope', volume.scope),
                new VolumeDetailItem('Mountpoint', volume.mountpoint),
            ];

            // Add labels if present
            const labelKeys = Object.keys(volume.labels).filter(k => k && volume.labels[k]);
            if (labelKeys.length > 0) {
                for (const key of labelKeys.slice(0, 5)) { // Limit to 5 labels
                    details.push(new VolumeDetailItem(key, volume.labels[key]));
                }
            }

            return details;
        }

        return [];
    }
}

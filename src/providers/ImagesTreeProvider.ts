import * as vscode from 'vscode';
import { Image, TreeDataEventType } from '../types';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function listImages(): Promise<Image[]> {
    try {
        const { stdout } = await execAsync('docker images --format "{{json .}}"');
        const lines = stdout.trim().split('\n').filter(Boolean);
        return lines.map(line => {
            const data = JSON.parse(line);
            const sizeStr = data.Size || '0';
            let sizeBytes = 0;
            if (sizeStr.includes('GB')) {
                sizeBytes = Number.parseFloat(sizeStr) * 1024 * 1024 * 1024;
            } else if (sizeStr.includes('MB')) {
                sizeBytes = Number.parseFloat(sizeStr) * 1024 * 1024;
            } else if (sizeStr.includes('KB')) {
                sizeBytes = Number.parseFloat(sizeStr) * 1024;
            }
            return {
                id: data.ID,
                image: {
                    originalName: `${data.Repository}:${data.Tag}`,
                    image: data.Repository,
                    tag: data.Tag
                },
                createdAt: data.CreatedAt,
                size: sizeBytes
            };
        });
    } catch (error) {
        console.error('Failed to list images:', error);
        return [];
    }
}

export class ImageTreeItem extends vscode.TreeItem {
    constructor(
        public readonly image: Image,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(image.image.originalName, collapsibleState);
        
        const sizeInMB = (image.size / (1024 * 1024)).toFixed(1);
        this.tooltip = `${image.image.originalName}\nSize: ${sizeInMB} MB\nCreated: ${new Date(image.createdAt).toLocaleString()}`;
        this.description = `${sizeInMB} MB`;
        this.iconPath = new vscode.ThemeIcon('package');
        this.contextValue = 'image';
    }
}

export class ImageDetailItem extends vscode.TreeItem {
    constructor(label: string, value: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = value;
        this.iconPath = new vscode.ThemeIcon('symbol-property');
    }
}

export class ImagesTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataEventType> = new vscode.EventEmitter<TreeDataEventType>();
    readonly onDidChangeTreeData: vscode.Event<TreeDataEventType> = this._onDidChangeTreeData.event;

    private images: Image[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            // Root level - fetch and return images
            try {
                this.images = await listImages();
                
                if (this.images.length === 0) {
                    return [new vscode.TreeItem('No images found')];
                }

                // Sort by created date (newest first)
                this.images.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                return this.images.map(img => 
                    new ImageTreeItem(img, vscode.TreeItemCollapsibleState.Collapsed)
                );
            } catch (error) {
                return [new vscode.TreeItem(`Error: ${error}`)];
            }
        }

        // Children of image items - show details
        if (element instanceof ImageTreeItem) {
            const image = element.image;
            const sizeInMB = (image.size / (1024 * 1024)).toFixed(1);
            
            return [
                new ImageDetailItem('ID', image.id.substring(7, 19)),
                new ImageDetailItem('Repository', image.image.image),
                new ImageDetailItem('Tag', image.image.tag),
                new ImageDetailItem('Size', `${sizeInMB} MB`),
                new ImageDetailItem('Created', new Date(image.createdAt).toLocaleString()),
            ];
        }

        return [];
    }
}

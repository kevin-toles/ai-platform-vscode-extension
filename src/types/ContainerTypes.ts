/**
 * Types for Container MCP Tools
 */

import * as vscode from 'vscode';

// Type alias for TreeDataProvider event data (S4323: Replace union type with type alias)
export type TreeDataEventType = vscode.TreeItem | undefined | null | void;

export interface ContainerImage {
    originalName: string;
    image: string;
    tag: string;
}

export interface ContainerPort {
    hostIp?: string;
    hostPort?: number;
    containerPort: number;
    protocol: string;
}

export interface Container {
    id: string;
    name: string;
    labels: Record<string, string>;
    image: ContainerImage;
    ports: ContainerPort[];
    networks: string[];
    createdAt: string;
    state: 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead';
    status: string;
}

export interface Image {
    id: string;
    image: ContainerImage;
    createdAt: string;
    size: number;
}

export interface Network {
    id: string;
    name: string;
    driver: string;
    labels: Record<string, string>;
    scope: string;
    ipv6: boolean;
    internal: boolean;
    createdAt: string;
}

export interface Volume {
    name: string;
    driver: string;
    labels: Record<string, string>;
    mountpoint: string;
    scope: string;
}

export interface BindMount {
    type: 'bind';
    source: string;
    destination: string;
    readOnly?: boolean;
}

export interface VolumeMount {
    type: 'volume';
    source: string;
    destination: string;
    readOnly?: boolean;
}

export type Mount = BindMount | VolumeMount;

export interface PortBinding {
    containerPort: number;
    hostPort?: number;
    protocol?: 'tcp' | 'udp';
}

export interface RunContainerOptions {
    image: string;
    name?: string;
    ports?: PortBinding[];
    publishAllPorts?: boolean;
    environmentVariables?: Record<string, string>;
    mounts?: Mount[];
    network?: string;
    interactive?: boolean;
}

export type ContainerAction = 'start' | 'stop' | 'restart' | 'remove';
export type ImageAction = 'pull' | 'remove';
export type PruneTarget = 'containers' | 'images' | 'volumes' | 'networks' | 'all';

export interface ListContainersResult {
    containers: Container[];
}

export interface ListImagesResult {
    images: Image[];
}

export interface ListNetworksResult {
    networks: Network[];
}

export interface ListVolumesResult {
    volumes: Volume[];
}

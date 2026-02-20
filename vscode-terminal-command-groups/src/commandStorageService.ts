import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface CommandData {
    count: number;
    groupId: string | null;
    lastUsed?: string;
}

export interface GroupData {
    name: string;
    color: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CommandsData {
    commands: { [command: string]: CommandData };
    groups: { [groupId: string]: GroupData };
    workspacePath: string;
    lastUpdated: string;
}

export class CommandStorageService {
    private context: vscode.ExtensionContext;
    private currentWorkspacePath: string | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Obtener la ruta del workspace actual
     */
    getWorkspacePath(): string | null {
        // Primero verificar si hay una ruta personalizada guardada
        const customPath = this.getCustomWorkspacePath();
        if (customPath) {
            return customPath;
        }
        
        // Luego verificar workspace abierto
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return workspaceFolders[0].uri.fsPath;
        }
        
        // Si no hay workspace, usar el directorio home del usuario
        const os = require('os');
        return path.join(os.homedir(), '.vscode-terminal-command-groups');
    }

    /**
     * Establecer una ruta personalizada para guardar comandos
     */
    setCustomWorkspacePath(customPath: string) {
        this.currentWorkspacePath = customPath;
        this.context.globalState.update('terminalCommandGroups.customPath', customPath);
    }

    /**
     * Obtener ruta personalizada guardada
     */
    getCustomWorkspacePath(): string | null {
        return this.context.globalState.get<string>('terminalCommandGroups.customPath') || null;
    }

    /**
     * Obtener la ruta del archivo de almacenamiento
     */
    private getStorageFilePath(): string {
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            // Fallback: usar directorio home del usuario
            const os = require('os');
            const fallbackPath = path.join(os.homedir(), '.vscode-terminal-command-groups');
            if (!fs.existsSync(fallbackPath)) {
                fs.mkdirSync(fallbackPath, { recursive: true });
            }
            return path.join(fallbackPath, 'terminal-command-groups.json');
        }

        // Si es un workspace, guardar en .vscode dentro del workspace
        // Si es una ruta personalizada, guardar directamente ahí
        const customPath = this.getCustomWorkspacePath();
        let storageDir: string;
        
        if (customPath && customPath === workspacePath) {
            // Es una ruta personalizada, guardar directamente ahí
            storageDir = workspacePath;
        } else {
            // Es un workspace, guardar en .vscode
            storageDir = path.join(workspacePath, '.vscode');
        }
        
        // Crear directorio si no existe
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        return path.join(storageDir, 'terminal-command-groups.json');
    }

    /**
     * Cargar datos de comandos
     */
    async loadCommandsData(): Promise<CommandsData> {
        try {
            const filePath = this.getStorageFilePath();
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(data) as CommandsData;
                return parsed;
            }
        } catch (error) {
            console.error('Error loading commands data:', error);
        }

        // Retornar estructura vacía
        return {
            commands: {},
            groups: {},
            workspacePath: this.getWorkspacePath() || '',
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Guardar datos de comandos
     */
    async saveCommandsData(data: CommandsData): Promise<void> {
        try {
            const filePath = this.getStorageFilePath();
            data.lastUpdated = new Date().toISOString();
            const workspacePath = this.getWorkspacePath();
            data.workspacePath = workspacePath || '';
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving commands data:', error);
            throw error;
        }
    }

    /**
     * Guardar un comando ejecutado
     */
    async saveCommand(command: string): Promise<void> {
        if (!command || !command.trim()) {
            return;
        }

        const trimmedCommand = command.trim();
        const data = await this.loadCommandsData();

        if (!data.commands[trimmedCommand]) {
            data.commands[trimmedCommand] = {
                count: 0,
                groupId: null
            };
        }

        data.commands[trimmedCommand].count++;
        data.commands[trimmedCommand].lastUsed = new Date().toISOString();

        await this.saveCommandsData(data);
    }

    /**
     * Obtener comandos frecuentes
     */
    async getFrequentCommands(limit: number = 10, groupId: string | null = null): Promise<Array<{ command: string; count: number; groupId: string | null }>> {
        const data = await this.loadCommandsData();
        let commands = Object.entries(data.commands)
            .map(([command, cmdData]) => ({
                command,
                count: cmdData.count,
                groupId: cmdData.groupId
            }));

        // Filtrar por grupo si se especifica
        if (groupId) {
            commands = commands.filter(cmd => cmd.groupId === groupId);
        }

        // Ordenar por frecuencia
        commands.sort((a, b) => b.count - a.count);
        return commands.slice(0, limit);
    }

    /**
     * Obtener todos los grupos
     */
    async getGroups(): Promise<{ [groupId: string]: GroupData }> {
        const data = await this.loadCommandsData();
        return data.groups || {};
    }

    /**
     * Crear un nuevo grupo
     */
    async createGroup(name: string, color: string = '#3b82f6'): Promise<string> {
        const data = await this.loadCommandsData();
        const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        data.groups[groupId] = {
            name: name.trim(),
            color,
            createdAt: new Date().toISOString()
        };

        await this.saveCommandsData(data);
        return groupId;
    }

    /**
     * Actualizar un grupo
     */
    async updateGroup(groupId: string, updates: Partial<GroupData>): Promise<boolean> {
        const data = await this.loadCommandsData();
        
        if (!data.groups[groupId]) {
            return false;
        }

        data.groups[groupId] = {
            ...data.groups[groupId],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await this.saveCommandsData(data);
        return true;
    }

    /**
     * Eliminar un grupo
     */
    async deleteGroup(groupId: string): Promise<boolean> {
        const data = await this.loadCommandsData();
        
        if (!data.groups[groupId]) {
            return false;
        }

        // Desasignar comandos del grupo
        Object.keys(data.commands).forEach(command => {
            if (data.commands[command].groupId === groupId) {
                data.commands[command].groupId = null;
            }
        });

        delete data.groups[groupId];
        await this.saveCommandsData(data);
        return true;
    }

    /**
     * Asignar comando a grupo
     */
    async assignCommandToGroup(command: string, groupId: string): Promise<boolean> {
        const data = await this.loadCommandsData();
        const trimmedCommand = command.trim();

        if (!data.commands[trimmedCommand]) {
            return false;
        }

        data.commands[trimmedCommand].groupId = groupId;
        await this.saveCommandsData(data);
        return true;
    }

    /**
     * Remover comando de grupo
     */
    async removeCommandFromGroup(command: string): Promise<boolean> {
        const data = await this.loadCommandsData();
        const trimmedCommand = command.trim();

        if (!data.commands[trimmedCommand]) {
            return false;
        }

        data.commands[trimmedCommand].groupId = null;
        await this.saveCommandsData(data);
        return true;
    }

    /**
     * Eliminar un comando
     */
    async deleteCommand(command: string): Promise<boolean> {
        const data = await this.loadCommandsData();
        const trimmedCommand = command.trim();

        if (data.commands[trimmedCommand]) {
            delete data.commands[trimmedCommand];
            await this.saveCommandsData(data);
            return true;
        }

        return false;
    }

    /**
     * Obtener estadísticas de comandos
     */
    async getStats(): Promise<{
        totalCommands: number;
        uniqueCommands: number;
        mostUsed: { command: string; count: number } | null;
        groupsCount: number;
        commandsByGroup: { [groupId: string]: number };
    }> {
        const data = await this.loadCommandsData();
        const commands = Object.entries(data.commands);
        const totalCommands = commands.reduce((sum, [, cmdData]) => sum + cmdData.count, 0);
        const uniqueCommands = commands.length;
        
        const mostUsed = commands.length > 0
            ? commands.sort((a, b) => b[1].count - a[1].count)[0]
            : null;

        const groupsCount = Object.keys(data.groups || {}).length;

        const commandsByGroup: { [groupId: string]: number } = {};
        commands.forEach(([, cmdData]) => {
            if (cmdData.groupId) {
                commandsByGroup[cmdData.groupId] = (commandsByGroup[cmdData.groupId] || 0) + 1;
            }
        });

        return {
            totalCommands,
            uniqueCommands,
            mostUsed: mostUsed ? { command: mostUsed[0], count: mostUsed[1].count } : null,
            groupsCount,
            commandsByGroup
        };
    }

    /**
     * Exportar datos a JSON
     */
    async exportData(): Promise<string> {
        const data = await this.loadCommandsData();
        return JSON.stringify(data, null, 2);
    }

    /**
     * Importar datos desde JSON
     */
    async importData(jsonData: string): Promise<boolean> {
        try {
            const imported = JSON.parse(jsonData) as CommandsData;
            const current = await this.loadCommandsData();
            
            // Fusionar datos
            Object.assign(current.commands, imported.commands || {});
            Object.assign(current.groups, imported.groups || {});
            
            await this.saveCommandsData(current);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}


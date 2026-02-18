const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

class CloudflareTunnel {
  constructor() {
    this.processes = new Map(); // sessionId -> process
    this.urls = new Map(); // sessionId -> url
  }

  // Verificar si cloudflared está disponible
  async ensureCloudflared() {
    // Intentar usar cloudflared del sistema si está instalado
    try {
      const { execSync } = require('child_process');
      execSync('cloudflared --version', { stdio: 'ignore', timeout: 3000 });
      return 'cloudflared'; // Usar el del sistema
    } catch (err) {
      // No está instalado, retornar null para usar localtunnel
      return null;
    }
  }

  // Crear tunnel con cloudflared
  async createTunnel(sessionId, localPort) {
    try {
      const cloudflaredPath = await this.ensureCloudflared();
      
      if (!cloudflaredPath) {
        throw new Error('cloudflared no disponible');
      }

      return new Promise((resolve, reject) => {
        // Ejecutar cloudflared tunnel
        const args = ['tunnel', '--url', `http://localhost:${localPort}`];
        
        const process = spawn(cloudflaredPath, args, {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        process.stdout.on('data', (data) => {
          output += data.toString();
          // Buscar la URL en el output
          const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
          if (urlMatch) {
            const publicUrl = `${urlMatch[0]}/acceso/${sessionId}`;
            this.urls.set(sessionId, publicUrl);
            this.processes.set(sessionId, process);
            resolve(publicUrl);
          }
        });

        process.stderr.on('data', (data) => {
          errorOutput += data.toString();
          const urlMatch = errorOutput.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
          if (urlMatch) {
            const publicUrl = `${urlMatch[0]}/acceso/${sessionId}`;
            this.urls.set(sessionId, publicUrl);
            this.processes.set(sessionId, process);
            resolve(publicUrl);
          }
        });

        process.on('error', (err) => {
          reject(err);
        });

        // Timeout después de 10 segundos
        setTimeout(() => {
          if (!this.urls.has(sessionId)) {
            process.kill();
            reject(new Error('Timeout esperando URL de cloudflared'));
          }
        }, 10000);
      });
    } catch (error) {
      throw error;
    }
  }

  // Cerrar tunnel
  closeTunnel(sessionId) {
    const process = this.processes.get(sessionId);
    if (process) {
      process.kill();
      this.processes.delete(sessionId);
      this.urls.delete(sessionId);
    }
  }
}

module.exports = new CloudflareTunnel();


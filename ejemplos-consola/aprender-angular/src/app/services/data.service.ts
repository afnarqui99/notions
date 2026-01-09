import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private usuarios = [
    { id: 1, nombre: 'Juan' },
    { id: 2, nombre: 'Ana' },
    { id: 3, nombre: 'Carlos' }
  ];

  obtenerUsuarios() {
    return this.usuarios;
  }

  agregarUsuario(usuario: any) {
    this.usuarios.push(usuario);
  }

  obtenerMensaje() {
    return 'Este mensaje viene del servicio DataService';
  }
}


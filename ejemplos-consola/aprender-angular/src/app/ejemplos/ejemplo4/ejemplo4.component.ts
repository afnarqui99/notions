import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-ejemplo4',
  templateUrl: './ejemplo4.component.html',
  styleUrls: ['./ejemplo4.component.css']
})
export class Ejemplo4Component implements OnInit {
  usuarios: any[] = [];
  mensaje = '';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuarios = this.dataService.obtenerUsuarios();
    this.mensaje = this.dataService.obtenerMensaje();
  }

  agregarUsuario() {
    const nombre = prompt('Ingresa el nombre del usuario:');
    if (nombre) {
      this.dataService.agregarUsuario({ nombre, id: Date.now() });
      this.cargarUsuarios();
    }
  }
}


import { Component } from '@angular/core';

@Component({
  selector: 'app-ejemplo2',
  templateUrl: './ejemplo2.component.html',
  styleUrls: ['./ejemplo2.component.css']
})
export class Ejemplo2Component {
  // Property Binding
  imagenUrl = 'https://via.placeholder.com/300x200';
  estaDeshabilitado = false;

  // Two-way Binding
  nombre = '';
  email = '';
  mensaje = '';

  // String Interpolation con expresiones
  precio = 99.99;
  cantidad = 2;

  get total() {
    return this.precio * this.cantidad;
  }

  cambiarEstado() {
    this.estaDeshabilitado = !this.estaDeshabilitado;
  }

  mostrarDatos() {
    alert(`Nombre: ${this.nombre}\nEmail: ${this.email}\nMensaje: ${this.mensaje}`);
  }
}



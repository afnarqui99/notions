import { Component } from '@angular/core';

@Component({
  selector: 'app-ejemplo3',
  templateUrl: './ejemplo3.component.html',
  styleUrls: ['./ejemplo3.component.css']
})
export class Ejemplo3Component {
  // *ngIf
  mostrarMensaje = true;
  
  // *ngFor
  items = ['Manzana', 'Banana', 'Naranja', 'Uva'];
  personas = [
    { nombre: 'Juan', edad: 30, ciudad: 'Madrid' },
    { nombre: 'Ana', edad: 25, ciudad: 'Barcelona' },
    { nombre: 'Carlos', edad: 35, ciudad: 'Valencia' }
  ];

  // [ngClass] y [ngStyle]
  esActivo = false;
  colorFondo = '#ffffff';

  // *ngSwitch
  diaSemana = 'lunes';

  agregarItem() {
    const nuevoItem = prompt('Ingresa un nuevo item:');
    if (nuevoItem) {
      this.items.push(nuevoItem);
    }
  }

  eliminarItem(index: number) {
    this.items.splice(index, 1);
  }

  cambiarDia(dia: string) {
    this.diaSemana = dia;
  }
}



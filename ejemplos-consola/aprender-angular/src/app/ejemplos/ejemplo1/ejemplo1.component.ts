import { Component } from '@angular/core';

@Component({
  selector: 'app-ejemplo1',
  templateUrl: './ejemplo1.component.html',
  styleUrls: ['./ejemplo1.component.css']
})
export class Ejemplo1Component {
  mensaje = '¡Hola desde Angular!';
  contador = 0;

  incrementar() {
    this.contador++;
  }

  decrementar() {
    this.contador--;
  }
}


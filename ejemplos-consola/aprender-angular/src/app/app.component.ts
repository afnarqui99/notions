import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Aprender Angular - Ejemplos Educativos';
  ejemploActivo = 1;

  cambiarEjemplo(numero: number) {
    this.ejemploActivo = numero;
  }
}



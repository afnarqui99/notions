import { Component } from '@angular/core';

@Component({
  selector: 'app-ejemplo5',
  templateUrl: './ejemplo5.component.html',
  styleUrls: ['./ejemplo5.component.css']
})
export class Ejemplo5Component {
  formulario = {
    nombre: '',
    email: '',
    edad: '',
    genero: '',
    aceptaTerminos: false
  };

  enviado = false;
  datosEnviados: any = null;

  onSubmit() {
    if (this.formulario.aceptaTerminos) {
      this.enviado = true;
      this.datosEnviados = { ...this.formulario };
      console.log('Formulario enviado:', this.datosEnviados);
    } else {
      alert('Debes aceptar los términos y condiciones');
    }
  }

  resetear() {
    this.formulario = {
      nombre: '',
      email: '',
      edad: '',
      genero: '',
      aceptaTerminos: false
    };
    this.enviado = false;
    this.datosEnviados = null;
  }
}



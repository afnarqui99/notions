/**
 * Servicio para calcular días festivos de Colombia
 * Incluye días fijos y variables (relacionados con Semana Santa)
 */

class ColombianHolidays {
  // Días festivos fijos
  getFixedHolidays(year) {
    return [
      { date: `${year}-01-01`, name: 'Año Nuevo', type: 'fixed' },
      { date: `${year}-01-06`, name: 'Día de los Reyes Magos', type: 'fixed' },
      { date: `${year}-03-20`, name: 'Día de San José', type: 'fixed' },
      { date: `${year}-05-01`, name: 'Día del Trabajo', type: 'fixed' },
      { date: `${year}-06-29`, name: 'San Pedro y San Pablo', type: 'fixed' },
      { date: `${year}-07-20`, name: 'Día de la Independencia', type: 'fixed' },
      { date: `${year}-08-07`, name: 'Batalla de Boyacá', type: 'fixed' },
      { date: `${year}-08-15`, name: 'La Asunción', type: 'fixed' },
      { date: `${year}-10-12`, name: 'Día de la Raza', type: 'fixed' },
      { date: `${year}-11-01`, name: 'Todos los Santos', type: 'fixed' },
      { date: `${year}-11-11`, name: 'Independencia de Cartagena', type: 'fixed' },
      { date: `${year}-12-08`, name: 'Inmaculada Concepción', type: 'fixed' },
      { date: `${year}-12-25`, name: 'Navidad', type: 'fixed' },
    ];
  }

  // Calcular fecha de Pascua (Domingo de Resurrección) usando el algoritmo de Meeus/Jones/Butcher
  calculateEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month - 1, day);
  }

  // Calcular días festivos variables basados en Semana Santa
  getVariableHolidays(year) {
    const easter = this.calculateEaster(year);
    const holidays = [];

    // Domingo de Ramos (7 días antes de Pascua)
    const palmSunday = new Date(easter);
    palmSunday.setDate(easter.getDate() - 7);
    holidays.push({
      date: this.formatDate(palmSunday),
      name: 'Domingo de Ramos',
      type: 'variable'
    });

    // Jueves Santo (3 días antes de Pascua)
    const maundyThursday = new Date(easter);
    maundyThursday.setDate(easter.getDate() - 3);
    holidays.push({
      date: this.formatDate(maundyThursday),
      name: 'Jueves Santo',
      type: 'variable'
    });

    // Viernes Santo (2 días antes de Pascua)
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays.push({
      date: this.formatDate(goodFriday),
      name: 'Viernes Santo',
      type: 'variable'
    });

    // Lunes de Pascua (día siguiente al Domingo de Resurrección)
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays.push({
      date: this.formatDate(easterMonday),
      name: 'Lunes de Pascua',
      type: 'variable'
    });

    // Día de la Ascensión (39 días después de Pascua)
    const ascension = new Date(easter);
    ascension.setDate(easter.getDate() + 39);
    holidays.push({
      date: this.formatDate(ascension),
      name: 'Día de la Ascensión',
      type: 'variable'
    });

    // Corpus Christi (60 días después de Pascua)
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);
    holidays.push({
      date: this.formatDate(corpusChristi),
      name: 'Corpus Christi',
      type: 'variable'
    });

    // Sagrado Corazón (68 días después de Pascua)
    const sacredHeart = new Date(easter);
    sacredHeart.setDate(easter.getDate() + 68);
    holidays.push({
      date: this.formatDate(sacredHeart),
      name: 'Sagrado Corazón',
      type: 'variable'
    });

    return holidays;
  }

  // Formatear fecha a YYYY-MM-DD
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Obtener todos los días festivos de un año
  getAllHolidays(year) {
    const fixed = this.getFixedHolidays(year);
    const variable = this.getVariableHolidays(year);
    return [...fixed, ...variable].sort((a, b) => a.date.localeCompare(b.date));
  }

  // Obtener días festivos de un rango de fechas
  getHolidaysInRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    const holidays = [];
    
    for (let year = startYear; year <= endYear; year++) {
      const yearHolidays = this.getAllHolidays(year);
      holidays.push(...yearHolidays);
    }
    
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= start && holidayDate <= end;
    });
  }

  // Verificar si una fecha es festivo
  isHoliday(date) {
    const dateStr = typeof date === 'string' ? date : this.formatDate(new Date(date));
    const year = new Date(dateStr).getFullYear();
    const holidays = this.getAllHolidays(year);
    return holidays.find(h => h.date === dateStr);
  }
}

// Exportar instancia singleton
export default new ColombianHolidays();



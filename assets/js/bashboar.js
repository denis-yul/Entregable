// asistencia.js — Muestra en la tabla quién llegó hoy y a qué hora
(function () {

  // Misma clave que usa bashboard.js para guardar la asistencia
  const CLAVE_ASISTENCIA = 'asistencia';

  const cuerpo = document.querySelector('.cuerpo-tabla');
  if (!cuerpo) return; // esta página no tiene la tabla

  function leer(clave) {
    try {
      return JSON.parse(localStorage.getItem(clave)) || [];
    } catch (error) {
      return [];
    }
  }

  // Fecha de hoy como 2026-10-15 (hora local)
  function fechaHoy() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // Convierte la fecha guardada en hora como 08:05 (vacío si no hay)
  function formatoHora(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
  }

  // Crea una fila nueva con las mismas clases que las del HTML
  function crearFila() {
    const fila = document.createElement('tr');
    fila.className = 'fila-registro';
    ['celda-colaborador', 'celda-entrada', 'celda-salida'].forEach((clase) => {
      const celda = document.createElement('td');
      celda.className = clase;
      fila.appendChild(celda);
    });
    cuerpo.appendChild(fila);
    return fila;
  }

  const hoy = fechaHoy();
  const registros = leer(CLAVE_ASISTENCIA).filter((r) => r.fecha === hoy);
  const filas = Array.from(cuerpo.querySelectorAll('.fila-registro'));

  // Llena las filas vacías con los registros de hoy (agrega filas si hacen falta)
  registros.forEach((registro, i) => {
    const fila = filas[i] || crearFila();
    fila.querySelector('.celda-colaborador').textContent = registro.nombre;
    fila.querySelector('.celda-entrada').textContent = formatoHora(registro.entrada);
    fila.querySelector('.celda-salida').textContent = formatoHora(registro.salida);
  });

})();
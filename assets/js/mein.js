/* =========================================================
   CONTROL DE ASISTENCIA - Navegación entre pantallas
   Cada pantalla es un <section> con su id (sesion, panel,
   rostro, registro) y se muestra según el # de la dirección.
   ========================================================= */
(function () {
  "use strict";

  // ---------- Elementos que usa el script ----------
  var pantallas = document.querySelectorAll("section[id]");
  var formulario = document.querySelector(".formulario-sesion");
  var botonEsquina = document.querySelector(".boton-esquina");
  var circulo = document.querySelector(".circulo-camara");
  var textoInstruccion = document.querySelector(".texto-instruccion");

  // ---------- Estado ----------
  var sesionIniciada = false;
  var temporizador = null;
  var textoOriginal = textoInstruccion.textContent;

  // Devuelve el id de la pantalla pedida en la dirección (#...)
  function leerDestino() {
    var id = window.location.hash.slice(1);
    var existe = Array.prototype.some.call(pantallas, function (p) {
      return p.id === id;
    });
    return existe ? id : "sesion";
  }

  // Muestra una sola pantalla y oculta las demás
  function mostrar(id) {
    // Sin iniciar sesión solo se puede ver el login
    if (!sesionIniciada && id !== "sesion") {
      id = "sesion";
      window.history.replaceState(null, "", "#sesion");
    }

    pantallas.forEach(function (pantalla) {
      pantalla.hidden = pantalla.id !== id;
    });

    cancelarEscaneo();
    window.scrollTo(0, 0);
  }

  // Cambia de pantalla (el evento hashchange llama a mostrar)
  function irA(id) {
    if (window.location.hash === "#" + id) {
      mostrar(id);
    } else {
      window.location.hash = id;
    }
  }

  // ---------- Pantalla 1: inicio de sesión ----------
  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();          // el navegador ya validó correo y contraseña
    sesionIniciada = true;
    irA("panel");
  });

  // ---------- Pantalla 2: botón de la esquina (cerrar sesión) ----------
  botonEsquina.addEventListener("click", function () {
    sesionIniciada = false;
    formulario.reset();
    irA("sesion");
  });

  // ---------- Pantalla 3: simulación del escaneo facial ----------
  function escanear() {
    if (temporizador) {
      return;                          // ya está escaneando
    }
    circulo.classList.add("escaneando");
    textoInstruccion.textContent = "ANALIZANDO TU ROSTRO…";

    temporizador = window.setTimeout(function () {
      temporizador = null;
      irA("panel");
    }, 2200);
  }

  function cancelarEscaneo() {
    window.clearTimeout(temporizador);
    temporizador = null;
    circulo.classList.remove("escaneando");
    textoInstruccion.textContent = textoOriginal;
  }

  circulo.addEventListener("click", escanear);

  circulo.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      escanear();
    }
  });

  // ---------- Teclado: Escape vuelve al panel ----------
  document.addEventListener("keydown", function (evento) {
    var actual = leerDestino();
    if (evento.key === "Escape" && sesionIniciada && (actual === "rostro" || actual === "registro")) {
      irA("panel");
    }
  });

  // ---------- Cambios de dirección (enlaces y botón Atrás) ----------
  window.addEventListener("hashchange", function () {
    mostrar(leerDestino());
  });

  // ---------- Arranque ----------
  mostrar(leerDestino());
})();

// Botón de la esquina: cerrar sesión y volver al login
document.querySelector('.boton-esquina')?.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Cámara: se abre al tocar el círculo
const circulo = document.querySelector('.circulo-camara');
const video = document.querySelector('.video-camara');
const lienzo = document.querySelector('.lienzo-captura');
const icono = document.querySelector('.icono-rostro');

async function iniciarCamara() {
  try {
    const flujo = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });
    video.srcObject = flujo;
    video.hidden = false;
    if (icono) icono.hidden = true;
  } catch (error) {
    alert('No se pudo abrir la cámara. Revisa los permisos del navegador.');
  }
}

// bashboard.js — Cámara y captura del rostro (pantalla de escaneo)
// Todo va dentro de una función para no chocar con nombres de otros scripts (ej. mein.js)
(function () {

  // Elementos de la pantalla
  const circulo = document.querySelector('.circulo-camara');
  const video = document.querySelector('.video-camara');
  const lienzo = document.querySelector('.lienzo-captura');
  const icono = document.querySelector('.icono-rostro');
  const instruccion = document.querySelector('.texto-instruccion');

  // Avisa en la consola (F12) si falta algo en el HTML
  const faltan = [];
  if (!circulo) faltan.push('.circulo-camara');
  if (!video) faltan.push('<video class="video-camara">');
  if (!lienzo) faltan.push('<canvas class="lienzo-captura">');
  if (faltan.length) {
    console.warn('bashboard.js: faltan elementos en el HTML -> ' + faltan.join(', '));
    return;
  }
  console.log('bashboard.js listo: toca el círculo para abrir la cámara');

  // Texto original de la instrucción (para restaurarlo al reintentar)
  const textoInicial = instruccion ? instruccion.textContent : '';

  // Flujo de la cámara (null = cámara apagada)
  let flujo = null;

  // Abre la cámara frontal y muestra el video dentro del círculo
  async function abrirCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Tu navegador no permite usar la cámara en esta página. Usa https o localhost.');
      return;
    }

    try {
      flujo = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      video.srcObject = flujo;
      video.hidden = false;
      if (icono) icono.hidden = true;
      if (instruccion) instruccion.textContent = textoInicial;
    } catch (error) {
      flujo = null;
      console.error('Error de cámara:', error.name, error.message);
      if (error.name === 'NotAllowedError') {
        alert('El permiso de la cámara está bloqueado. Actívalo en el candado de la barra de direcciones.');
      } else if (error.name === 'NotFoundError') {
        alert('No se encontró ninguna cámara en este equipo.');
      } else if (error.name === 'NotReadableError') {
        alert('La cámara está en uso por otra aplicación (Zoom, Teams, Meet...). Ciérrala e intenta de nuevo.');
      } else {
        alert('No se pudo abrir la cámara: ' + error.name);
      }
    }
  }

  // Apaga la cámara y vuelve a mostrar el ícono
  function cerrarCamara() {
    if (flujo) {
      flujo.getTracks().forEach((pista) => pista.stop());
      flujo = null;
    }
    video.srcObject = null;
    video.hidden = true;
    if (icono) icono.hidden = false;
  }

  // Toma una foto del cuadro actual del video y devuelve la imagen en texto (base64)
  function capturarRostro() {
    lienzo.width = video.videoWidth;
    lienzo.height = video.videoHeight;
    lienzo.getContext('2d').drawImage(video, 0, 0);
    return lienzo.toDataURL('image/jpeg', 0.9);
  }

  // Se ejecuta cuando ya hay una foto del rostro.
  // Aquí se conectaría la detección de rostro o el envío a un servidor.
  function alCapturarRostro(foto) {
    console.log('Rostro capturado (' + foto.length + ' caracteres)');
    if (instruccion) instruccion.textContent = 'ROSTRO CAPTURADO';
  }

  // Primer toque: abre la cámara. Segundo toque: captura y apaga la cámara.
  async function alternarCamara() {
    console.log('Clic en el círculo');
    if (!flujo) {
      await abrirCamara();
      return;
    }
    const foto = capturarRostro();
    cerrarCamara();
    alCapturarRostro(foto);
  }

  circulo.addEventListener('click', alternarCamara);

  // El círculo es un div con role="button": también responde al teclado
  circulo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      alternarCamara();
    }
  });

  // Apaga la cámara al salir de la página
  window.addEventListener('pagehide', cerrarCamara);

})();
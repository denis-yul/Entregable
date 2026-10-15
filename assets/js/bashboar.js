// bashboard.js — Detecta el rostro con la cámara y lo captura automáticamente
// Necesita face-api.js cargado antes en el HTML (ver instrucciones).
// Todo va dentro de una función para no chocar con nombres de otros scripts (ej. mein.js)
(function () {

  // Carpeta con los modelos de detección (puedes cambiarla por assets/models/ si los descargas)
  const RUTA_MODELOS = 'https://cdn.jsdelivr.net/gh/vladmandic/face-api@1.7.12/model/';

  // Cuántas detecciones seguidas hacen falta para capturar (evita fotos movidas)
  const ACIERTOS_NECESARIOS = 5;

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

  // ¿Se cargó face-api.js? Si no, funciona en modo manual (foto con un segundo toque)
  const hayDetector = typeof faceapi !== 'undefined';
  if (!hayDetector) {
    console.warn('bashboard.js: no se cargó face-api.js, se usará la foto manual');
  }
  console.log('bashboard.js listo: toca el círculo para abrir la cámara');

  // Carga el modelo de detección una sola vez al abrir la página
  const modeloListo = hayDetector
    ? faceapi.nets.tinyFaceDetector.loadFromUri(RUTA_MODELOS)
        .then(() => true)
        .catch((error) => {
          console.error('No se pudo cargar el modelo de rostros:', error);
          return false;
        })
    : Promise.resolve(false);

  const opciones = hayDetector
    ? new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
    : null;

  // Texto original de la instrucción (para restaurarlo)
  const textoInicial = instruccion ? instruccion.textContent : '';

  let flujo = null;        // flujo de la cámara (null = apagada)
  let abriendo = false;    // evita abrir la cámara dos veces con toques rápidos
  let escaneando = false;  // true mientras busca el rostro
  let modoManual = false;  // true si no hay detector
  let aciertos = 0;        // detecciones seguidas del rostro

  // Cambia el texto de la instrucción
  function mostrar(texto) {
    if (instruccion) instruccion.textContent = texto;
  }

  // Abre la cámara frontal y muestra el video dentro del círculo
  async function abrirCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Tu navegador no permite usar la cámara en esta página. Usa https o localhost.');
      return false;
    }

    try {
      flujo = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      video.srcObject = flujo;
      video.hidden = false;
      if (icono) icono.hidden = true;
      await video.play().catch(() => {});
      return true;
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
      return false;
    }
  }

  // Apaga la cámara, detiene la búsqueda y vuelve a mostrar el ícono
  function cerrarCamara() {
    escaneando = false;
    modoManual = false;
    aciertos = 0;
    if (flujo) {
      flujo.getTracks().forEach((pista) => pista.stop());
      flujo = null;
    }
    video.srcObject = null;
    video.hidden = true;
    if (icono) icono.hidden = false;
  }

  // ¿El rostro está en el centro y a buen tamaño?
  function rostroCentrado(caja) {
    const ancho = video.videoWidth;
    const alto = video.videoHeight;
    const centroX = caja.x + caja.width / 2;
    const centroY = caja.y + caja.height / 2;
    const centrado = Math.abs(centroX - ancho / 2) < ancho * 0.2 &&
                     Math.abs(centroY - alto / 2) < alto * 0.25;
    const tamano = caja.width > ancho * 0.18 && caja.width < ancho * 0.8;
    return centrado && tamano;
  }

  // Recorta solo el rostro (con un margen) y devuelve la imagen en texto (base64)
  function recortarRostro(caja) {
    const margen = 0.25;
    const x = Math.max(0, caja.x - caja.width * margen);
    const y = Math.max(0, caja.y - caja.height * margen);
    const ancho = Math.min(video.videoWidth - x, caja.width * (1 + 2 * margen));
    const alto = Math.min(video.videoHeight - y, caja.height * (1 + 2 * margen));
    lienzo.width = ancho;
    lienzo.height = alto;
    lienzo.getContext('2d').drawImage(video, x, y, ancho, alto, 0, 0, ancho, alto);
    return lienzo.toDataURL('image/jpeg', 0.9);
  }

  // Toma el cuadro completo del video (modo manual)
  function capturarCuadro() {
    lienzo.width = video.videoWidth;
    lienzo.height = video.videoHeight;
    lienzo.getContext('2d').drawImage(video, 0, 0);
    return lienzo.toDataURL('image/jpeg', 0.9);
  }

  // Se ejecuta cuando ya hay una foto del rostro.
  // Aquí se conectaría el reconocimiento (¿quién es?) o el envío a un servidor.
  function alCapturarRostro(foto) {
    console.log('Rostro capturado (' + foto.length + ' caracteres)');
    mostrar('ROSTRO CAPTURADO');
  }

  // Busca el rostro una y otra vez; cuando lo ve estable, lo captura
  async function buscarRostro() {
    if (!escaneando) return;

    const deteccion = await faceapi.detectSingleFace(video, opciones);
    if (!escaneando) return; // se canceló mientras buscaba

    if (deteccion && rostroCentrado(deteccion.box)) {
      aciertos++;
      mostrar('ESCANEANDO... NO TE MUEVAS');
      if (aciertos >= ACIERTOS_NECESARIOS) {
        const foto = recortarRostro(deteccion.box);
        cerrarCamara();
        alCapturarRostro(foto);
        return;
      }
    } else {
      aciertos = 0;
      mostrar(textoInicial);
    }
    setTimeout(buscarRostro, 150);
  }

  // Toque en el círculo
  async function alternarCamara() {
    console.log('Clic en el círculo');

    // Cámara apagada: abrirla y empezar a buscar el rostro
    if (!flujo) {
      if (abriendo) return;
      abriendo = true;
      const abierta = await abrirCamara();
      abriendo = false;
      if (!abierta) return;

      mostrar(textoInicial);
      if (await modeloListo) {
        escaneando = true;
        aciertos = 0;
        buscarRostro();
      } else {
        modoManual = true;
        mostrar('TOCA EL CÍRCULO PARA TOMAR LA FOTO');
      }
      return;
    }

    // Cámara encendida en modo manual: tomar la foto
    if (modoManual) {
      const foto = capturarCuadro();
      cerrarCamara();
      alCapturarRostro(foto);
      return;
    }

    // Cámara encendida buscando el rostro: cancelar
    cerrarCamara();
    mostrar(textoInicial);
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
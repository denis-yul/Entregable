// bashboard.js — Cámara y captura del rostro (pantalla de escaneo)
 
// Elementos de la pantalla
const circulo = document.querySelector('.circulo-camara');
const video = document.querySelector('.video-camara');
const lienzo = document.querySelector('.lienzo-captura');
const icono = document.querySelector('.icono-rostro');
const instruccion = document.querySelector('.texto-instruccion');
 
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
    alert('No se pudo abrir la cámara. Revisa los permisos del navegador.');
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
  if (!flujo) {
    await abrirCamara();
    return;
  }
  const foto = capturarRostro();
  cerrarCamara();
  alCapturarRostro(foto);
}
 
// Solo se activa si esta página tiene la cámara (las demás páginas comparten scripts)
if (circulo && video && lienzo) {
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
}
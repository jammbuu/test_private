let preguntas = [];
let preguntaActualIndex = 0;
let correctas = 0;
let incorrectas = 0;
let fallos = [];
let aciertos = [];

function cargarPreguntas(archivo, modoFallos = false) {
  if (modoFallos) {
    preguntas = archivo;   // viene como array
  } else {
    fetch(`${archivo}`)
      .then(response => response.json())
      .then(data => {
        preguntas = data.preguntes;
        preguntas = preguntas.sort(() => Math.random() - 0.5);

        iniciarNuevoExamen();
      });
    return;
  }

  iniciarNuevoExamen();
}

function iniciarNuevoExamen() {
  preguntaActualIndex = 0;
  correctas = 0;
  incorrectas = 0;
  fallos = [];
  aciertos = [];

  document.querySelector('h1').innerText = `Pregunta ${preguntaActualIndex + 1} de ${preguntas.length}`;
  mostrarPregunta();
}

window.onload = () => {
  cargarPreguntas('preguntas.json');
};

function mostrarPregunta() {
  if (preguntaActualIndex === preguntas.length) {
    mostrarPantallaFinal();
    return;
  }

  let preguntaActual = preguntas[preguntaActualIndex];
  document.querySelector('h1').innerText = `Pregunta ${preguntaActualIndex + 1} de ${preguntas.length}`;

  document.getElementById('pregunta').innerText = preguntaActual.text;

  let opcionesDiv = document.getElementById('opciones');
  opcionesDiv.innerHTML = '';

  let imagenDiv = document.getElementById('imagenPregunta');
  imagenDiv.innerHTML = '';

  if ((preguntaActual.type === 'multifoto' || preguntaActual.type === 'multiimg') && preguntaActual.img) {
    let img = document.createElement('img');
    img.src = preguntaActual.img;
    img.classList.add('max-w-full', 'rounded', 'shadow-md', 'my-4');
    imagenDiv.appendChild(img);
  }

  if (preguntaActual.type === 'multi' || preguntaActual.type === 'multifoto') {
    let respuestas = Object.entries(preguntaActual.respostes);
    mezclarArray(respuestas);

    respuestas.forEach(([key, value]) => {
      let b = document.createElement('button');
      b.innerText = value;
      b.classList.add('bg-gray-200', 'hover:bg-gray-300', 'py-2', 'px-4', 'rounded', 'w-full');
      b.onclick = () => validarRespuesta(key, value);
      opcionesDiv.appendChild(b);
    });

  } else if (preguntaActual.type === 'text') {

    let input = document.createElement('input');
    input.type = 'text';
    input.classList.add('border', 'rounded', 'py-2', 'px-4', 'w-full');

    let b = document.createElement('button');
    b.innerText = 'Validar';
    b.classList.add('bg-gray-200', 'hover:bg-gray-300', 'py-2', 'px-4', 'rounded', 'w-full');
    b.onclick = () => validarRespuesta(input.value, input.value);

    opcionesDiv.appendChild(input);
    opcionesDiv.appendChild(b);

    input.addEventListener('keyup', e => {
      if (e.key === 'Enter') validarRespuesta(input.value, input.value);
    });
  }
}

function mezclarArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function validarRespuesta(key, texto) {
  let p = preguntas[preguntaActualIndex];
  let correcta = obtenerCorrecta(p);
  let esCorrecta = p.correcta === key;

  if (esCorrecta) {
    aciertos.push({
      text: p.text,
      correcta,
      marcada: texto,
      img: p.img || null
    });
    correctas++;
  } else {
    fallos.push({
      id: p.id,
      text: p.text,
      correcta,
      marcada: texto,
      img: p.img || null,
      respostes: p.respostes,
      correctaKey: p.correcta,
      type: p.type
    });
    incorrectas++;
  }

  preguntaActualIndex++;
  mostrarPregunta();
}

function obtenerCorrecta(p) {
  return p.respostes ? p.respostes[p.correcta] : p.correcta;
}

function mostrarPantallaFinal() {
  let html = `
    <b>Correctas:</b> ${correctas}<br>
    <b>Incorrectas:</b> ${incorrectas}<br>
    <b>Nota:</b> ${(correctas / preguntas.length * 10).toFixed(2)}<br><br>
    <h4>Revisión:</h4>
  `;

  [...aciertos, ...fallos].forEach(p => {
    html += `
      <div style="margin-bottom:12px; padding:10px; border-left:3px solid ${p.marcada === p.correcta ? 'green' : 'red'};">
        <strong>${p.text}</strong><br>
        ${p.img ? `<img src="${p.img}" style="max-width:100%; margin:5px 0;">` : ''}
        <span style="color:${p.marcada === p.correcta ? 'green' : 'red'}">Marcaste: ${p.marcada}</span><br>
        <span style="color:green">Correcta: ${p.correcta}</span>
      </div>
    `;
  });

  Swal.fire({
    title: '¡Examen terminado!',
    width: 700,
    html,
    showCancelButton: fallos.length > 0,
    confirmButtonText: 'Volver a jugar',
    cancelButtonText: 'Repetir fallos',
    allowOutsideClick: false
  }).then(res => {
    if (res.dismiss === Swal.DismissReason.cancel && fallos.length > 0) {
      let preguntasFalladas = fallos.map(f => ({
        id: f.id,
        text: f.text,
        correcta: f.correctaKey,
        img: f.img,
        type: f.type || 'multi',
        respostes: f.respostes
      }));
      cargarPreguntas(preguntasFalladas, true);
    } else {
      window.location.reload();
    }
  });
}

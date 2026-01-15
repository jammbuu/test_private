let preguntas = [];
let preguntaActualIndex = 0;
let preguntasRespondidas = [];
let correctas = 0;
let incorrectas = 0;
let totalPreguntas = 0;
let preguntasInicial = 0;

// para el review final
let fallos = [];
let aciertos = [];

function cargarPreguntas(archivo, modoFallos = false) {
  fetch(`${archivo}`)
    .then(response => response.json())
    .then(data => {
      preguntaActualIndex = 0;
      preguntasRespondidas = [];
      correctas = 0;
      incorrectas = 0;
      fallos = [];
      aciertos = [];

      if (!modoFallos) {
        preguntas = data.preguntes;
        preguntas = preguntas.sort(() => Math.random() - 0.5);

        preguntasInicial = Math.max(preguntasInicial, ...preguntas.map(p => p.id));

        preguntas = preguntas.filter((pregunta, index, self) =>
          index === self.findIndex((t) => (t.text === pregunta.text))
        );

      } else {
        preguntas = archivo; // ahora archivo es un array de fallos
      }

      totalPreguntas = preguntas.length;
      document.querySelector('h1').innerText = `Pregunta ${preguntaActualIndex + 1} de ${preguntasInicial}`;
      mostrarPregunta();
    });
}

window.onload = () => {
  cargarPreguntas('preguntas.json');
};

function mostrarPregunta() {
  if (preguntaActualIndex != 0) {
    document.getElementById('disclaimer').setAttribute("hidden", "true");
  }

  if (preguntaActualIndex >= preguntas.length) {
    mostrarPantallaFinal();
    return;
  }

  let preguntaActual = preguntas[preguntaActualIndex];

  if (preguntasRespondidas.includes(preguntaActual.id)) {
    preguntaActualIndex++;
    mostrarPregunta();
    return;
  }

  document.querySelector('h1').innerText = `Pregunta ${preguntaActualIndex + 1} de ${preguntasInicial}`;

  document.getElementById('pregunta').innerText = preguntaActual.text;

  let opcionesDiv = document.getElementById('opciones');
  opcionesDiv.innerHTML = '';

  let imagenDiv = document.getElementById('imagenPregunta');
  imagenDiv.innerHTML = '';

  if ((preguntaActual.type === 'multifoto' || preguntaActual.type === 'multiimg') && preguntaActual.img) {
    let imgElement = document.createElement('img');
    imgElement.src = preguntaActual.img;
    imgElement.classList.add('max-w-full', 'rounded', 'shadow-md', 'my-4');
    imagenDiv.appendChild(imgElement);
  }

  if (preguntaActual.type === 'multi' || preguntaActual.type === 'multifoto') {
    let respuestas = Object.entries(preguntaActual.respostes);
    mezclarArray(respuestas);

    respuestas.forEach(([key, value]) => {
      let boton = document.createElement('button');
      boton.innerText = value;
      boton.classList.add('bg-gray-200', 'hover:bg-gray-300', 'py-2', 'px-4', 'rounded', 'w-full');
      boton.onclick = () => validarRespuesta(key, value);
      opcionesDiv.appendChild(boton);
    });

  } else if (preguntaActual.type === 'text') {
    let input = document.createElement('input');
    input.type = 'text';
    input.id = 'respuestaTexto';
    input.classList.add('border', 'rounded', 'py-2', 'px-4', 'w-full');

    let boton = document.createElement('button');
    boton.innerText = 'Validar';
    boton.classList.add('bg-gray-200', 'hover:bg-gray-300', 'py-2', 'px-4', 'rounded', 'w-full');
    boton.onclick = () => validarRespuesta(input.value, input.value);

    opcionesDiv.appendChild(input);
    opcionesDiv.appendChild(boton);

    input.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') validarRespuesta(input.value, input.value);
    });
  }
}

function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function validarRespuesta(respuestaUsuarioKey, respuestaUsuarioTexto) {
  let preguntaActual = preguntas[preguntaActualIndex];
  let esCorrecta = preguntaActual.correcta === respuestaUsuarioKey;
  let respuestaCorrecta = obtenerRespuestaCorrecta(preguntaActual);

  if (esCorrecta) {
    aciertos.push({
      text: preguntaActual.text,
      correcta: respuestaCorrecta,
      marcada: respuestaUsuarioTexto,
      img: preguntaActual.img || null
    });
    correctas++;
  } else {
    fallos.push({
      id: preguntaActual.id,
      text: preguntaActual.text,
      correcta: respuestaCorrecta,
      marcada: respuestaUsuarioTexto,
      img: preguntaActual.img || null,
      respostes: preguntaActual.respostes,
      correctaKey: preguntaActual.correcta
    });
    incorrectas++;
  }

  preguntasRespondidas.push(preguntaActual.id);
  preguntaActualIndex++;
  mostrarPregunta();
}

function obtenerRespuestaCorrecta(pregunta) {
  return pregunta.respostes ? pregunta.respostes[pregunta.correcta] : pregunta.correcta;
}

function mostrarPantallaFinal() {
  let html = `<h3 style="font-weight:bold;">Resultados del examen</h3><br>`;

  html += `<b>Correctas:</b> ${correctas}<br>`;
  html += `<b>Incorrectas:</b> ${incorrectas}<br>`;
  html += `<b>Nota:</b> ${(correctas / totalPreguntas * 10).toFixed(2)}<br><br>`;

  html += `<h4 style="margin-top:10px;">Revisión completa:</h4>`;

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
    html: html,
    showCancelButton: fallos.length > 0,
    cancelButtonText: 'Repetir solo fallos',
    confirmButtonText: 'Volver a jugar',
    allowOutsideClick: false
  }).then(result => {
    if (result.dismiss === Swal.DismissReason.cancel && fallos.length > 0) {
      let preguntasFalladas = fallos.map(f => {
        return {
          id: f.id,
          text: f.text,
          correcta: f.correctaKey,
          img: f.img,
          type: 'multi',
          respostes: f.respostes
        };
      });
      cargarPreguntas(preguntasFalladas, true);
    } else {
      window.location.reload();
    }
  });
}

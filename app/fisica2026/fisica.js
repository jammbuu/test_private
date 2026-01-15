let preguntas = [];
let preguntaActualIndex = 0;
let preguntasRespondidas = [];
let correctas = 0;
let incorrectas = 0;
let totalPreguntas = 0;
let preguntasInicial = 0;

// nuevo: almacenar fallos con detalle
let fallos = [];

function cargarPreguntas(archivo) {
  fetch(`${archivo}`)
    .then(response => response.json())
    .then(data => {
      preguntaActualIndex = 0;
      preguntasRespondidas = [];
      correctas = 0;
      incorrectas = 0;
      fallos = [];

      preguntas = data.preguntes;
      preguntas = preguntas.sort(() => Math.random() - 0.5);

      preguntasInicial = Math.max(preguntasInicial, ...preguntas.map(p => p.id));

      preguntas = preguntas.filter((pregunta, index, self) =>
        index === self.findIndex((t) => (
          t.text === pregunta.text
        ))
      );

      totalPreguntas = preguntas.length;

      document.querySelector('h1').innerText = `Pregunta ${preguntaActualIndex + 1} de ${preguntasInicial}`;
      mostrarPregunta();
    });
}

window.onload = () => {
  cargarPreguntas('fisica_preguntas.json');
};

function mostrarPregunta() {
  if (preguntaActualIndex != 0) {
    document.getElementById('disclaimer').setAttribute("hidden", "true");
  }

  totalPreguntas = preguntas.length;
  document.querySelector('h1').innerText = `Pregunta ${preguntaActualIndex + 1} de ${preguntasInicial}`;

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

  document.getElementById('pregunta').innerText = preguntaActual.text;
  let opcionesDiv = document.getElementById('opciones');
  opcionesDiv.innerHTML = '';

  let imagenDiv = document.getElementById('imagenPregunta');
  imagenDiv.innerHTML = '';

  if (preguntaActual.type === 'multifoto' && preguntaActual.img) {
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
      boton.classList.add('bg-gray-200', 'hover:bg-gray-300', 'py-2', 'px-4', 'rounded');
      boton.onclick = () => validarRespuesta(key, value);
      opcionesDiv.appendChild(boton);
    });
  } else if (preguntaActual.type === 'text') {
    let input = document.createElement('input');
    input.type = 'text';
    input.id = 'respuestaTexto';
    input.classList.add('border', 'rounded', 'py-2', 'px-4');

    let boton = document.createElement('button');
    boton.innerText = 'Validar';
    boton.classList.add('bg-gray-200', 'hover:bg-gray-300', 'py-2', 'px-4', 'rounded');
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

  preguntaActualIndex++;

  if (esCorrecta) {
    Swal.fire({
      title: '¡Correcto!',
      icon: 'success',
      confirmButtonText: 'Siguiente'
    }).then(() => {
      correctas++;
      preguntasRespondidas.push(preguntaActual.id);
      mostrarPregunta();
    });
  } else {
    let respuestaCorrecta = obtenerRespuestaCorrecta(preguntaActual);

    fallos.push({
      id: preguntaActual.id,
      text: preguntaActual.text,
      correcta: respuestaCorrecta,
      marcada: respuestaUsuarioTexto,
      img: preguntaActual.img || null
    });

    Swal.fire({
      title: 'Incorrecto',
      text: `La correcta era: ${respuestaCorrecta}`,
      icon: 'error',
      confirmButtonText: 'Siguiente'
    }).then(() => {
      incorrectas++;
      preguntasRespondidas.push(preguntaActual.id);
      mostrarPregunta();
    });
  }
}

function obtenerRespuestaCorrecta(pregunta) {
  return pregunta.respostes ? pregunta.respostes[pregunta.correcta] : pregunta.correcta;
}

function mostrarPantallaFinal() {
  let htmlFallos = "";

  if (fallos.length > 0) {
    htmlFallos += `<h3 style="font-weight:bold; margin-bottom:10px;">Preguntas incorrectas:</h3>`;

    fallos.forEach(f => {
      htmlFallos += `
        <div style="margin-bottom:14px; padding:10px; border-left:3px solid red;">
          <div><strong>${f.text}</strong></div>
          ${f.img ? `<img src="${f.img}" style="max-width:100%; margin:6px 0;">` : ''}
          <div style="color:red; margin-top:4px;">Marcaste: ${f.marcada}</div>
          <div style="color:green;">Correcta: ${f.correcta}</div>
        </div>
      `;
    });
  } else {
    htmlFallos = `<p style="font-size:18px; margin-top:10px;">🔥 No fallaste ninguna, máquina</p>`;
  }

  Swal.fire({
    title: '¡Has terminado!',
    width: 650,
    html: `
      Acertaste: <b>${correctas}</b> <br>
      Fallaste: <b>${incorrectas}</b> <br>
      Nota: ${(correctas / totalPreguntas * 10).toFixed(2)}
      <br><br>
      ${htmlFallos}
    `,
    confirmButtonText: 'Volver a jugar',
    allowOutsideClick: false
  }).then(() => {
    window.location.reload();
  });
}

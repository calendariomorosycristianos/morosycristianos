let fiesta = null;
let localidad = null;

Promise.all([
  fetch("../datos/fiestas.json").then((respuesta) => {
    if (!respuesta.ok) {
      throw new Error("No se han podido cargar las fiestas.");
    }
    return respuesta.json();
  }),

  fetch("../datos/localidades.json").then((respuesta) => {
    if (!respuesta.ok) {
      throw new Error("No se han podido cargar las localidades.");
    }
    return respuesta.json();
  }),
])
  .then(([datosFiestas, datosLocalidades]) => {
    const parametros = new URLSearchParams(window.location.search);
    const idFiesta = parametros.get("id");

    fiesta = datosFiestas.find((elemento) => elemento.id === idFiesta);

    if (!fiesta) {
      window.location.href = "../404.html";
      return;
    }

    localidad = datosLocalidades.find(
      (elemento) => String(elemento.ine) === String(fiesta.ine),
    );

    if (!localidad) {
      console.error(
        "No se ha encontrado la localidad para el código INE:",
        fiesta.ine,
      );
    }

    cargarFiesta();
  })
  .catch((error) => {
    console.error("Error al cargar los datos:", error);
  });

function cargarFiesta() {
  /* =========================
       INFORMACIÓN DE LA FIESTA
    ========================= */

  document.getElementById("nombre-fiesta").textContent = fiesta.nombre;

  document.getElementById("localizacion-fiesta").textContent = localidad
    ? `${localidad.nombre} · ${localidad.provincia}`
    : "Localidad pendiente de revisar";

  /* =========================
       FECHAS
    ========================= */

  document.getElementById("fechas-fiesta").textContent = formatearFechas(
    fiesta.edicion.fechaInicio,
    fiesta.edicion.fechaFin,
  );

  /* =========================
       DESCRIPCIÓN
    ========================= */

  const contenedorDescripcion = document.getElementById("descripcion-fiesta");

  if (fiesta.descripcion) {
    contenedorDescripcion.innerHTML = `
            <p>${fiesta.descripcion}</p>
        `;
  }

  /* =========================
       PROGRAMA DE ACTOS
    ========================= */

  const contenedorActos = document.getElementById("actos-fiesta");

  let fechaActual = null;
  let contenedorDia = null;

  fiesta.edicion.actos.forEach((acto) => {
    // Si cambia el día, creamos un nuevo bloque
    if (acto.fecha !== fechaActual) {
      fechaActual = acto.fecha;

      contenedorDia = document.createElement("div");
      contenedorDia.classList.add("programa-dia");

      const tituloDia = document.createElement("h3");
      tituloDia.classList.add("programa-dia-titulo");
      tituloDia.textContent = acto.fecha;

      contenedorDia.appendChild(tituloDia);
      contenedorActos.appendChild(contenedorDia);
    }

    const elemento = document.createElement("article");

    elemento.classList.add("acto");

    if (acto.destacado) {
      elemento.classList.add("acto-destacado");
    }

    elemento.innerHTML = `
            <div class="acto-fecha">
                ${acto.hora}
            </div>

            <div class="acto-info">
                <h3>${acto.nombre}</h3>
                <p>${acto.descripcion}</p>
            </div>
        `;

    contenedorDia.appendChild(elemento);
  });

  /* =========================
       ENLACES OFICIALES
    ========================= */

  const contenedorEnlaces = document.getElementById("enlaces-fiesta");

  console.log("ENLACES:", fiesta.enlaces);

  const enlaces = [
    {
      nombre: "Instagram",
      url: fiesta.enlaces.instagram,
      icono: "../assets/icons/instagram.svg",
    },
    {
      nombre: "Facebook",
      url: fiesta.enlaces.facebook,
      icono: "../assets/icons/facebook.svg",
    },
    {
      nombre: "Web oficial",
      url: fiesta.enlaces.ayuntamiento,
      icono: "../assets/icons/web.svg",
    },
  ];

  enlaces.forEach((enlace) => {
    if (!enlace.url) {
      return;
    }

    const elemento = document.createElement("a");

    elemento.href = enlace.url;
    elemento.rel = "noopener noreferrer";

    elemento.innerHTML = `
        <img
            src="${enlace.icono}"
            alt=""
            class="enlace-icono"
        >

        <span>
            ${enlace.nombre}
        </span>
    `;

    contenedorEnlaces.appendChild(elemento);
    console.log("ENLACE CREADO:", elemento.outerHTML);
  });

  /* =========================
       IMAGEN DE CABECERA
    ========================= */

  document.querySelector(".fiesta-cabecera").style.backgroundImage =
    `url("${fiesta.imagen}")`;
}

/* =========================
   FORMATEAR FECHAS
========================= */

function formatearFechas(fechaInicio, fechaFin) {
  const partesInicio = fechaInicio.split(" ");
  const partesFin = fechaFin.split(" ");

  const diaInicio = partesInicio[0];
  const mesInicio = partesInicio[1];

  const diaFin = partesFin[0];
  const mesFin = partesFin[1];

  if (mesInicio === mesFin) {
    return `Del ${diaInicio} al ${diaFin} de ${mesInicio}`;
  }

  return `Del ${diaInicio} de ${mesInicio} al ${diaFin} de ${mesFin}`;
}

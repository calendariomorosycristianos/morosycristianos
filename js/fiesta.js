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

/* =========================
   CARGAR FICHA DE LA FIESTA
========================= */

function cargarFiesta() {
  document.getElementById("nombre-fiesta").textContent = fiesta.nombre;

  document.getElementById("localizacion-fiesta").textContent = localidad
    ? `${localidad.nombre} · ${localidad.provincia}`
    : "Localidad pendiente de revisar";

const edicion = fiesta.edicion;

document.getElementById("fechas-fiesta").textContent =
  formatearFechasEdicion(edicion);

  const contenedorDescripcion = document.getElementById("descripcion-fiesta");

  if (fiesta.descripcion) {
    const parrafo = document.createElement("p");
    parrafo.textContent = fiesta.descripcion;
    contenedorDescripcion.appendChild(parrafo);
  }

  cargarActos(edicion?.actos || []);

  cargarEnlaces();

  document.querySelector(".fiesta-cabecera").style.backgroundImage =
    `url("${fiesta.imagen}")`;
}

/* =========================
   CALCULAR FECHAS
========================= */

// Convierte DD-MM en una fecha del año indicado.
// También acepta YYYY-MM-DD para fechas confirmadas.
function interpretarFecha(valor, anio) {
  if (typeof valor !== "string") {
    return null;
  }

  const fechaCompleta = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (fechaCompleta) {
    const fecha = crearFecha(
      Number(fechaCompleta[1]),
      Number(fechaCompleta[2]),
      Number(fechaCompleta[3]),
    );

    return fecha;
  }

  const fechaDiaMes = valor.match(/^(\d{2})-(\d{2})$/);

  if (!fechaDiaMes) {
    return null;
  }

  return crearFecha(
    anio,
    Number(fechaDiaMes[2]),
    Number(fechaDiaMes[1]),
  );
}

function crearFecha(anio, mes, dia) {
  const fecha = new Date(anio, mes - 1, dia);

  // Evita aceptar fechas inexistentes, como 31-02.
  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return null;
  }

  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function esFechaRecurrente() {
  return ["fecha_fija", "regla_anual"].includes(fiesta.tipoFiesta);
}

function obtenerPeriodoFiesta(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    return null;
  }

  // Las fiestas recurrentes actuales usan DD-MM.
  if (esFechaRecurrente()) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let anio = hoy.getFullYear();
    let inicio = interpretarFecha(fechaInicio, anio);
    let fin = interpretarFecha(fechaFin, anio);

    if (!inicio || !fin) {
      return null;
    }

    // Si el periodo atraviesa el cambio de año.
    if (fin < inicio) {
      fin = interpretarFecha(fechaFin, anio + 1);
    }

    // Si toda la edición ya terminó, pasar a la próxima.
    if (fin < hoy) {
      anio += 1;
      inicio = interpretarFecha(fechaInicio, anio);
      fin = interpretarFecha(fechaFin, anio);

      if (inicio && fin && fin < inicio) {
        fin = interpretarFecha(fechaFin, anio + 1);
      }
    }

    if (!inicio || !fin) {
      return null;
    }

    return { inicio, fin };
  }

  // Las fechas variables y especiales necesitan año confirmado.
  const inicio = interpretarFecha(fechaInicio);
  const fin = interpretarFecha(fechaFin);

  if (!inicio || !fin || fin < inicio) {
    return null;
  }

  return { inicio, fin };
}

/* =========================
   MOSTRAR FECHAS
========================= */

function obtenerPeriodoEdicion(edicion) {
  if (!edicion) {
    return null;
  }

  // Fiestas cuya fecha se calcula mediante una regla.
  if (
    fiesta.tipoFiesta === "fecha_anual" &&
    edicion.reglaFecha
  ) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let anio = hoy.getFullYear();
    let fecha = calcularFechaRegla(edicion.reglaFecha, anio);

    if (!fecha) {
      return null;
    }

    // Si la fecha de este año ya ha pasado, calcular la del siguiente.
    if (fecha < hoy) {
      anio++;
      fecha = calcularFechaRegla(edicion.reglaFecha, anio);
    }

    if (!fecha) {
      return null;
    }

    return { inicio: fecha, fin: fecha };
  }

  // Las demás fiestas mantienen el funcionamiento actual.
  return obtenerPeriodoFiesta(
    edicion.fechaInicio,
    edicion.fechaFin,
  );
}

function formatearFechasEdicion(edicion) {
  const periodo = obtenerPeriodoEdicion(edicion);

  if (!periodo) {
    return "Fechas pendientes de confirmar";
  }

  return formatearFechas(
    formatearFechaParaCalculo(periodo.inicio),
    formatearFechaParaCalculo(periodo.fin),
  );
}

function formatearFechaParaCalculo(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearFecha(fecha) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
  }).format(fecha);
}

function formatearFechas(fechaInicio, fechaFin) {
  const periodo = obtenerPeriodoFiesta(fechaInicio, fechaFin);

  if (!periodo) {
    return "Fechas pendientes de confirmar";
  }

  const { inicio, fin } = periodo;
  const diaInicio = inicio.getDate();
  const diaFin = fin.getDate();
  const mesInicio = inicio.getMonth();
  const mesFin = fin.getMonth();

  if (inicio.getTime() === fin.getTime()) {
    return formatearFecha(inicio);
  }

  if (
    mesInicio === mesFin &&
    inicio.getFullYear() === fin.getFullYear()
  ) {
    const mes = new Intl.DateTimeFormat("es-ES", {
      month: "long",
    }).format(inicio);

    return `Del ${diaInicio} al ${diaFin} de ${mes}`;
  }

  return `Del ${formatearFecha(inicio)} al ${formatearFecha(fin)}`;
}

/* =========================
   PROGRAMA DE ACTOS
========================= */

function cargarActos(actos) {
  const contenedorActos = document.getElementById("actos-fiesta");

  if (!Array.isArray(actos) || actos.length === 0) {
    contenedorActos.textContent = "Programa de actos pendiente de publicar.";
    return;
  }

  const periodo = obtenerPeriodoEdicion(fiesta.edicion);

  let fechaActual = null;
  let contenedorDia = null;

  actos.forEach((acto) => {
    let fechaActo = null;
if (
  fiesta.tipoFiesta === "fecha_anual" &&
  fiesta.edicion?.reglaFecha &&
  periodo
) {
  // La fecha del acto principal procede de la regla de la fiesta.
  fechaActo = periodo.inicio;
} else if (esFechaRecurrente() && periodo) {
  fechaActo = interpretarFecha(
    acto.fecha,
    periodo.inicio.getFullYear(),
  );

  if (
    fechaActo &&
    periodo.fin.getFullYear() > periodo.inicio.getFullYear() &&
    fechaActo < periodo.inicio
  ) {
    fechaActo = interpretarFecha(
      acto.fecha,
      periodo.fin.getFullYear(),
    );
  }
} else {
  fechaActo = interpretarFecha(acto.fecha);
}

    if (!fechaActo) {
      console.warn("Fecha de acto no válida o sin confirmar:", acto.fecha);
      return;
    }

    const claveFecha = fechaActo.getTime();

    if (claveFecha !== fechaActual) {
      fechaActual = claveFecha;

      contenedorDia = document.createElement("div");
      contenedorDia.classList.add("programa-dia");

      const tituloDia = document.createElement("h3");
      tituloDia.classList.add("programa-dia-titulo");
      tituloDia.textContent = formatearFecha(fechaActo);

      contenedorDia.appendChild(tituloDia);
      contenedorActos.appendChild(contenedorDia);
    }

    const elemento = document.createElement("article");
    elemento.classList.add("acto");

    if (acto.destacado) {
      elemento.classList.add("acto-destacado");
    }

    const fechaElemento = document.createElement("div");
    fechaElemento.classList.add("acto-fecha");
    fechaElemento.textContent = acto.hora || "";

    const informacion = document.createElement("div");
    informacion.classList.add("acto-info");

    const nombre = document.createElement("h3");
    nombre.textContent = acto.nombre || "Acto pendiente de nombrar";

    const descripcion = document.createElement("p");
    descripcion.textContent = acto.descripcion || "";

    informacion.append(nombre, descripcion);
    elemento.append(fechaElemento, informacion);
    contenedorDia.appendChild(elemento);
  });

  if (!contenedorActos.hasChildNodes()) {
    contenedorActos.textContent = "Programa de actos pendiente de confirmar.";
  }
}

/* =========================
   ENLACES OFICIALES
========================= */

function cargarEnlaces() {
  const contenedorEnlaces = document.getElementById("enlaces-fiesta");

  const enlaces = [
    {
      nombre: "Instagram",
      url: fiesta.enlaces?.instagram,
      icono: "../assets/icons/instagram.svg",
    },
    {
      nombre: "Facebook",
      url: fiesta.enlaces?.facebook,
      icono: "../assets/icons/facebook.svg",
    },
    {
      nombre: "Web oficial",
      url: fiesta.enlaces?.ayuntamiento,
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
    elemento.target = "_blank";

    const icono = document.createElement("img");
    icono.src = enlace.icono;
    icono.alt = "";
    icono.classList.add("enlace-icono");

    const texto = document.createElement("span");
    texto.textContent = enlace.nombre;

    elemento.append(icono, texto);
    contenedorEnlaces.appendChild(elemento);
  });
}
let fiestas = [];
let localidades = [];

const inputBusqueda = document.getElementById("busqueda");
const formularioBusqueda = document.getElementById("formulario-busqueda");
const resultadosBusqueda = document.getElementById("resultados-busqueda");
const resultadosAutocompletado = document.getElementById(
    "resultados-autocompletado",
);

const contenedorCarrusel = document.getElementById("proximas-fiestas");
const botonAnterior = document.getElementById("carrusel-anterior");
const botonSiguiente = document.getElementById("carrusel-siguiente");

let posicionCarrusel = 0;

// ==================================================
// CARGAR FIESTAS Y LOCALIDADES
// ==================================================

Promise.all([
    fetch("datos/fiestas.json").then((respuesta) => {
        if (!respuesta.ok) {
            throw new Error("No se han podido cargar las fiestas.");
        }
        return respuesta.json();
    }),
    fetch("datos/localidades.json").then((respuesta) => {
        if (!respuesta.ok) {
            throw new Error("No se han podido cargar las localidades.");
        }
        return respuesta.json();
    }),
])
    .then(([datosFiestas, datosLocalidades]) => {
        fiestas = datosFiestas;
        localidades = datosLocalidades;
        mostrarProximasFiestas();
    })
    .catch((error) => {
        console.error("Error al cargar los datos:", error);
    });

// ==================================================
// NORMALIZAR TEXTO PARA BUSCAR
// Ignora mayúsculas, acentos y diferencias de apóstrofo.
// ==================================================

function normalizarTexto(texto) {
    return (texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es")
        .replace(/[’‘]/g, "'")
        .trim()
        .replace(/\s+/g, " ");
}

// ==================================================
// OBTENER VARIANTES DEL NOMBRE
// Permite buscar con o sin artículo inicial.
// ==================================================

function obtenerVariantes(nombre) {
    const normalizado = normalizarTexto(nombre);

    if (!normalizado) {
        return [];
    }

    const variantes = [normalizado];

    const sinArticulo = normalizado.replace(
        /^(?:l'|el |la |los |las |els |les |lo |es )/,
        "",
    );

    if (sinArticulo && sinArticulo !== normalizado) {
        variantes.push(sinArticulo);
    }

    return variantes;
}

// ==================================================
// COMPROBAR COINCIDENCIAS
// Busca al inicio del nombre o de cualquiera de sus palabras.
// ==================================================

function coincideBusqueda(texto, consulta) {
    const variantes = obtenerVariantes(texto);

    return variantes.some((variante) => {
        const palabras = variante.split(/[\s'-]+/).filter(Boolean);

        return (
            variante.startsWith(consulta) ||
            palabras.some((palabra) => palabra.startsWith(consulta))
        );
    });
}

// ==================================================
// CALCULAR RELEVANCIA DE UNA LOCALIDAD
// Las coincidencias más exactas aparecen primero.
// ==================================================

function calcularPrioridad(localidad, consulta) {
    const nombre = normalizarTexto(localidad.nombre);
    const alias = normalizarTexto(localidad.alias);

    if (nombre === consulta) {
        return 0;
    }

    if (
        obtenerVariantes(localidad.nombre).some((variante) => variante === consulta)
    ) {
        return 1;
    }

    if (
        obtenerVariantes(localidad.nombre).some((variante) =>
            variante.startsWith(consulta),
        )
    ) {
        return 2;
    }

    if (coincideBusqueda(localidad.nombre, consulta)) {
        return 3;
    }

    if (alias && alias === consulta) {
        return 4;
    }

    if (
        alias &&
        obtenerVariantes(alias).some((variante) => variante.startsWith(consulta))
    ) {
        return 5;
    }

    if (alias && coincideBusqueda(alias, consulta)) {
        return 6;
    }

    return 99;
}

// AUTOCOMPLETADO DE MUNICIPIOS
inputBusqueda.addEventListener("input", () => {
    const consulta = normalizarTexto(inputBusqueda.value);

    resultadosAutocompletado.innerHTML = "";

    if (!consulta || localidades.length === 0) {
        return;
    }

    const resultados = localidades
        .map((localidad) => ({
            localidad,
            prioridad: calcularPrioridad(localidad, consulta),
        }))
        .filter((resultado) => resultado.prioridad < 99)
        .sort(
            (a, b) =>
                a.prioridad - b.prioridad ||
                a.localidad.nombre.localeCompare(b.localidad.nombre, "es"),
        )
        .slice(0, 5);

    resultadosAutocompletado.innerHTML = resultados
        .map(
            ({ localidad }) => `
            <button
                type="button"
                class="resultado-autocompletado"
                data-ine="${localidad.ine}"
            >
                <strong>${localidad.nombre}</strong>
                <span>${localidad.provincia || ""}</span>
            </button>
        `,
        )
        .join("");
});

// ==================================================
// SELECCIONAR UN MUNICIPIO DEL AUTOCOMPLETADO
// ==================================================

resultadosAutocompletado.addEventListener("click", (evento) => {
    const sugerencia = evento.target.closest(".resultado-autocompletado");

    if (!sugerencia) {
        return;
    }

    const localidad = localidades.find(
        (item) => String(item.ine) === sugerencia.dataset.ine,
    );

    if (!localidad) {
        return;
    }

    inputBusqueda.value = localidad.nombre;
    resultadosAutocompletado.innerHTML = "";
    inputBusqueda.focus();
});

formularioBusqueda.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const consulta = normalizarTexto(inputBusqueda.value);

    if (!consulta) {
        return;
    }

    resultadosAutocompletado.innerHTML = "";

    if (resultadosBusqueda) {
        resultadosBusqueda.textContent = "";
    }

    // Buscar municipios por nombre o alias.
    const municipiosCoincidentes = localidades.filter(
        (localidad) => calcularPrioridad(localidad, consulta) < 99,
    );

    // Dar prioridad a las coincidencias exactas.
    const localidadExacta = municipiosCoincidentes.find(
        (localidad) =>
            obtenerVariantes(localidad.nombre).includes(consulta) ||
            (normalizarTexto(localidad.alias) &&
                obtenerVariantes(localidad.alias).includes(consulta)),
    );

    const localidadSeleccionada =
        localidadExacta ||
        (municipiosCoincidentes.length === 1 ? municipiosCoincidentes[0] : null);

    if (!resultadosBusqueda) {
        console.error('No existe un elemento con id="resultados-busqueda".');
        return;
    }

    // Si la búsqueda es ambigua, pedir que se seleccione una sugerencia.
    if (!localidadSeleccionada) {
        if (municipiosCoincidentes.length > 1) {
            resultadosBusqueda.textContent =
                "Hay varias localidades coincidentes. Selecciona una de las sugerencias.";
        } else {
            resultadosBusqueda.textContent = `No hemos encontrado la localidad «${inputBusqueda.value.trim()}» en nuestro listado.`;
        }
        return;
    }

    // Buscar las fiestas usando exclusivamente el código INE.
    const ineLocalidad = String(localidadSeleccionada.ine);

    const resultados = fiestas.filter(
        (fiesta) => String(fiesta.ine) === ineLocalidad,
    );

    if (resultados.length === 1) {
        window.location.href = `fiestas/fiesta.html?id=${encodeURIComponent(resultados[0].id)}`;
        return;
    }

    if (resultados.length === 0) {
        resultadosBusqueda.textContent = `ℹ️ Todavía no tenemos fiestas añadidas para ${localidadSeleccionada.nombre}. Estamos ampliando el calendario.`;
        return;
    }

    resultadosBusqueda.textContent = `Hay varias fiestas registradas para ${localidadSeleccionada.nombre}: ${resultados
        .map((fiesta) => fiesta.nombre)
        .join(" · ")}. Estamos preparando la selección de fiestas.`;
});


 // ==================================================
 // GESTIÓN DE FECHAS
 // ==================================================

function crearFecha(anio, mes, dia) {
    const fecha = new Date(anio, mes - 1, dia);
    
    // Evitar que JavaScript convierta fechas inválidas,
    // como el 31 de febrero, en fechas de marzo.
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

function interpretarFecha(fechaTexto, anio) {
    if (typeof fechaTexto !== "string") {
        return null;
    }

    // Fecha completa: YYYY-MM-DD.
    const completa = fechaTexto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (completa) {
        return crearFecha(
            Number(completa[1]),
            Number(completa[2]),
            Number(completa[3])
        );
    }

    // Fecha recurrente: DD-MM.
    const recurrente = fechaTexto.match(/^(\d{2})-(\d{2})$/);

    if (!recurrente || !Number.isInteger(anio)) {
        return null;
    }

    return crearFecha(
        anio,
        Number(recurrente[2]),
        Number(recurrente[1])
    );
}

// ==================================================
// CALCULAR LA PRÓXIMA EDICIÓN
// ==================================================

function obtenerPeriodoCarrusel(fiesta, hoy) {
    const edicion = fiesta.edicion;

    if (!edicion?.fechaInicio || !edicion?.fechaFin) {
        return null;
    }

    const recurrente = [
        "fecha_fija",
        "regla_anual"
    ].includes(fiesta.tipoFiesta);

    if (recurrente) {
        let anio = hoy.getFullYear();

        let inicio = interpretarFecha(edicion.fechaInicio, anio);
        let fin = interpretarFecha(edicion.fechaFin, anio);

        if (!inicio || !fin) {
            return null;
        }

        // La fiesta puede comenzar en diciembre y terminar en enero.
        if (fin < inicio) {
            fin = interpretarFecha(edicion.fechaFin, anio + 1);
        }

        if (!fin) {
            return null;
        }

        // Si la edición ya ha terminado, calcular la del año siguiente.
        if (fin < hoy) {
            anio++;

            inicio = interpretarFecha(edicion.fechaInicio, anio);
            fin = interpretarFecha(edicion.fechaFin, anio);

            if (!inicio || !fin) {
                return null;
            }

            if (fin < inicio) {
                fin = interpretarFecha(edicion.fechaFin, anio + 1);
            }
        }

        if (!inicio || !fin || fin < inicio) {
            return null;
        }

        return { inicio, fin };
    }

    // Las fechas variables y especiales deben llevar el año.
    const inicio = interpretarFecha(edicion.fechaInicio);
    const fin = interpretarFecha(edicion.fechaFin);

    if (!inicio || !fin || fin < inicio) {
        return null;
    }

    // No inventar una nueva edición para estas fiestas.
    if (fin < hoy) {
        return null;
    }

    return { inicio, fin };
}

// ==================================================
// FORMATEAR FECHAS PARA MOSTRARLAS
// ==================================================

function formatearFechaCarrusel(fecha, incluirAnio = false) {
    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        ...(incluirAnio ? { year: "numeric" } : {})
    }).format(fecha);
}

function formatearFechasCarrusel(inicio, fin, incluirAnio = false) {
    if (inicio.getTime() === fin.getTime()) {
        return formatearFechaCarrusel(inicio, incluirAnio);
    }

    const mismoMes =
        inicio.getMonth() === fin.getMonth() &&
        inicio.getFullYear() === fin.getFullYear();

    if (mismoMes) {
        const mes = new Intl.DateTimeFormat("es-ES", {
            month: "long"
        }).format(inicio);

        const anio = incluirAnio
            ? ` de ${inicio.getFullYear()}`
            : "";

        return `Del ${inicio.getDate()} al ${fin.getDate()} de ${mes}${anio}`;
    }

    return `Del ${formatearFechaCarrusel(inicio, incluirAnio)} al ${formatearFechaCarrusel(fin, incluirAnio)}`;
}

// ==================================================
// PRÓXIMAS FIESTAS - CARRUSEL
// ==================================================

function mostrarProximasFiestas() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximas = fiestas
        .map((fiesta) => {
            const periodo = obtenerPeriodoCarrusel(fiesta, hoy);

            if (!periodo) {
                return null;
            }

            const { inicio, fin } = periodo;

            return {
                ...fiesta,
                fechaInicioCalculada: inicio,
                fechaFinCalculada: fin,
                celebrandose: inicio <= hoy && fin >= hoy
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            // Las fiestas que están celebrándose aparecen primero.
            if (a.celebrandose && !b.celebrandose) return -1;
            if (!a.celebrandose && b.celebrandose) return 1;

            return a.fechaInicioCalculada - b.fechaInicioCalculada;
        })
        .slice(0, 4);

    contenedorCarrusel.innerHTML = proximas
        .map((fiesta) => {
            const localidad = localidades.find(
                (item) => String(item.ine) === String(fiesta.ine)
            );

            const nombreLocalidad = localidad
                ? localidad.nombre
                : "Localidad pendiente de revisar";

            const provincia = localidad
                ? localidad.provincia || ""
                : "";

            const incluirAnio = [
                "fecha_variable",
                "fecha_especial"
            ].includes(fiesta.tipoFiesta);

            const fechas = formatearFechasCarrusel(
                fiesta.fechaInicioCalculada,
                fiesta.fechaFinCalculada,
                incluirAnio
            );

            return `
                <article class="tarjeta-fiesta">
                    <p class="fecha">${fechas}</p>
                    <h3>${nombreLocalidad}</h3>
                    <p>${provincia}</p>
                    <a href="fiestas/fiesta.html?id=${encodeURIComponent(fiesta.id)}">
                        Ver fiesta →
                    </a>
                </article>
            `;
        })
        .join("");

    posicionCarrusel = 0;
    actualizarCarrusel();
}


// ==================================================
// ACTUALIZAR CARRUSEL
// ==================================================

function actualizarCarrusel() {
    const tarjetas = contenedorCarrusel.querySelectorAll(".tarjeta-fiesta");

    tarjetas.forEach((tarjeta, indice) => {
        tarjeta.classList.remove(
            "central",
            "izquierda",
            "derecha",
            "oculta"
        );

        const diferencia = indice - posicionCarrusel;

        if (diferencia === 0) {
            tarjeta.classList.add("central");
        } else if (diferencia === -1) {
            tarjeta.classList.add("izquierda");
        } else if (diferencia === 1) {
            tarjeta.classList.add("derecha");
        } else {
            tarjeta.classList.add("oculta");
        }
    });

    const hayVariasTarjetas = tarjetas.length > 1;

    botonAnterior.disabled = !hayVariasTarjetas;
    botonSiguiente.disabled = !hayVariasTarjetas;
}


// ==================================================
// BOTONES DEL CARRUSEL
// ==================================================

botonSiguiente.addEventListener("click", () => {
    const tarjetas = contenedorCarrusel.querySelectorAll(".tarjeta-fiesta");

    if (tarjetas.length <= 1) {
        return;
    }

    posicionCarrusel = (posicionCarrusel + 1) % tarjetas.length;
    actualizarCarrusel();
});

botonAnterior.addEventListener("click", () => {
    const tarjetas = contenedorCarrusel.querySelectorAll(".tarjeta-fiesta");

    if (tarjetas.length <= 1) {
        return;
    }

    posicionCarrusel =
        (posicionCarrusel - 1 + tarjetas.length) % tarjetas.length;

    actualizarCarrusel();
});
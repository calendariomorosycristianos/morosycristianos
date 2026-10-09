
let fiestas = [];
let localidades = [];

const inputBusqueda = document.getElementById("busqueda");
const formularioBusqueda = document.getElementById("formulario-busqueda");
const resultadosBusqueda = document.getElementById("resultados-busqueda");
const resultadosAutocompletado = document.getElementById("resultados-autocompletado");

const contenedorCarrusel = document.getElementById("proximas-fiestas");
const botonAnterior = document.getElementById("carrusel-anterior");
const botonSiguiente = document.getElementById("carrusel-siguiente");

let posicionCarrusel = 0;


// ==================================================
// CARGAR FIESTAS Y LOCALIDADES
// ==================================================

Promise.all([
    fetch("datos/fiestas.json").then(respuesta => {
        if (!respuesta.ok) {
            throw new Error("No se han podido cargar las fiestas.");
        }
        return respuesta.json();
    }),
    fetch("datos/localidades.json").then(respuesta => {
        if (!respuesta.ok) {
            throw new Error("No se han podido cargar las localidades.");
        }
        return respuesta.json();
    })
])
    .then(([datosFiestas, datosLocalidades]) => {
        fiestas = datosFiestas;
        localidades = datosLocalidades;
        mostrarProximasFiestas();
    })
    .catch(error => {
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
        ""
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

    return variantes.some(variante => {
        const palabras = variante
            .split(/[\s'-]+/)
            .filter(Boolean);

        return variante.startsWith(consulta) ||
            palabras.some(palabra => palabra.startsWith(consulta));
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

    if (obtenerVariantes(localidad.nombre).some(
        variante => variante === consulta
    )) {
        return 1;
    }

    if (obtenerVariantes(localidad.nombre).some(
        variante => variante.startsWith(consulta)
    )) {
        return 2;
    }

    if (coincideBusqueda(localidad.nombre, consulta)) {
        return 3;
    }

    if (alias && alias === consulta) {
        return 4;
    }

    if (alias && obtenerVariantes(alias).some(
        variante => variante.startsWith(consulta)
    )) {
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
        .map(localidad => ({
            localidad,
            prioridad: calcularPrioridad(localidad, consulta)
        }))
        .filter(resultado => resultado.prioridad < 99)
        .sort((a, b) =>
            a.prioridad - b.prioridad ||
            a.localidad.nombre.localeCompare(
                b.localidad.nombre,
                "es"
            )
        )
        .slice(0, 5);

    resultadosAutocompletado.innerHTML = resultados
        .map(({ localidad }) => `
            <button
                type="button"
                class="resultado-autocompletado"
                data-ine="${localidad.ine}"
            >
                <strong>${localidad.nombre}</strong>
                <span>${localidad.provincia || ""}</span>
            </button>
        `)
        .join("");
});



// ==================================================
// SELECCIONAR UN MUNICIPIO DEL AUTOCOMPLETADO
// ==================================================

resultadosAutocompletado.addEventListener("click", evento => {
    const sugerencia = evento.target.closest(
        ".resultado-autocompletado"
    );

    if (!sugerencia) {
        return;
    }

    const localidad = localidades.find(
        item => String(item.ine) === sugerencia.dataset.ine
    );

    if (!localidad) {
        return;
    }

    inputBusqueda.value = localidad.nombre;
    resultadosAutocompletado.innerHTML = "";
    inputBusqueda.focus();
});



formularioBusqueda.addEventListener("submit", evento => {
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
    const municipiosCoincidentes = localidades.filter(localidad =>
        calcularPrioridad(localidad, consulta) < 99
    );

    // Dar prioridad a las coincidencias exactas.
    const localidadExacta = municipiosCoincidentes.find(localidad =>
        obtenerVariantes(localidad.nombre).includes(consulta) ||
        (
            normalizarTexto(localidad.alias) &&
            obtenerVariantes(localidad.alias).includes(consulta)
        )
    );

    const localidadSeleccionada = localidadExacta ||
        (municipiosCoincidentes.length === 1
            ? municipiosCoincidentes[0]
            : null);

    if (!resultadosBusqueda) {
        console.error(
            'No existe un elemento con id="resultados-busqueda".'
        );
        return;
    }

    // Si la búsqueda es ambigua, pedir que se seleccione una sugerencia.
    if (!localidadSeleccionada) {
        if (municipiosCoincidentes.length > 1) {
            resultadosBusqueda.textContent =
                "Hay varias localidades coincidentes. Selecciona una de las sugerencias.";
        } else {
            resultadosBusqueda.textContent =
                `No hemos encontrado la localidad «${inputBusqueda.value.trim()}» en nuestro listado.`;
        }
        return;
    }

    // Buscar las fiestas usando exclusivamente el código INE.
    const ineLocalidad = String(localidadSeleccionada.ine);

    const resultados = fiestas.filter(fiesta =>
        String(fiesta.ine) === ineLocalidad
    );

    if (resultados.length === 1) {
        window.location.href =
            `fiestas/fiesta.html?id=${encodeURIComponent(resultados[0].id)}`;
        return;
    }

    if (resultados.length === 0) {
        resultadosBusqueda.textContent =
            `ℹ️ Todavía no tenemos fiestas añadidas para ${localidadSeleccionada.nombre}. Estamos ampliando el calendario.`;
        return;
    }

    resultadosBusqueda.textContent =
        `Hay varias fiestas registradas para ${localidadSeleccionada.nombre}: ${
            resultados.map(fiesta => fiesta.nombre).join(" · ")
        }. Estamos preparando la selección de fiestas.`;
});


// ==================================================
// CONVERTIR UNA FECHA EN TEXTO A FECHA REAL
// ==================================================

function obtenerFecha(fechaTexto, año) {
    const partes = fechaTexto.trim().toLowerCase().split(/\s+/);
    const dia = Number.parseInt(partes[0], 10);

    const meses = {
        enero: 0,
        febrero: 1,
        marzo: 2,
        abril: 3,
        mayo: 4,
        junio: 5,
        julio: 6,
        agosto: 7,
        septiembre: 8,
        octubre: 9,
        noviembre: 10,
        diciembre: 11
    };

    const mes = meses[partes[1]];

    if (!Number.isInteger(dia) || mes === undefined) {
        return null;
    }

    return new Date(año, mes, dia);
}


// ==================================================
// PRÓXIMAS FIESTAS
// ==================================================

function mostrarProximasFiestas() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximas = fiestas
        .filter(fiesta =>
            fiesta.edicion &&
            fiesta.edicion.fechaInicio &&
            fiesta.edicion.fechaFin
        )
        .map(fiesta => {
            const añoEdicion = Number(fiesta.edicion.año);

            let fecha = obtenerFecha(
                fiesta.edicion.fechaInicio,
                añoEdicion
            );

            if (!fecha) {
                return null;
            }

            const fechaFin = obtenerFecha(
                fiesta.edicion.fechaFin,
                añoEdicion
            );

            if (!fechaFin) {
                return null;
            }

            // Si la edición ya terminó, mostramos la siguiente.
            if (fechaFin < hoy) {
                fecha = obtenerFecha(
                    fiesta.edicion.fechaInicio,
                    añoEdicion + 1
                );
            }

            return {
                ...fiesta,
                fecha
            };
        })
        .filter(fiesta => fiesta && fiesta.fecha)
        .sort((a, b) => a.fecha - b.fecha)
        .slice(0, 4);

  
contenedorCarrusel.innerHTML = proximas
    .map(fiesta => {
        const localidad = localidades.find(
            item => String(item.ine) === String(fiesta.ine)
        );

        const nombreLocalidad = localidad
            ? localidad.nombre
            : "Localidad pendiente de revisar";

        const provincia = localidad
            ? localidad.provincia
            : "";

        return `
            <article class="tarjeta-fiesta">
                <p class="fecha">
                    ${fiesta.edicion.fechaInicio} — ${fiesta.edicion.fechaFin}
                </p>
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
    const tarjetas = contenedorCarrusel.querySelectorAll(
        ".tarjeta-fiesta"
    );

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
    const tarjetas = contenedorCarrusel.querySelectorAll(
        ".tarjeta-fiesta"
    );

    if (tarjetas.length <= 1) {
        return;
    }

    posicionCarrusel = (posicionCarrusel + 1) % tarjetas.length;
    actualizarCarrusel();
});

botonAnterior.addEventListener("click", () => {
    const tarjetas = contenedorCarrusel.querySelectorAll(
        ".tarjeta-fiesta"
    );

    if (tarjetas.length <= 1) {
        return;
    }

    posicionCarrusel =
        (posicionCarrusel - 1 + tarjetas.length) % tarjetas.length;

    actualizarCarrusel();
});
const fiesta = {
    nombre: "Moros i Cristians i Contrabandistes",
    localidad: "La Font de la Figuera",
    provincia: "Valencia",
    imagen: "../assets/images/hero-moros.jpg",
    descripcion: "Los Moros y Cristianos de La Font de la Figuera forman parte de las fiestas tradicionales de la localidad, con diferentes actos y celebraciones que reúnen a vecinos y visitantes durante varios días.",
   enlaces: {
    instagram: {
        url: "",
        nombre: "Instagram"
    },
    facebook: {
        url: "",
        nombre: "Facebook"
    },
    ayuntamiento: {
        url: "",
        nombre: "Web oficial"
    }
},
    edicion: {
        año: 2026,
        fechaInicio: "5 diciembre",
        fechaFin: "8 diciembre",
        actos: [
            {
                fecha: "5 diciembre",
                hora: "20:00",
                nombre: "Acto de ejemplo",
                descripcion: "Descripción del acto de ejemplo.",
                destacado: false
            },
            {
                fecha: "6 diciembre",
                hora: "12:00",
                nombre: "Desfile de ejemplo",
                descripcion: "Descripción del desfile de ejemplo.",
                destacado: true
            },
            {
                fecha: "7 diciembre",
                hora: "18:00",
                nombre: "Entrada de ejemplo",
                descripcion: "Descripción de la entrada de ejemplo.",
                destacado: true
            }
        ]
    }
};


/* =========================
   INFORMACIÓN DE LA FIESTA
========================= */

document.getElementById("nombre-fiesta").textContent =
    fiesta.nombre;

document.getElementById("localizacion-fiesta").textContent =
    `${fiesta.localidad} · ${fiesta.provincia}`;


/* =========================
   FECHAS
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

document.getElementById("fechas-fiesta").textContent =
    formatearFechas(
        fiesta.edicion.fechaInicio,
        fiesta.edicion.fechaFin
    );


/* =========================
   DESCRIPCIÓN
========================= */

const contenedorDescripcion =
    document.getElementById("descripcion-fiesta");

if (fiesta.descripcion) {

    contenedorDescripcion.innerHTML = `
        <p>${fiesta.descripcion}</p>
    `;

}


/* =========================
   PROGRAMA DE ACTOS
========================= */

const contenedorActos =
    document.getElementById("actos-fiesta");

    let fechaActual = null;
let contenedorDia = null;

fiesta.edicion.actos.forEach(acto => {

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

const contenedorEnlaces =
    document.getElementById("enlaces-fiesta");

const enlaces = [
    {
        nombre: "Ayuntamiento",
        url: fiesta.enlaces.ayuntamiento
    },
    {
        nombre: "Instagram",
        url: fiesta.enlaces.instagram
    },
    {
        nombre: "Facebook",
        url: fiesta.enlaces.facebook
    }
];

enlaces.forEach(enlace => {

    if (!enlace.url) {
        return;
    }

    const elemento = document.createElement("a");

    elemento.href = enlace.url;
    elemento.textContent = enlace.nombre;
    elemento.target = "_blank";
    elemento.rel = "noopener noreferrer";

    contenedorEnlaces.appendChild(elemento);

});

document.querySelector(".fiesta-cabecera").style.backgroundImage =
    `url("${fiesta.imagen}")`;
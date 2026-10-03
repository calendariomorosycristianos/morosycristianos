const fiesta = {
    nombre: "Moros i Cristians i Contrabandistes",

    localidad: "La Font de la Figuera",

    provincia: "Valencia",

    fechaInicio: "5 diciembre",

    fechaFin: "8 diciembre",

    descripcion: "",

    actos: [],

    enlaces: {
        instagram: "",
        facebook: "",
        ayuntamiento: ""
    }
};

document.getElementById("nombre-fiesta").textContent = fiesta.nombre;

document.getElementById("localizacion-fiesta").textContent =
    `${fiesta.localidad} · ${fiesta.provincia}`;

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
    formatearFechas(fiesta.fechaInicio, fiesta.fechaFin);
const fiestas = [
    {
        localidad: "Alcoy",
        provincia: "Alicante",
        inicio: "21 abril",
        fin: "24 abril"
    },
    {
        localidad: "Villena",
        provincia: "Alicante",
        inicio: "1 mayo",
        fin: "5 mayo"
    },
    {
        localidad: "Bocairent",
        provincia: "Valencia",
        inicio: "8 mayo",
        fin: "11 mayo"
    },
    {
    localidad: "Alicante",
    provincia: "Alicante",
    inicio: "10 julio",
    fin: "14 julio"
},
];

const inputBusqueda = document.getElementById("busqueda");
const botonBuscar = document.getElementById("boton-buscar");
const resultadosBusqueda = document.getElementById("resultados-busqueda");

botonBuscar.addEventListener("click", () => {
    const texto = inputBusqueda.value.trim().toLowerCase();

    if (!texto) {
        resultadosBusqueda.textContent = "Escribe una localidad o fiesta.";
        return;
    }

   const resultados = fiestas.filter(fiesta =>
    fiesta.localidad.toLowerCase().includes(texto)
    );


    if (resultados.length === 0) {
        resultadosBusqueda.textContent = "No se han encontrado fiestas.";
        return;
    }

    resultadosBusqueda.innerHTML = resultados
        .map(fiesta => `
            <div>
                <strong>${fiesta.localidad}</strong>
                <span>${fiesta.provincia}</span>
                <span>${fiesta.inicio} — ${fiesta.fin}</span>
            </div>
        `)
        .join("");
});

function mostrarProximasFiestas() {
    const contenedor = document.getElementById("proximas-fiestas");
    const hoy = new Date();
    const añoActual = hoy.getFullYear();

    const proximas = fiestas
        .map(fiesta => {
            const partes = fiesta.inicio.split(" ");
            const dia = parseInt(partes[0]);

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

            let fecha = new Date(
                añoActual,
                meses[partes[1]],
                dia
            );

            if (fecha < hoy) {
                fecha = new Date(
                    añoActual + 1,
                    meses[partes[1]],
                    dia
                );
            }

            return {
                ...fiesta,
                fecha
            };
        })
        .sort((a, b) => a.fecha - b.fecha)
        .slice(0, 4);

    contenedor.innerHTML = proximas
        .map(fiesta => `
            <article class="tarjeta-fiesta">
                <p class="fecha">${fiesta.inicio} — ${fiesta.fin}</p>
                <h3>${fiesta.localidad}</h3>
                <p>${fiesta.provincia}</p>
                <a href="#">Ver fiesta →</a>
            </article>
        `)
        .join("");
}

mostrarProximasFiestas();


// BOTONES DEL CARRUSEL
const botonAnterior = document.getElementById("carrusel-anterior");
const botonSiguiente = document.getElementById("carrusel-siguiente");
const carrusel = document.getElementById("proximas-fiestas");

let posicionCarrusel = 0;

function actualizarCarrusel() {
    const tarjetas = carrusel.querySelectorAll(".tarjeta-fiesta");

    tarjetas.forEach((tarjeta, indice) => {
        tarjeta.classList.remove(
            "central",
            "izquierda",
            "derecha",
            "oculta"
        );

        let diferencia = indice - posicionCarrusel;

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
}

botonSiguiente.addEventListener("click", () => {
    const tarjetas = carrusel.querySelectorAll(".tarjeta-fiesta");

    posicionCarrusel++;

    if (posicionCarrusel >= tarjetas.length) {
        posicionCarrusel = 0;
    }

    actualizarCarrusel();
});

botonAnterior.addEventListener("click", () => {
    const tarjetas = carrusel.querySelectorAll(".tarjeta-fiesta");

    posicionCarrusel--;

    if (posicionCarrusel < 0) {
        posicionCarrusel = tarjetas.length - 1;
    }

    actualizarCarrusel();
});

actualizarCarrusel();
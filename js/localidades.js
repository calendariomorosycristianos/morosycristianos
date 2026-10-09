
Promise.all([
    fetch("datos/localidades.json").then(respuesta => {
        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar las localidades.");
        }
        return respuesta.json();
    }),
    fetch("datos/fiestas.json").then(respuesta => {
        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar las fiestas.");
        }
        return respuesta.json();
    })
])
    .then(([localidades, fiestas]) => {
        const contenedor = document.getElementById("lista-localidades");

        if (!contenedor) {
            throw new Error("No se encontró el contenedor del directorio.");
        }

        contenedor.replaceChildren();

        // Relacionar cada municipio con su nombre mediante el código INE.
        const nombresLocalidades = new Map(
            localidades.map(localidad => [
                String(localidad.ine),
                localidad.nombre
            ])
        );

        // Ordenar por localidad y después por nombre de fiesta.
        const fiestasOrdenadas = [...fiestas].sort((a, b) => {
            const localidadA = nombresLocalidades.get(String(a.ine)) || "";
            const localidadB = nombresLocalidades.get(String(b.ine)) || "";

            const comparacionLocalidad = localidadA.localeCompare(
                localidadB,
                "es",
                { sensitivity: "base" }
            );

            if (comparacionLocalidad !== 0) {
                return comparacionLocalidad;
            }

            return a.nombre.localeCompare(b.nombre, "es", {
                sensitivity: "base"
            });
        });

        // Agrupar las fiestas por la inicial de su localidad.
        const grupos = new Map();

        fiestasOrdenadas.forEach(fiesta => {
            const nombreLocalidad =
                nombresLocalidades.get(String(fiesta.ine));

            // Evitar mostrar fiestas cuyo municipio no existe en localidades.json.
            if (!nombreLocalidad) {
                console.warn(
                    "No se encontró la localidad de la fiesta:",
                    fiesta.id,
                    fiesta.ine
                );
                return;
            }

            const letra = nombreLocalidad
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .charAt(0)
                .toUpperCase();

            if (!grupos.has(letra)) {
                grupos.set(letra, []);
            }

            grupos.get(letra).push({
                ...fiesta,
                nombreLocalidad
            });
        });

        [...grupos.keys()]
            .sort((a, b) => a.localeCompare(b, "es"))
            .forEach(letra => {
                const grupo = document.createElement("section");
                grupo.classList.add("localidades-grupo");

                const titulo = document.createElement("h2");
                titulo.classList.add("localidades-letra");
                titulo.textContent = letra;

                grupo.appendChild(titulo);

                grupos.get(letra).forEach(fiesta => {
                    const tarjeta = document.createElement("a");

                    tarjeta.classList.add("localidad-tarjeta");
                    tarjeta.href =
                        `fiestas/fiesta.html?id=${encodeURIComponent(fiesta.id)}`;

                    const contenido = document.createElement("span");
                    contenido.classList.add("localidad-tarjeta-contenido");

                    const localidad = document.createElement("span");
                    localidad.classList.add("localidad-tarjeta-localidad");
                    localidad.textContent = fiesta.nombreLocalidad;

                    const nombreFiesta = document.createElement("span");
                    nombreFiesta.classList.add("localidad-tarjeta-fiesta");
                    nombreFiesta.textContent = fiesta.nombre;

                    contenido.append(localidad, nombreFiesta);

                    const flecha = document.createElement("span");
                    flecha.classList.add("localidad-tarjeta-flecha");
                    flecha.setAttribute("aria-hidden", "true");
                    flecha.textContent = "→";

                    tarjeta.append(contenido, flecha);
                    grupo.appendChild(tarjeta);
                });

                contenedor.appendChild(grupo);
            });
    })
    .catch(error => {
        console.error("Error al cargar el directorio:", error);

        const contenedor = document.getElementById("lista-localidades");

        if (contenedor) {
            contenedor.textContent =
                "No se ha podido cargar el directorio de localidades.";
        }
    });
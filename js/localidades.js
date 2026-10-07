fetch("datos/fiestas.json")
    .then(respuesta => respuesta.json())
    .then(fiestas => {

        const contenedor =
            document.getElementById("lista-localidades");

        const grupos = {};

        fiestas.forEach(fiesta => {

            const letra =
                fiesta.localidad.charAt(0).toUpperCase();

            if (!grupos[letra]) {
                grupos[letra] = [];
            }

            grupos[letra].push(fiesta);

        });

        Object.keys(grupos)
            .sort((a, b) => a.localeCompare(b, "es"))
            .forEach(letra => {

                const grupo =
                    document.createElement("div");

                grupo.classList.add("localidades-grupo");

                const titulo =
                    document.createElement("h2");

                titulo.classList.add("localidades-letra");

                titulo.textContent = letra;

                grupo.appendChild(titulo);

                grupos[letra]
                    .sort((a, b) =>
                        a.localidad.localeCompare(
                            b.localidad,
                            "es"
                        )
                    )
                    .forEach(fiesta => {

                        const enlace =
                            document.createElement("a");

                        enlace.href =
                            `fiestas/fiesta.html?id=${fiesta.id}`;

                        enlace.innerHTML = `
                            <span>
                                <strong>${fiesta.localidad}</strong>
                                ${fiesta.nombre}
                            </span>
                        `;

                        grupo.appendChild(enlace);

                    });

                contenedor.appendChild(grupo);

            });

    })
    .catch(error => {
        console.error(
            "Error al cargar las localidades:",
            error
        );
    });
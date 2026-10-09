/**

* Calcula una fecha según el día de la semana,
* el mes y la posición dentro de ese mes.
*
* diaSemana: domingo = 0, lunes = 1, ..., sábado = 6
* mes: enero = 1, ..., diciembre = 12
* posicion: 1 = primera aparición, 2 = segunda,
* 3 = tercera, 4 = cuarta, -1 = última aparición.
  */
  function calcularFechaRegla(reglaFecha, anio) {
  if (!reglaFecha || !Number.isInteger(anio)) {
  return null;
  }

  if (reglaFecha.tipo !== "dia_semana_mes") {
  return null;
  }

  const { diaSemana, mes, posicion } = reglaFecha;

  if (
  !Number.isInteger(diaSemana) ||
  diaSemana < 0 ||
  diaSemana > 6 ||
  !Number.isInteger(mes) ||
  mes < 1 ||
  mes > 12 ||
  !Number.isInteger(posicion) ||
  posicion === 0 ||
  posicion < -5 ||
  posicion > 5
  ) {
  return null;
  }

  let dia;

  if (posicion > 0) {
  const primerDia = new Date(anio, mes - 1, 1);
  const diferencia = (diaSemana - primerDia.getDay() + 7) % 7;

   dia = 1 + diferencia + (posicion - 1) * 7;

  } else {
  const ultimoDia = new Date(anio, mes, 0);
  const diferencia = (ultimoDia.getDay() - diaSemana + 7) % 7;

    dia = ultimoDia.getDate() - diferencia + (posicion + 1) * 7;

  }

  const diasDelMes = new Date(anio, mes, 0).getDate();

  if (dia < 1 || dia > diasDelMes) {
  return null;
  }

  const fecha = new Date(anio, mes - 1, dia);
  fecha.setHours(0, 0, 0, 0);

  return fecha;
  }

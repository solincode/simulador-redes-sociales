window.onload = function () {
  const roiSlider = document.getElementById("roi_deseado");
  const descuentoSlider = document.getElementById("descuento");
  const escenarioDescSlider = document.getElementById("escenario_descuento");

  roiSlider.oninput = () =>
    document.getElementById("roi_val").innerText = roiSlider.value + "%";
  descuentoSlider.oninput = () =>
    document.getElementById("descuento_val").innerText = descuentoSlider.value + "%";
  escenarioDescSlider.oninput = () =>
    document.getElementById("escenario_descuento_val").innerText = escenarioDescSlider.value + "%";

  document.getElementById("usar_escenario").onchange = function () {
    document.getElementById("escenario_box").style.display = this.checked ? "block" : "none";
  };

  window.calcularRentabilidad = function () {
    const get = id => parseFloat(document.getElementById(id).value) || 0;

    const datos = {
      renta: get("renta"),
      servicios: get("servicios"),
      permisos: get("permisos"),
      sueldos: get("sueldos"),
      impuestos: get("impuestos"),
      insumos: get("insumos"),
      mantencion: get("mantencion"),
      empaquetado: get("empaquetado"),
      capacitacion: get("capacitacion"),
      produccion: get("produccion"),
      promo: get("promo_unitario"),
      roi: get("roi_deseado") / 100,
      desc: get("descuento") / 100,
      usarEsc: document.getElementById("usar_escenario").checked,
      tipoEsc: document.getElementById("escenario_tipo").value,
      desc2p: get("escenario_descuento") / 100
    };

    const gastosFijos = datos.renta + datos.servicios + datos.permisos + datos.sueldos + datos.impuestos;
    const costosVar = datos.insumos + datos.mantencion + datos.empaquetado + datos.capacitacion;
    const costoUnit = (gastosFijos + costosVar) / datos.produccion;
    const costoTotal = costoUnit + datos.promo;
    const precioNormal = costoTotal * (1 + datos.roi);
    const precioConDescuento = precioNormal * (1 - datos.desc);

    let escenarios = [
      { nombre: "Precio normal", precio: precioNormal },
      { nombre: `Con ${Math.round(datos.desc * 100)}% de descuento`, precio: precioConDescuento }
    ];

    if (datos.usarEsc) {
      if (datos.tipoEsc === "2x1") {
        escenarios.push({ nombre: "2x1", precio: precioNormal / 2 });
      } else {
        const precioProm = (precioNormal + (precioNormal * (1 - datos.desc2p))) / 2;
        escenarios.push({ nombre: `2° producto con ${Math.round(datos.desc2p * 100)}% off`, precio: precioProm });
      }
    }

    const resultado = document.getElementById("resultado");
    resultado.innerHTML = "<h2>Resultados</h2>";

    escenarios.forEach(esc => {
      const margen = esc.precio - costoTotal;
      const rentable = margen > 0;
      const color = rentable ? "#d4edda" : "#f8d7da";
      const texto = rentable
        ? `Rentable: +$${margen.toFixed(2)}`
        : margen === 0
          ? "Punto de equilibrio"
          : `Pierdes: -$${Math.abs(margen).toFixed(2)}`;

      resultado.innerHTML += `
        <div style="border-radius:10px;padding:1rem;margin-bottom:1rem;background:${color}">
          <strong>${esc.nombre}</strong><br />
          Precio: $${esc.precio.toFixed(2)}<br />
          Costo: $${costoTotal.toFixed(2)}<br />
          Margen: $${margen.toFixed(2)}<br />
          ${texto}
        </div>
      `;
    });
  };
};


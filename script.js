function clamp_pct(val) {
  return Math.max(0, Math.min(val, 100));
}

function sugerir_mix(red) {
  const mixes = {
    Instagram: "70% Reels, 20% Carruseles, 10% Historias",
    Facebook: "60% Videos, 30% Posts con enlaces, 10% Imágenes",
    TikTok: "80% Videos cortos, 15% Videos largos, 5% Historias"
  };
  return mixes[red] || "Usa una combinación variada de formatos";
}

function recomendaciones_por_nicho(nicho, red) {
  const base = {
    Educativo: {
      Instagram: "Publica carruseles explicativos y Reels con tips. Aprovecha los guardados.",
      Facebook: "Crea posts largos con contenido útil y enlaces. Haz lives explicativos.",
      TikTok: "Enseña con humor o ejemplos rápidos. Usa subtítulos y voz en off."
    },
    "Producto/servicio": {
      Instagram: "Muestra beneficios del producto con Reels. Usa historias con stickers interactivos.",
      Facebook: "Haz promociones y publicaciones con llamadas a la acción. Muestra reseñas.",
      TikTok: "Haz videos con el producto en uso. Usa música viral."
    },
    Empresa: {
      Instagram: "Muestra el equipo y cultura laboral. Publica hitos en historias destacadas.",
      Facebook: "Comparte noticias, artículos, logros y enlaces al sitio web.",
      TikTok: "Haz videos mostrando procesos internos o testimonios."
    }
  };
  return base[nicho]?.[red] || "Usa formatos variados y analiza el desempeño cada semana.";
}

document.getElementById("btn-calcular").addEventListener("click", () => {
  const red = document.getElementById("red_social").value;
  const seguidores = parseInt(document.getElementById("seguidores").value);
  const alcance = parseInt(document.getElementById("alcance").value);
  const publicaciones = parseInt(document.getElementById("publicaciones").value);
  const likes = parseInt(document.getElementById("likes").value);
  const comentarios = parseInt(document.getElementById("comentarios").value);
  const guardados = parseInt(document.getElementById("guardados").value);
  const tipo = document.getElementById("tipo").value;
  const nicho = document.getElementById("nicho").value;

  const output = document.getElementById("output");
  output.innerHTML = "";

  if (alcance <= 0 || publicaciones <= 0 || seguidores <= 0) {
    output.innerHTML = "<p style='color:red;'>Por favor ingresa valores válidos mayores que cero para alcance, publicaciones y seguidores.</p>";
    return;
  }

  const er = clamp_pct(((likes + comentarios + guardados) / alcance) * 100);
  const seguidores_nuevos = Math.round((alcance * (er / 100)) * 0.1);
  const crecimiento_pct = clamp_pct((seguidores_nuevos / seguidores) * 100);
  const recomendaciones = recomendaciones_por_nicho(nicho, red);
  const mix = sugerir_mix(red);

  output.innerHTML = `
    <div class="recomendacion">
      <p><strong>Engagement Rate (ER):</strong> ${er.toFixed(2)}%</p>
      <p><strong>Seguidores nuevos estimados:</strong> ${seguidores_nuevos}</p>
      <p><strong>Crecimiento estimado:</strong> ${crecimiento_pct.toFixed(2)}%</p>
      <p><strong>Mix de formatos sugerido:</strong> ${mix}</p>
      <p><strong>Recomendación personalizada:</strong> ${recomendaciones}</p>
    </div>
  `;
});


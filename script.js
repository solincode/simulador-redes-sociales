// Constantes
const ER_CAP = 15;
const MIN_REACH_POST = 500;
const IG_ER_PROM = 0.65;
const FB_ER_LOW = 0.03, FB_ER_MID = 0.08, FB_ER_HIGH = 0.12;

// Recomendaciones por nicho
const RECOM_X_NICHO = { /* … copia del diccionario del Python … */ };
const MIX_FORMATOS = { /* … igual que en Python … */ };
const MIX_OVERRIDE_NICHO = { /* … igual que en Python … */ };

// Ayudas
function clampPct(x) { return Math.max(0, Math.min(x, 100)); }
function pluralize(nombre, n) {
  const map = { Reels:'Reel', Videos:'Video', Historias:'Historia', Imágenes:'Imagen',
    Carruseles:'Carrusel', 'Posts con enlaces':'Post con enlace',
    'Videos cortos':'Video corto','Videos largos':'Video largo','Eventos':'Evento'};
  return n===1 ? (map[nombre]||nombre) : nombre;
}
function mixToHTMLList(mix) {
  return Object.entries(mix).map(([k,v]) =>
    `<li>${v} ${pluralize(k,v)}</li>`
  ).join('');
}
function sugerirMix(red, tema, postsSem, formatosDisponibles) {
  const base = {...MIX_FORMATOS[red].base};
  const ov = MIX_OVERRIDE_NICHO[tema.toLowerCase()];
  if (ov) Object.assign(base, ov);
  let total = Object.values(base).reduce((a,b)=>a+b,0);
  Object.keys(base).forEach(k=> base[k] = base[k]/total);
  let restantes = postsSem;
  const plan = {};
  const entries = Object.entries(base).sort((a,b)=>b[1]-a[1]);
  entries.forEach(( [formato,pct], i) => {
    if (!formatosDisponibles.includes(formato)) return;
    if (i === entries.length-1) plan[formato] = restantes;
    else {
      const n = Math.round(postsSem * pct);
      plan[formato] = n; restantes -= n;
    }
  });
  return Object.fromEntries(Object.entries(plan).filter(([k,v])=>v>0 && formatosDisponibles.includes(k)));
}
function recomendacionesPorNicho(tema, tipoUsuario, postsSem) {
  const data = RECOM_X_NICHO[tema.toLowerCase()];
  if (!data) return [];
  const tips = [];
  const top = data.top || [], evitar = data.evitar || [];
  const [lo, hi] = data.freq||[0,999];
  if (evitar.includes(tipoUsuario)) {
    tips.push(`${tipoUsuario} rinde peor en ${tema}. Úsalo solo con objetivo claro.`);
  } else if (top.includes(tipoUsuario)) {
    const pos = top.indexOf(tipoUsuario) + 1;
    tips.push(`Excelente: ${tipoUsuario} es el formato Nº${pos} en ${tema}. Priorízalo.`);
  } else {
    tips.push(`Para ${tema} funcionan mejor: ${top.join(', ')}.`);
  }
  if (evitar.length) tips.push(`No abuses de: ${evitar.join(', ')}.`);
  if (postsSem < lo) tips.push(`Publicas poco para ${tema}. Recomiendo ${lo}-${hi} posts/sem.`);
  else if (postsSem > hi) tips.push(`Publicas de más. En ${tema} suele bastar ${lo}-${hi} posts/sem.`);
  if (data.why) tips.push(data.why);
  return tips;
}

// Render formulario basado en red social
function updateForm() {
  const cont = document.getElementById('formulario');
  cont.innerHTML = '';
  const red = document.getElementById('red_social').value;

  const fields = [
    {id:'seguidores_actuales', label:'Seguidores actuales:', type:'number', value:1000},
    {id:'alcance_semanal', label:'Alcance semanal promedio:', type:'number', value:2000},
    {id:'publicaciones_semanales', label:'Posts/semana:', type:'number', value:3, min:0, max:14},
    {id:'likes_promedio', label:'Likes promedio/post:', type:'number', value:150},
    {id:'comentarios_promedio', label:'Comentarios promedio/post:', type:'number', value:20},
    {id:'guardados_promedio', label:'Guardados promedio/post:', type:'number', value:10}
  ];

  fields.forEach(f => {
    const div = document.createElement('div'); div.className = 'custom-box';
    const lbl = document.createElement('label'); lbl.textContent = f.label;
    const inp = document.createElement('input');
    inp.type = f.type;
    inp.id = f.id;
    inp.value = f.value;
    if (f.min!==undefined) inp.min = f.min;
    if (f.max!==undefined) inp.max = f.max;
    div.append(lbl, inp);
    cont.append(div);
  });

  // Dropdown tipo contenido
  let opcionesTipo = [];
  if (red === 'Instagram') opcionesTipo = ["Reels","Carruseles","Historias","Imágenes"];
  else if (red === 'TikTok') opcionesTipo = ["Videos cortos","Videos largos","Historias","Carruseles"];
  else opcionesTipo = ["Videos","Imágenes","Historias","Eventos","Posts con enlaces"];
  const tipoDiv = document.createElement('div'); tipoDiv.className='custom-box';
  const tipoLbl = document.createElement('label'); tipoLbl.textContent = 'Tipo de contenido:';
  const tipoSel = document.createElement('select'); tipoSel.id='tipo_contenido';
  opcionesTipo.forEach(o=>{
    const opt = document.createElement('option'); opt.textContent = o;
    tipoSel.append(opt);
  });
  tipoDiv.append(tipoLbl, tipoSel);
  cont.append(tipoDiv);

  // Nicho
  const nichoDiv = document.createElement('div'); nichoDiv.className='custom-box';
  const nichoLbl = document.createElement('label'); nichoLbl.textContent = 'Nicho:';
  const nichoSel = document.createElement('select'); nichoSel.id='nicho';
  ["Educativo","Entretenimiento","Producto/servicio","Salud/Bienestar","Lifestyle","Influencer","Tienda de comida","Empresa","Emprendimiento"]
    .forEach(o=> {
      const opt = document.createElement('option'); opt.textContent = o;
      nichoSel.append(opt);
    });
  nichoDiv.append(nichoLbl, nichoSel);
  cont.append(nichoDiv);

  if (red === 'Instagram'){
    ['Compartidos/post (IG opcional):','DMs/semana (IG opcional):'].forEach((txt,id) => {
      const div = document.createElement('div'); div.className='custom-box';
      const lbl = document.createElement('label'); lbl.textContent = txt;
      const inp = document.createElement('input'); inp.type='number';
      inp.id = id===0 ? 'compartidos_promedio' : 'mensajes_promedio';
      inp.value = 0;
      div.append(lbl, inp);
      cont.append(div);
    });
  }
}

document.getElementById('red_social').addEventListener('change', updateForm);
document.addEventListener('DOMContentLoaded', updateForm);

// Cálculo
document.getElementById('btnCalcular').addEventListener('click', () => {
  const red = document.getElementById('red_social').value;
  const vals = {};
  ['seguidores_actuales','alcance_semanal','publicaciones_semanales','likes_promedio',
   'comentarios_promedio','guardados_promedio','tipo_contenido','nicho','compartidos_promedio','mensajes_promedio']
    .forEach(id => {
      const el = document.getElementById(id);
      vals[id] = el ? (el.type==='number' ? Number(el.value) : el.value) : 0;
    });

  // Decide función según red
  if (red === 'Instagram') calcularInstagram(vals);
  else if (red === 'Facebook') calcularFacebook(vals);
  else if (red === 'TikTok') calcularTikTok(vals);
});

function calcularInstagram(vals) {
  const {
    seguidores_actuales: seguidores,
    alcance_semanal: alcance_sem,
    publicaciones_semanales: publicaciones,
    likes_promedio: likes,
    comentarios_promedio: comentarios,
    guardados_promedio: guardados,
    tipo_contenido: tipo,
    nicho: tema,
    compartidos_promedio: shares = 0,
    mensajes_promedio: mensajes_dm = 0
  } = vals;

  const publicaciones_num = publicaciones || 1;
  const alcance_post_real = Math.max(alcance_sem / publicaciones_num, MIN_REACH_POST);
  const inter_post = likes + comentarios + guardados;
  const inter_sem = inter_post * publicaciones_num;
  const er_sem = (inter_sem / Math.max(alcance_sem,1)) * 100;
  const er_eff = Math.min(er_sem, ER_CAP);

  const tasa_guardado = clampPct( (guardados / alcance_post_real * 100) );
  const tasa_viralidad = clampPct( (shares / alcance_post_real * 100) );
  const dms_pct = clampPct( (mensajes_dm / alcance_sem * 100) );

  // recomendaciones inputs simples (error/warn)
  const errores = [], warns = [];
  if (alcance_sem < 1) errores.push("El alcance debe ser ≥ 1");
  else if (alcance_sem < 100) warns.push("Alcance muy bajo (<100). Métricas poco representativas.");
  if (er_sem > 30) warns.push("ER > 30%. Revisa datos: alcance muy bajo o interacciones mal ingresadas.");
  if (seguidores < 0 || alcance_sem<0 || publicaciones_num<0) errores.push("Valores no pueden ser negativos");

  if (errores.length) {
    document.getElementById('output').innerHTML = `<div style="font-family:Montserrat; border:2px solid #ff4d4f; padding:18px; border-radius:12px; max-width:600px;">
      <h3 style="color:#ff4d4f;">Corrige estos errores</h3><ul>${errores.map(e=>`<li>${e}</li>`).join('')}</ul></div>`;
    return;
  }

  const audiencia_nueva = alcance_sem * 0.60;
  let tasa_follow_base;
  if (tipo === "Reels") {
    if (er_eff > 8) tasa_follow_base = 0.015;
    else if (er_eff > 4) tasa_follow_base = 0.010;
    else tasa_follow_base = 0.004;
  } else if (tipo === "Carruseles") tasa_follow_base = 0.007;
  else if (tipo === "Historias") tasa_follow_base = 0.004;
  else tasa_follow_base = 0.003;

  const ajuste = {"educativo":1.2,"producto/servicio":1.1,"emprendimiento":1.0,"empresa":0.95,"lifestyle":1.05,"influencer":1.15};
  let tasa_follow = tasa_follow_base * (ajuste[tema.toLowerCase()]||1);
  if (publicaciones_num > 7) tasa_follow *= 0.75;
  if (er_sem > 0) tasa_follow *= (er_eff / er_sem);

  const seguidores_nuevos_sem = audiencia_nueva * tasa_follow;
  const seguidores_fin_mes = Math.round(seguidores + seguidores_nuevos_sem * 4);
  const growth_pct = seguidores ? ((seguidores_fin_mes - seguidores) / seguidores * 100) : 0;
  const seguidores_nuevos_post = seguidores_nuevos_sem / publicaciones_num;

  // recomendaciones
  const recomendaciones = [...warns];
  if (er_eff < 0.8) recomendaciones.push(`ER/sem ${er_eff.toFixed(2)}% < prom. IG (~${IG_ER_PROM}%). Mejora hook/valor.`);
  else if (er_eff < 3) recomendaciones.push("ER moderado. Prueba CTAs claros y storytelling emocional.");
  else if (er_eff >= 5) recomendaciones.push("Top (>5%). Escala con colaboraciones o Ads ligeros.");

  if (er_eff > 8 && seguidores < 10000) recomendaciones.push("Colabora con nano/microcreadores (ROI alto).");
  if (tipo === "Reels" && er_eff < 3) recomendaciones.push("Reels: gancho fuerte en los primeros 3 segundos.");
  if (tasa_viralidad > 4) recomendaciones.push("Viralidad alta. Duplica ese formato con CTA a compartir.");
  if (tasa_guardado >= (likes/alcance_post_real*100)) recomendaciones.push("Muchos guardados: empaqueta tips en guía/lead magnet.");
  if (dms_pct > 0.5) recomendaciones.push("Muchos DMs: automatiza respuestas, promo exclusiva por DM.");
  if (growth_pct < 3) recomendaciones.push("Crecimiento lento. Aumenta frecuencia o formatos top del nicho.");
  else if (growth_pct >= 15) recomendaciones.push("Creces rápido. Activa remarketing y retos para fidelizar.");

  if (["producto/servicio","tienda de comida"].includes(tema.toLowerCase())) {
    recomendaciones.push("Activa IG Shop/etiquetado de productos.");
  }

  const recs_nicho = recomendacionesPorNicho(tema, tipo, publicaciones_num);
  recomendaciones.push(...recs_nicho);

  const formatos_disp = ["Reels","Carruseles","Historias","Imágenes"];
  const mix = sugerirMix("Instagram", tema, publicaciones_num, formatos_disp);
  const mix_html = mixToHTMLList(mix);
  recomendaciones.push(`Mix recomendado:<ul style="margin-top:4px">${mix_html}</ul>`);

  const cumple = RECOM_X_NICHO[tema.toLowerCase()]?.top.includes(tipo) ? "Sí" : "No";

  const html = `
    <div class="result-box" style="background:linear-gradient(135deg,#f8faff,#ffffff); border:2px solid #dd2a7b; box-shadow:0 8px 20px rgba(221,42,123,0.1);">
      <h3 style="color:#dd2a7b;">Proyección de Crecimiento en Instagram</h3>
      <p><strong>ER (semana usado):</strong> ${er_eff.toFixed(2)}% (real: ${er_sem.toFixed(2)}%, prom. IG ~${IG_ER_PROM}%)<br>
         <strong>Tasa de viralidad:</strong> ${tasa_viralidad.toFixed(2)}%<br>
         <strong>Tasa de guardado:</strong> ${tasa_guardado.toFixed(2)}%<br>
         <strong>DMs por alcance:</strong> ${dms_pct.toFixed(2)}%<br>
         <strong>Tasa follow aplicada:</strong> ${(tasa_follow*100).toFixed(2)}%</p>
      <ul>
        <li><strong>+${Math.round(seguidores_nuevos_sem).toLocaleString()}</strong> seguidores nuevos por semana</li>
        <li><strong>${seguidores_fin_mes.toLocaleString()}</strong> seguidores al final del mes</li>
        <li><strong>${growth_pct.toFixed(1)}%</strong> crecimiento mensual</li>
        <li><strong>Seguidores nuevos/post:</strong> ${Math.round(seguidores_nuevos_post).toLocaleString()}</li>
      </ul>
      <p><strong>¿Tu estrategia actual coincide con el estudio del nicho?</strong> ${cumple}</p>
      <hr>
      <p><strong>Recomendaciones personalizadas:</strong></p>
      <ul>${recomendaciones.map(r=>`<li>${r}</li>`).join('')}</ul>
    </div>`;
  document.getElementById('output').innerHTML = html;
}
// ────────── Instagram ──────────
function calcularInstagram(vals) {
  // (La función de Instagram ya te la pasé antes...)
  // Asegúrate de incluirla completa aquí.
}

// ────────── Facebook ──────────
function calcularFacebook(vals) {
  const {
    seguidores_actuales: seguidores,
    alcance_semanal: alcance,
    publicaciones_semanales: publicaciones,
    likes_promedio: likes,
    comentarios_promedio: comentarios,
    guardados_promedio: guardados,
    tipo_contenido: tipo,
    nicho: tema
  } = vals;
  const publicaciones_num = publicaciones || 1;
  const total_interacciones_post = likes + comentarios + guardados;
  const alcance_post = Math.max(alcance / publicaciones_num, 1);
  const engagement_rate = clampPct( (total_interacciones_post * publicaciones_num / Math.max(alcance,1)) * 100 );
  const compartidos_estimados = total_interacciones_post * 0.2;
  const audiencia_nueva = alcance * 0.45 + compartidos_estimados * 5;

  const errores = [], warns = [];
  if (alcance < 1) errores.push("El alcance debe ser ≥ 1");
  else if (alcance < 100) warns.push("Alcance muy bajo (<100). Métricas poco representativas.");
  if (engagement_rate > 100) warns.push("ER muy alto: revisión necesaria.");
  if (seguidores < 0 || alcance<0 || publicaciones_num<0) errores.push("Valores no pueden ser negativos");
  if (errores.length) {
    document.getElementById('output').innerHTML = `<div style="font-family:Montserrat; border:2px solid #ff4d4f; padding:18px; border-radius:12px; max-width:600px;">
      <h3 style="color:#ff4d4f;">Corrige estos errores</h3><ul>${errores.map(e=>`<li>${e}</li>`).join('')}</ul></div>`;
    return;
  }

  let tasa_conversion;
  if (tipo === "Videos") {
    tasa_conversion = engagement_rate > 5 ? 0.010 :
                      engagement_rate > 2 ? 0.006 : 0.003;
  } else if (tipo === "Posts con enlaces") tasa_conversion = 0.004;
  else if (tipo === "Historias") tasa_conversion = 0.002;
  else if (tipo === "Eventos") tasa_conversion = 0.005;
  else tasa_conversion = 0.0025;

  const ajuste = {"empresa":1.1,"influencer":0.9,"emprendimiento":1.0,"tienda de comida":1.3,"producto/servicio":1.2};
  tasa_conversion *= (ajuste[tema.toLowerCase()]||1);
  if (publicaciones_num > 7) tasa_conversion *= 0.75;

  const seguidores_nuevos_sem = audiencia_nueva * tasa_conversion;
  const seguidores_proyectados_1m = Math.round(seguidores + seguidores_nuevos_sem * 4);
  const alcance_mensual = Math.round(alcance * 4);
  const growth_pct = seguidores ? ((seguidores_proyectados_1m - seguidores) / seguidores * 100) : 0;
  const tasa_viralidad_fb = clampPct((compartidos_estimados / alcance_post) * 100);
  const tasa_click = engagement_rate > 3 ? 0.012 :
                     tipo === "Posts con enlaces" ? 0.007 : 0;
  const clics_estimados = Math.round(alcance * tasa_click);
  const retencion = engagement_rate < FB_ER_LOW ? 0.3 :
                    engagement_rate < FB_ER_MID ? 0.45 :
                    engagement_rate < FB_ER_HIGH ? 0.6 : 0.75;
  const seguidores_reales_nuevos = Math.round(seguidores_nuevos_sem * retencion);

  const recomendaciones = [...warns];
  if (engagement_rate < FB_ER_LOW) recomendaciones.push(`ER ${engagement_rate.toFixed(3)}% (<0.03%). Mejora calidad, evita links solos.`);
  else if (engagement_rate < FB_ER_MID) recomendaciones.push("Rango medio (0.03–0.08%). Prueba álbumes/video nativo + subtítulos.");
  else if (engagement_rate >= FB_ER_HIGH) recomendaciones.push("ER alto (>0.12%). Mantén consistencia y fomenta UGC/grupos.");
  if (publicaciones_num === 0) recomendaciones.push("No estás publicando. Al menos 2 posts/sem.");
  else if (publicaciones_num < 2) recomendaciones.push("Publica mínimo 3 veces/sem para mantener presencia.");
  else if (publicaciones_num > 7) recomendaciones.push("Postear diario puede saturar. Calidad > cantidad.");
  if (tipo === "Videos") recomendaciones.push("Video nativo vertical con audio aumenta conversiones ~12%.");
  if (tipo === "Imágenes") recomendaciones.push("Álbumes 5–10 fotos → mayor ER (~0.15%).");
  if (tipo === "Posts con enlaces") recomendaciones.push("Acompaña links con resumen visual.");
  if (tipo === "Eventos") recomendaciones.push("Usa eventos para urgencia y recordatorios.");
  if (comentarios < likes * 0.05) recomendaciones.push("Incentiva comentarios con preguntas directas/debates.");
  if (likes < seguidores * 0.02) recomendaciones.push("Revisa claridad del mensaje, diseño y horario.");
  if (engagement_rate > 5 && tasa_conversion < 0.003) recomendaciones.push("Mucha atención, poca acción: añade CTA claro.");
  if (["producto/servicio","tienda de comida","empresa"].includes(tema.toLowerCase())) recomendaciones.push("Usa Marketplace/Catálogo: 60% descubre productos en FB.");

  recomendaciones.push(...recomendacionesPorNicho(tema, tipo, publicaciones_num));
  const formatos_disp = ["Videos","Imágenes","Historias","Eventos","Posts con enlaces"];
  const mix = sugerirMix("Facebook", tema, publicaciones_num, formatos_disp);
  const mix_html = mixToHTMLList(mix);
  recomendaciones.push(`Mix recomendado:<ul style="margin-top:4px">${mix_html}</ul>`);
  const cumple = RECOM_X_NICHO[tema.toLowerCase()]?.top.includes(tipo) ? "Sí" : "No";

  const html = `
    <div class="result-box" style="background:linear-gradient(135deg,#eef5ff,#ffffff); border:2px solid #1877f2; box-shadow:0 8px 20px rgba(24,119,242,0.1);">
      <h3 style="color:#1877f2;">Proyección de Crecimiento en Facebook</h3>
      <p><strong>ER (semana):</strong> ${engagement_rate.toFixed(3)}% (mediana ~0.015%, prom. ~0.063%)</p>
      <ul>
        <li><strong>+${Math.round(seguidores_nuevos_sem).toLocaleString()}</strong> seguidores por semana</li>
        <li><strong>${seguidores_proyectados_1m.toLocaleString()}</strong> seguidores al final del mes</li>
        <li><strong>${growth_pct.toFixed(1)}%</strong> crecimiento mensual</li>
        <li><strong>Alcance mensual estimado:</strong> ${alcance_mensual.toLocaleString()}</li>
        <li><strong>Seguidores nuevos retenidos:</strong> ${seguidores_reales_nuevos}</li>
        <li><strong>Tasa conversión aplicada:</strong> ${(tasa_conversion*100).toFixed(2)}%</li>
        <li><strong>Compartidos estimados:</strong> ${Math.round(compartidos_estimados)}</li>
        <li><strong>Tasa de viralidad:</strong> ${tasa_viralidad_fb.toFixed(2)}%</li>
        <li><strong>Seguidores por Ads ($50):</strong> +${Math.round(50/0.5)}</li>
        <li><strong>Clics estimados:</strong> ${clics_estimados}</li>
      </ul>
      <p><strong>¿Tu estrategia actual coincide con el estudio del nicho?</strong> ${cumple}</p>
      <hr>
      <p><strong>Recomendaciones personalizadas:</strong></p>
      <ul>${recomendaciones.map(r=>`<li>${r}</li>`).join('')}</ul>
    </div>`;
  document.getElementById('output').innerHTML = html;
}

// ────────── TikTok ──────────
function calcularTikTok(vals) {
  const {
    seguidores_actuales: seguidores,
    alcance_semanal: alcance,
    publicaciones_semanales: publicaciones,
    likes_promedio: likes,
    comentarios_promedio: comentarios,
    guardados_promedio: guardados,
    tipo_contenido: tipo,
    nicho: tema
  } = vals;
  const publicaciones_num = publicaciones || 1;
  const total_interacciones_post = likes + comentarios + guardados;
  const inter_sem = total_interacciones_post * publicaciones_num;
  const engagement_rate = clampPct((inter_sem / Math.max(alcance,1)) * 100);
  const inter_por_segundo = publicaciones_num > 0 ? total_interacciones_post / (publicaciones_num * 15) : 0;
  const uso_sonido = tipo === "Videos cortos" || tipo === "Videos largos";
  const watch_time = inter_por_segundo * 7;
  let retencion_estimada = Math.min(watch_time / 15, 1.0);
  retencion_estimada = clampPct(retencion_estimada * 100) / 100;

  let tasa_viralidad = 0;
  if (engagement_rate > 10) tasa_viralidad += 0.05;
  if (uso_sonido) tasa_viralidad += 0.03;
  if (inter_por_segundo > 1.2) tasa_viralidad += 0.04;
  tasa_viralidad = clampPct(tasa_viralidad * 100) / 100;

  let base_conv = 0.002;
  if (inter_por_segundo > 1) base_conv += 0.003;
  else if (inter_por_segundo > 0.5) base_conv += 0.0015;
  if (engagement_rate > 8) base_conv += 0.002;
  if (uso_sonido) base_conv += 0.002;
  if (publicaciones_num > 7) base_conv *= 0.85;
  const ajuste = {"influencer":1.3,"entretenimiento":1.2,"educativo":1.0,
                  "empresa":0.9,"tienda de comida":1.1,"producto/servicio":1.0};
  base_conv *= (ajuste[tema.toLowerCase()]||1);

  const errores = [], warns = [];
  if (alcance < 1) errores.push("El alcance debe ser ≥ 1");
  else if (alcance < 100) warns.push("Alcance muy bajo (<100). Métricas poco representativas.");
  if (engagement_rate > 100) warns.push("ER muy alto: revisar.");
  if (seguidores < 0 || alcance<0 || publicaciones_num<0) errores.push("Valores no pueden ser negativos");
  if (errores.length) {
    document.getElementById('output').innerHTML = `<div style="font-family:Montserrat; border:2px solid #ff4d4f; padding:18px; border-radius:12px; max-width:600px;">
      <h3 style="color:#ff4d4f;">Corrige estos errores</h3><ul>${errores.map(e=>`<li>${e}</li>`).join('')}</ul></div>`;
    return;
  }

  const audiencia_nueva = alcance * 0.7;
  const seguidores_nuevos_sem = audiencia_nueva * base_conv;
  const seguidores_proyectados_1m = Math.round(seguidores + seguidores_nuevos_sem * 4);
  const growth_pct = seguidores ? ((seguidores_proyectados_1m - seguidores) / seguidores * 100) : 0;
  const alcance_mensual = Math.round(alcance * 4);
  const eficiencia_video = publicaciones_num > 0 ? seguidores_nuevos_sem / publicaciones_num : 0;
  const ratio = alcance > 0 ? seguidores / alcance : 0;
  const clics_estimados = Math.round(alcance * 0.008);

  const recomendaciones = [...warns];
  if (publicaciones_num === 0) recomendaciones.push("TikTok premia consistencia. Publica al menos 3 veces por semana.");
  else if (publicaciones_num > 10) recomendaciones.push("Publicar demasiado puede bajar retención. Calidad > cantidad.");
  if (tipo === "Videos cortos") recomendaciones.push("Videos <15s retienen mejor. Texto en pantalla + ritmo rápido.");
  if (tipo === "Videos largos") recomendaciones.push("Cuenta historias/tutoriales; mantén curiosidad hasta el final.");
  if (inter_por_segundo < 0.3) recomendaciones.push("Mejora ganchos iniciales (primeros 3 s).");
  if (engagement_rate < 2) recomendaciones.push("ER bajo. Revisa hook o nicho demasiado amplio.");
  if (engagement_rate > 10) recomendaciones.push("ER excelente. Aprovecha colaboraciones o retos.");
  if (base_conv < 0.004) recomendaciones.push("Muchas vistas, poca conversión. Termina con 'sígueme para más'.");
  if (growth_pct >= 15) recomendaciones.push("⚡ Creces rápido. Refuerza comunidad (lives/comentarios fijados).");
  recomendaciones.push(...recomendacionesPorNicho(tema, tipo, publicaciones_num));

  const formatos_disp = ["Videos cortos","Videos largos","Historias","Carruseles"];
  const mix = sugerirMix("TikTok", tema, publicaciones_num, formatos_disp);
  const mix_html = mixToHTMLList(mix);
  recomendaciones.push(`Mix recomendado:<ul style="margin-top:4px">${mix_html}</ul>`);
  const cumple = RECOM_X_NICHO[tema.toLowerCase()]?.top.includes(tipo) ? "Sí" : "No";

  const html = `
    <div class="result-box" style="background:linear-gradient(135deg,#fef9ff,#ffffff); border:2px solid #ee1d52; box-shadow:0 8px 20px rgba(238,29,82,0.1);">
      <h3 style="color:#ee1d52;">Proyección de Crecimiento en TikTok</h3>
      <p><strong>ER (semana):</strong> ${engagement_rate.toFixed(2)}%<br>
         <strong>Interacciones/s:</strong> ${inter_por_segundo.toFixed(2)}<br>
         <strong>Watch time promedio:</strong> ${watch_time.toFixed(2)} s<br>
         <strong>Retención estimada:</strong> ${(retencion_estimada*100).toFixed(1)}%<br>
         <strong>Tasa viralidad:</strong> ${(tasa_viralidad*100).toFixed(2)}%<br>
         <strong>Tasa conversión aplicada:</strong> ${(base_conv*100).toFixed(2)}%<br>
         <strong>Ratio seguidores/alcance:</strong> ${ratio.toFixed(3)}<br>
         <strong>Clics estimados:</strong> ${clics_estimados}</p>
      <ul>
        <li><strong>+${Math.round(seguidores_nuevos_sem).toLocaleString()}</strong> seguidores por semana</li>
        <li><strong>${seguidores_proyectados_1m.toLocaleString()}</strong> seguidores al final del mes</li>
        <li><strong>${growth_pct.toFixed(1)}%</strong> crecimiento mensual</li>
        <li><strong>Alcance mensual estimado:</strong> ${alcance_mensual.toLocaleString()} visualizaciones</li>
        <li><strong>Eficiencia/video:</strong> ${eficiencia_video.toFixed(1)} seguidores</li>
      </ul>
      <p><strong>¿Tu estrategia actual coincide con el estudio del nicho?</strong> ${cumple}</p>
      <hr>
      <p><strong>Recomendaciones personalizadas:</strong></p>
      <ul>${recomendaciones.map(r=>`<li>${r}</li>`).join('')}</ul>
    </div>`;
  document.getElementById('output').innerHTML = html;
}
// ─── Constantes globales ───
const ER_CAP = 15;
const MIN_REACH_POST = 500;
const IG_ER_PROM = 0.65;
const FB_ER_LOW = 0.03, FB_ER_MID = 0.08, FB_ER_HIGH = 0.12;

// Benchmark por nicho
const RECOM_X_NICHO = {
  educativo: { top:["Carruseles","Reels","Videos cortos"], evitar:["Historias sin CTA"], freq:[3,7], why:"Carruseles/infografías generan muchos guardados; los Reels condensan tips en 60–90 s con alta retención." },
  empresa: { top:["Videos","Carruseles","Posts con enlaces"], evitar:["Historias sin objetivo","Imágenes sueltas"], freq:[3,6], why:"Videos nativos y subtitulados elevan interacción; los enlaces llevan a recursos o landings." },
  "producto/servicio": { top:["Reels","Videos","Historias con venta"], evitar:[], freq:[4,7], why:"Short‑form video muestra el uso y convierte rápido; historias sirven para ofertas flash." },
  "tienda de comida": { top:["Reels","Videos cortos","Historias con promos"], evitar:[], freq:[4,10], why:"El ‘food porn’ en video corto funciona excelente; historias para cupones y urgencia." },
  influencer: { top:["Reels","Historias","Videos cortos"], evitar:["Posts con mucho texto"], freq:[5,14], why:"Contenido raw y frecuente crea cercanía; narrativas tipo GRWM retienen." },
  lifestyle: { top:["Reels","Historias","Videos cortos"], evitar:[], freq:[5,10], why:"Storytelling corto impulsa compras impulsivas; la autenticidad pesa más que el pulido." },
  emprendimiento: { top:["Carruseles","Reels","Historias educativas"], evitar:[], freq:[3,7], why:"Carruseles lideran interacciones; Reels para humanizar procesos del founder." },
  "salud/bienestar": { top:["Carruseles","Reels educativos","Lives cortos"], evitar:[], freq:[3,6], why:"Listas/checklists generan guardados; lives resuelven dudas en tiempo real." },
  entretenimiento: { top:["Videos cortos","Reels","Formatos serializados"], evitar:[], freq:[5,14], why:"El ocio se consume en short‑form; series (parte 1/2/3) maximizan retención." }
};

const MIX_FORMATOS = {
  Instagram: { base:{Reels:0.45, Carruseles:0.30, Historias:0.20, Imágenes:0.05} },
  Facebook: { base:{Videos:0.35, Imágenes:0.25, "Posts con enlaces":0.20, Historias:0.10, Eventos:0.10} },
  TikTok: { base:{"Videos cortos":0.60, "Videos largos":0.25, Historias:0.10, Carruseles:0.05} }
};

const MIX_OVERRIDE_NICHO = {
  educativo:{Carruseles:0.40, Reels:0.35},
  empresa:{Videos:0.40, "Posts con enlaces":0.25, Imágenes:0.25},
  "producto/servicio":{Reels:0.50, Historias:0.25},
  "tienda de comida":{Reels:0.55, "Videos cortos":0.30},
  influencer:{Reels:0.55, Historias:0.30},
  lifestyle:{Reels:0.55, Historias:0.25},
  emprendimiento:{Carruseles:0.38, Reels:0.32},
  "salud/bienestar":{Carruseles:0.35, "Reels educativos":0.35},
  entretenimiento:{"Videos cortos":0.65, Reels:0.25}
};

// ─── Helpers ───
function clampPct(x) { return Math.max(0, Math.min(x, 100)); }

function pluralize(nombre, n) {
  const map = { Reels:'Reel', Videos:'Video', Historias:'Historia', Imágenes:'Imagen',
    Carruseles:'Carrusel', "Posts con enlaces":'Post con enlace',
    "Videos cortos":'Video corto', "Videos largos":'Video largo', Eventos:'Evento' };
  return n === 1 ? (map[nombre] || nombre) : nombre;
}

function mixToHTMLList(mix) {
  return Object.entries(mix)
    .map(([k,v])=>`<li>${v} ${pluralize(k,v)}</li>`)
    .join('');
}

function sugerirMix(red, tema, postsSem, formatosDisponibles) {
  let mix = { ...MIX_FORMATOS[red].base };
  const ov = MIX_OVERRIDE_NICHO[tema.toLowerCase()];
  if (ov) Object.assign(mix, ov);
  const total = Object.values(mix).reduce((a,b)=>a+b, 0);
  Object.keys(mix).forEach(k => mix[k] = mix[k]/total);
  let restantes = postsSem, plan = {};
  Object.entries(mix)
    .sort((a,b)=>b[1]-a[1])
    .forEach(([formato,pct], i, arr) => {
      if (!formatosDisponibles.includes(formato)) return;
      if (i === arr.length - 1) plan[formato] = restantes;
      else {
        const n = Math.round(postsSem * pct);
        plan[formato] = n; restantes -= n;
      }
    });
  return Object.fromEntries(Object.entries(plan).filter(([k,v])=>v>0 && formatosDisponibles.includes(k)));
}

function recomendacionesPorNicho(tema, tipoUsuario, postsSem) {
  const data = RECOM_X_NICHO[tema.toLowerCase()];
  if (!data) return [];
  const tips = [];
  const top = data.top || [], evitar = data.evitar || [];
  const [lo, hi] = data.freq || [0,999];
  if (evitar.includes(tipoUsuario)) tips.push(`${tipoUsuario} rinde peor en ${tema}. Úsalo solo con objetivo claro.`);
  else if (top.includes(tipoUsuario)) tips.push(`Excelente: ${tipoUsuario} es el formato Nº${top.indexOf(tipoUsuario)+1} en ${tema}. Priorízalo.`);
  else tips.push(`Para ${tema} funcionan mejor: ${top.join(', ')}.`);
  if (evitar.length) tips.push(`No abuses de: ${evitar.join(', ')}.`);
  if (postsSem < lo) tips.push(`Publicas poco para ${tema}. Recomiendo ${lo}-${hi} posts/sem.`);
  else if (postsSem > hi) tips.push(`Publicas de más. En ${tema} suele bastar ${lo}-${hi} posts/sem.`);
  if (data.why) tips.push(data.why);
  return tips;
}

// ─── Funciones de cálculo ya definidas ───
// calcularInstagram(vals) { … }
// calcularFacebook(vals) { … }
// calcularTikTok(vals) { … }

// ─── Conexión final ───
document.getElementById('red_social').addEventListener('change', updateForm);

document.getElementById('btnCalcular').addEventListener('click', () => {
  const vals = {};
  ['seguidores_actuales','alcance_semanal','publicaciones_semanales',
   'likes_promedio','comentarios_promedio','guardados_promedio',
   'tipo_contenido','nicho','compartidos_promedio','mensajes_promedio']
    .forEach(id => {
      const el = document.getElementById(id);
      vals[id] = el
        ? (el.type === 'number' ? Number(el.value) : el.value)
        : 0;
    });
  if (vals.tipo_contenido && vals.nicho && vals.publicaciones_semanales !== undefined) {
    if (document.getElementById('red_social').value === 'Instagram') calcularInstagram(vals);
    else if (document.getElementById('red_social').value === 'Facebook') calcularFacebook(vals);
    else if (document.getElementById('red_social').value === 'TikTok') calcularTikTok(vals);
  }
});

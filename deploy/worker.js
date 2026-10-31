// Sirve moki.jorgesuarez.com.mx/pixel/* desde los assets estáticos.
// Las rutas /pixel y /pixel/* de este Worker convive con el Worker de Moki Studio (moki-landing) sin tocarlo.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/pixel') return Response.redirect(`${url.origin}/pixel/`, 301);
    return env.ASSETS.fetch(request);
  },
};

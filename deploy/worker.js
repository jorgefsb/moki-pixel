// Sirve moki.jorgesuarez.com.mx/pixel/* desde los assets estáticos.
// Sirve también /hd/* (pack Moki HD). Las rutas /pixel, /pixel/*, /hd y /hd/* de este Worker convive con el Worker de Moki Studio (moki-landing) sin tocarlo.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/pixel') return Response.redirect(`${url.origin}/pixel/`, 301);
    if (url.pathname === '/hd') return Response.redirect(`${url.origin}/hd/`, 301);
    return env.ASSETS.fetch(request);
  },
};

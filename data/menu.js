/* =========================================================
   ICE PARADISE — Mini base de datos del menú
   ---------------------------------------------------------
   Edita aquí precios y productos. La página los lee al
   cargar y renderiza las secciones automáticamente.
   ========================================================= */

window.MENU_DATA = {
  /* Granizados — precios por tamaño en pesos colombianos */
  granizados: {
    sin_licor: {
      label: 'Sin licor',
      precios: { '12': 10000, '16': 12000, '22': 13000, '32': 20000 }
    },
    con_licor: {
      label: 'Con licor',
      precios: { '12': 10000, '16': 14000, '22': 15000, '32': 25000 }
    },
    cremosos: {
      label: 'Cremosos',
      sabores: ['Baileys', 'Piña Colada'],
      precios: { '12': 15000, '16': 20000, '22': 25000, '32': 35000 }
    }
  },

  /* Neverita — precio base, varía según adiciones */
  neverita: { desde: 70000, nota: 'en adelante según adiciones' },

  /* Bebidas no granizadas — orden: menor a mayor precio */
  bebidas: [
    { nombre: 'Gaseosa 400 ml',   precio: 5000 },
    { nombre: 'Amper',            precio: 8000 },
    { nombre: 'Smirnoff Ice',     precio: 12000 },
    { nombre: 'Electrolit',       precio: 15000 },
    { nombre: 'Fourloko',         precio: 25000 }
  ],

  /* Cervezas — latas y botellas. Orden: menor a mayor precio */
  cervezas: [
    { nombre: 'Michelada',                  precio: 4000, nota: '+ valor de la cerveza' },
    { nombre: 'Águila lata',                precio: 6000 },
    { nombre: 'Águila Light lata',          precio: 6000 },
    { nombre: 'Póker lata',                 precio: 6000 },
    { nombre: 'Club Colombia Dorada lata',  precio: 8000 },
    { nombre: 'Corona lata',                precio: 8000 },
    { nombre: 'Stella Artois lata',         precio: 8000 },
    { nombre: 'Coronita',                   precio: 8000 },
    { nombre: 'Corona',                     precio: 10000 },
    { nombre: 'Heineken',                   precio: 10000 },
    { nombre: 'Stella Artois',              precio: 10000 }
  ],

  /* Otros — snacks, adiciones, varios. Orden: menor a mayor precio */
  otros: [
    { nombre: 'Chicles',              precio: 3000 },
    { nombre: 'Barquillo Hershey',    precio: 5000 },
    { nombre: 'Papas',                precio: 5000 },
    { nombre: 'Maní',                 precio: 5000 },
    { nombre: 'Adición de licor',     precio: 10000 },
    { nombre: 'Gomitas enchiladas',   precio: 10000 },
    { nombre: 'Vaporizadores',        precio: 30000 }
  ],

  /* Licores en botella / media. Orden: menor a mayor precio */
  licores: [
    { nombre: 'Aguardiente · Media',                          precio: 60000 },
    { nombre: 'Ron Viejo de Caldas Tradicional · Media',      precio: 60000 },
    { nombre: 'Ron Viejo de Caldas 8 años · Botella',         precio: 90000 },
    { nombre: 'Smirnoff Tamarindo · Botella',                 precio: 100000 },
    { nombre: 'Vodka Absolut · Botella',                      precio: 160000 },
    { nombre: 'Whisky Buchanans · Botella',                   precio: 250000 },
    { nombre: 'Old Parr · Botella',                           precio: 250000 },
    { nombre: 'Don Julio · Botella',                          precio: 380000 }
  ]
};

/* Formato COP: 25000 → "$25.000" */
window.MENU_FORMAT = (n) => '$' + n.toLocaleString('es-CO');

const PROJECT_ID = "miappunrt-64a17"; 

export const guardarPedidoEnNube = async ({ items, total, fecha }) => {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/pedidos`;

  const itemsFirestore = items.map((item) => ({
    mapValue: {
      fields: {
        id: { stringValue: item.id },
        nombre: { stringValue: item.nombre },
        precio: { doubleValue: item.precio },
        cantidad: { integerValue: item.cantidad },
      },
    },
  }));

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        items: { arrayValue: { values: itemsFirestore } },
        total: { doubleValue: total },
        fecha: { stringValue: fecha },
      },
    }),
  });

  if (!respuesta.ok) {
    throw new Error('Error en la respuesta del servidor');
  }

  return await respuesta.json();
};
import React, {useState} from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import { guardarPedidoEnNube } from './firebaseConfig';

const Stack = createNativeStackNavigator();

const PRODUCTOS = [
  {
    id: '1',
    nombre: 'Procesador AMD Ryzen 5',
    precio: 185000,
    detalle_del_producto:
      'Procesador AMD Ryzen 5 para PC de escritorio. Excelente rendimiento para tareas y juegos.',
    stock: 5
  },
  {
    id: '2',
    nombre: 'Teclado mecánico Redragon',
    precio: 65000,
    detalle_del_producto:
      'Teclado mecánico de color negro con iluminación LED.',
    stock: 8
  },
  {
    id: '3',
    nombre: 'Mouse Logitech inalámbrico',
    precio: 45000,
    detalle_del_producto:
      'Mouse Logitech inalámbrico de color negro, cómodo y práctico.',
    stock: 10
  },
  {
    id: '4',
    nombre: 'Memoria RAM Kingston DDR4 16GB 3200MHz',
    precio: 254870,
    detalle_del_producto:
      'Uso: PC de escritorio. Socket: DDR4. Velocidad: 3200 MHz. Capacidad: 16 GB. Cantidad de módulos: 1. Formato: UDIMM. Voltaje: 1,2 V.',
    stock: 8
  }
];

function HomeScreen({ navigation, route }) {
  const [cantidades, setCantidades] = useState({});
  const [carrito, setCarrito] = useState(route.params?.carrito || []);

  const cambiarCantidad = (id, cantidad) => {
    setCantidades({
      ...cantidades,
      [id]: cantidad
    });
  };

  const comprarProducto = (item) => {
    const cantidad = Number(cantidades[item.id]) || 0;

    if (cantidad <= 0) {
      Alert.alert('Cantidad incorrecta', 'Ingresá una cantidad mayor a 0.');
      return;
    }

    if (cantidad > item.stock) {
      Alert.alert(
        'Stock insuficiente',
        `No hay suficiente stock de ${item.nombre}. Actualmente hay ${item.stock} unidades disponibles.`
      );
      return;
    }

    navigation.navigate('Detail', {
      producto: item,
      cantidad: cantidades[item.id],
      carrito: carrito,
      actualizarCarrito: setCarrito
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.nombre}</Text>

        <Text style={styles.price}>
          ${item.precio.toLocaleString('es-AR')}
        </Text>

        <Text style={styles.detail}>
          {item.detalle_del_producto}
        </Text>

        <Text style={styles.stock}>
          Stock disponible: {item.stock}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Cantidad"
          keyboardType="numeric"
          value={cantidades[item.id] || ''}
          onChangeText={(texto) =>
            cambiarCantidad(item.id, texto)
          }
        />
      
        <Button
          title="Comprar"
          onPress={() => comprarProducto(item)}
        />
        
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Inicia orden</Text>

      <FlatList
        data={PRODUCTOS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
      />
    </View>
  );
}

function DetailScreen({ route, navigation }) {
  const { producto, cantidad, carrito, actualizarCarrito } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {producto.nombre}
      </Text>

      <Text style={styles.detail}>
        {producto.detalle_del_producto}
      </Text>

      <Text style={styles.price}>
        ${producto.precio.toLocaleString('es-AR')}
      </Text>

      <Text style={styles.detail}>
        Cantidad ingresada: {cantidad}
      </Text>

      <Button
        title="Confirmar Compra"
        onPress={() => {
            navigation.navigate('Order', {
            producto: producto,
            cantidad: cantidad,
            carrito: carrito,
            actualizarCarrito: actualizarCarrito
          });
        }}
      />
    </View>
  );
}

function OrderScreen({route, navigation}) {
  const { producto, cantidad, actualizarCarrito } = route.params;

  const [cargando, setCargando] = useState(false);

  const [carritoActual, setCarritoActual] = useState(() => {
    const nuevoCarrito = [
      ...route.params.carrito,
      { ...producto, cantidad: Number(cantidad) }
    ];
    actualizarCarrito(nuevoCarrito); 
    return nuevoCarrito;
  });

  const quitarDelCarrito = (id) => {
    const nuevoCarrito = carritoActual.filter((item) => item.id !== id);
    actualizarCarrito(nuevoCarrito);
    setCarritoActual(nuevoCarrito);
  };

  const agruparCarrito = (listaCarrito) => {
    const agrupado = [];

    listaCarrito.forEach((item) => {
      const existente = agrupado.find((p) => p.id === item.id);

      if (existente) {
        existente.cantidad += item.cantidad;
      } else {
        agrupado.push({ ...item });
      }
    });

    return agrupado;
  };

  const carritoAgrupado = agruparCarrito(carritoActual);

  const total = carritoAgrupado.reduce(
    (acumulado, item) => acumulado + item.precio * item.cantidad,
    0
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.nombre}</Text>
        <Text style={styles.detail}>
          {item.cantidad} x ${item.precio.toLocaleString('es-AR')}
        </Text>
        <Text style={styles.price}>
          Subtotal: ${(item.cantidad * item.precio).toLocaleString('es-AR')}
        </Text>
        <TouchableOpacity onPress={() => quitarDelCarrito(item.id)}>
          <Text style={styles.removeLink}>Quitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (carritoAgrupado.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerTitle}>Tu carrito está vacío</Text>
        <Button title="Volver a la tienda" onPress={() => navigation.popToTop()} />
      </SafeAreaView>
    );
  }

  const handleGuardar = async () => {
    setCargando(true);
    try {
      await guardarPedidoEnNube({
        items: carritoAgrupado,
        total: total,
        fecha: new Date().toISOString(),
      });
      alert("¡Pedido confirmado! Proximamente implementaremos la pasarela de pago.");
    } catch (error) {
      alert("Hubo un error al conectar con la base de datos.");
      console.error(error);
    } finally {
      setCargando(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Resumen de tu compra</Text>

      <FlatList
        data={carritoAgrupado}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
      />

      <View style={styles.totalBox}>
        <Text style={styles.totalText}>Total: ${total.toLocaleString('es-AR')}</Text>
      </View>

      <View style={styles.buttonSpacing}>
        <Button
          title={cargando ? "Guardando..." : "Finalizar compra"}
          onPress={handleGuardar}
          disabled={cargando}
        />
      </View>

      <View style={styles.buttonSpacing}>
        <Button
          title="Seguir comprando"
          onPress={() => navigation.navigate('Home', { carrito: carritoActual })}
          color="#888"
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'E-Commerce TechMarket' }} 
        />
        <Stack.Screen 
          name="Detail" 
          component={DetailScreen} 
          options={{ title: 'Detalle del Producto' }} 
        />
        <Stack.Screen 
          name="Order" 
          component={OrderScreen} 
          options={{ title: 'Mi carrito de compras' }} 
          />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f5',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },

  listPadding: {
    paddingHorizontal: 15,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },

  cardContent: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  price: {
    fontSize: 16,
    color: '#2b8a3e',
    marginTop: 5,
    fontWeight: 'bold',
  },

  detail: {
    fontSize: 14,
    marginTop: 8,
    color: '#555',
  },

  stock: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: 'bold',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginTop: 10,
    marginBottom: 10,
  },

  totalBox: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 15,
  marginBottom: 10,
  alignItems: 'center',
},
totalText: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#2b8a3e',
},
buttonSpacing: {
  marginBottom: 10,
},
removeLink: {
  color: '#c0392b',
  marginTop: 10,
  fontWeight: 'bold',
},
});

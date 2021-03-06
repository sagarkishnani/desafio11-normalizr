import express from "express";
import path from "path";

import normalizr from "normalizr";
const normalize = normalizr.normalize;
const schema = normalizr.schema;

const __dirname = path.resolve();

import { Server as HttpServer } from "http";
import { Server as Socket } from "socket.io";
import productos from "../DB/faker-products.js";

import ContenedorSQL from "./contenedores/ContenedorSQL.js";
import ContenedorArchivo from "./contenedores/ContenedorArchivo.js";

import config from "./config.js";

//--------------------------------------------
// instancio servidor, socket y api

const app = express();
const httpServer = new HttpServer(app);
const io = new Socket(httpServer);

const productosApi = new ContenedorSQL(config.mariaDb, "productos");
const mensajesApi = new ContenedorArchivo(
  `${config.fileSystem.path}/mensajes.json`
);

//--------------------------------------------
// NORMALIZACIÓN DE MENSAJES

// Definimos un esquema de autor
const schemaAuthor = new schema.Entity("authors", {}, { idAttribute: "email" });

// Definimos un esquema de mensaje
const schemaMensaje = new schema.Entity(
  "post",
  { author: schemaAuthor },
  { idAttribute: "id" }
);

// Definimos un esquema de posts
const schemaMensajes = new schema.Entity(
  "posts",
  { mensajes: [schemaMensaje] },
  { idAttribute: "id" }
);

const normalizarMensajes = (mensajesConId) =>
  normalize(mensajesConId, schemaMensajes);

//--------------------------------------------
// configuro el socket

io.on("connection", async (socket) => {
  console.log("Nuevo cliente conectado!");

  // carga inicial de productos

  socket.on("update", async (producto) => {
    productosApi.guardar(producto);
    io.sockets.emit("productos", await productosApi.listarAll());
  });
  // actualizacion de productos
  socket.emit("productos", await productosApi.listarAll());

  // carga inicial de mensajes
  socket.on("nuevoMensaje", async (mensaje) => {
    await mensajesApi.guardar(mensaje);
    io.sockets.emit("mensajes", await listarMensajesNormalizados());
  });
  // actualizacion de mensajes
  socket.emit("mensajes", await listarMensajesNormalizados());
});

async function listarMensajesNormalizados() {
  const mensajes = await mensajesApi.listarAll();
  const normalizedData = normalizarMensajes({ id: "mensajes", mensajes });
  return normalizedData;
}

//--------------------------------------------
// agrego middlewares

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//--------------------------------------------
app.get("/productos-test", (req, res) => {
  res.sendFile(path.join(__dirname, "public/productos-vista-test.html"));
});

app.get("/api/productos-test", (req, res) => {
  res.json(productos);
});

//--------------------------------------------
// inicio el servidor

const PORT = 8080;
const connectedServer = httpServer.listen(PORT, () => {
  console.log(
    `Servidor http escuchando en el puerto ${connectedServer.address().port}`
  );
});
connectedServer.on("error", (error) =>
  console.log(`Error en servidor ${error}`)
);

import express from "express";
import path from "path";

import normalizr from "normalizr";
import util from "util";
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
const authorSchema = new schema.Entity("authors");

// Definimos un esquema de mensaje
const messageSchema = new schema.Entity("messages");

// Definimos un esquema de posts
const postSchema = new schema.Entity("posts", {
  autor: authorSchema,
  posts: [messageSchema],
});

// function print(objeto) {
//   console.log(util.inspect(objeto, false, 12, true));
// }

// console.log("------------OBJETO NORMALIZADO-------");
// const normalizedData = normalize(await mensajesApi.listarAll(), postSchema);
// print(normalizedData);
// console.log(JSON.stringify(normalizedData).length);
//--------------------------------------------
// configuro el socket

io.on("connection", async (socket) => {
  console.log("Nuevo cliente conectado!");

  // carga inicial de productos

  // actualizacion de productos

  // carga inicial de mensajes
  socket.on("nuevoMensaje", (mensaje) => {
    mensajesApi.guardar(mensaje);
    io.sockets.emit("mensajes", listarMensajesNormalizados());
  });
  // actualizacion de mensajes
  socket.emit("mensajes", await mensajesApi.listarAll());
});

async function listarMensajesNormalizados() {
  const normalizedData = normalize(await mensajesApi.listarAll(), postSchema);
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

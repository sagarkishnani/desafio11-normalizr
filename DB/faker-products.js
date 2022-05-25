import faker from "faker";

faker.locale = "es";
const { commerce, image } = faker;

const productos = [
  {
    nombre: commerce.product(),
    precio: commerce.price(),
    foto: image.image(),
  },
  {
    nombre: commerce.product(),
    precio: commerce.price(),
    foto: image.image(),
  },
  {
    nombre: commerce.product(),
    precio: commerce.price(),
    foto: image.image(),
  },
  {
    nombre: commerce.product(),
    precio: commerce.price(),
    foto: image.image(),
  },
  {
    nombre: commerce.product(),
    precio: commerce.price(),
    foto: image.image(),
  },
];

export default productos;

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
let app;

beforeAll(() => {
  app = require('../server');
});

const btoa = str => Buffer.from(str, 'utf8').toString('base64');
const authHeader = 'Basic ' + btoa('testadmin:test1234');

describe('Inventario API', () => {
  let productoId;
  const producto = {
    nombre: 'Guantes de látex',
    categoria: 'Insumos',
    cantidad: 100,
    unidad: 'caja',
    proveedor: 'Proveedor X',
    fecha_ingreso: '2025-09-19',
    observaciones: 'Sin polvo',
    stock_minimo: 10
  };

  it('debe agregar un producto', async () => {
    const res = await request(app)
      .post('/api/inventario')
      .send(producto)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
    productoId = res.body.id;
  });

  it('debe listar productos', async () => {
    const res = await request(app)
      .get('/api/inventario')
      .set('Accept', 'application/json')
      .set('Authorization', authHeader);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find(p => p.id === productoId)).toBeDefined();
  });

  it('debe editar un producto', async () => {
    const res = await request(app)
      .put(`/api/inventario/${productoId}`)
      .send({ ...producto, cantidad: 80 })
      .set('Accept', 'application/json')
      .set('Authorization', authHeader);
    expect(res.body.success).toBe(true);
  });

  it('debe eliminar un producto', async () => {
    const res = await request(app)
      .delete(`/api/inventario/${productoId}`)
      .set('Accept', 'application/json')
      .set('Authorization', authHeader);
    expect(res.body.success).toBe(true);
  });
});

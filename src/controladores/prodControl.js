import path from 'path';
import { conmysql } from '../db.js';

// URL por defecto (usa la de tu cuenta Cloudinary)
const DEFAULT_IMAGE = 'https://res.cloudinary.com/dxohz9u3v/image/upload/v1762215241/default_xhnojd.png';

// Utilidad para obtener la URL real de req.file (soporta varias propiedades según storage)
function getFileUrlFromReqFile(file) {
  if (!file) return null;
  if (file.path) return file.path;
  if (file.secure_url) return file.secure_url;
  if (file.url) return file.url;
  if (file.location) return file.location;
  if (file.info && file.info.secure_url) return file.info.secure_url;
  return null;
}

export const getProd = async (req, res) => {
  try {
    const [result] = await conmysql.query('SELECT * FROM productos');
    res.json({
      cantidad: result.length,
      data: result
    });
  } catch (error) {
    console.error('Error en getProd:', error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getProdxID = async (req, res) => {
  try {
    const [result] = await conmysql.query('SELECT * FROM productos WHERE prod_id = ?', [req.params.id]);
    if (result.length <= 0) return res.json({
      cantidad: 0,
      message: "Producto no encontrado"
    });
    res.json({
      cantidad: result.length,
      dataProd: result[0]
    });
  } catch (error) {
    console.error('Error en getProdxID:', error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

export const postProd = async (req, res) => {
  try {
    // DEBUG temporal: ver qué llega
    console.log('POST /productos - CONTENT-TYPE:', req.headers['content-type']);
    console.log('POST /productos - req.file:', req.file);
    console.log('POST /productos - req.body:', req.body);

    const { prod_codigo, prod_nombre, prod_stock, prod_precio, prod_activo } = req.body;
    // obtener URL de la imagen de forma robusta; si no hay imagen, usar DEFAULT_IMAGE
    const prod_imagen = getFileUrlFromReqFile(req.file) || DEFAULT_IMAGE;

    // Interpretar correctamente prod_activo
    let activo = 0;
    const valor = (prod_activo || '').toString().trim().toLowerCase();
    if (valor === '1' || valor === 'true' || valor === 'on' || valor === 'checked') {
      activo = 1;
    }

    // Verificar duplicado de código
    const [existe] = await conmysql.query('SELECT * FROM productos WHERE prod_codigo = ?', [prod_codigo]);
    if (existe.length > 0) {
      return res.status(400).json({ estado: 0, mensaje: `El código ${prod_codigo} ya existe` });
    }

    const [result] = await conmysql.query(
      'INSERT INTO productos (prod_codigo, prod_nombre, prod_stock, prod_precio, prod_activo, prod_imagen) VALUES (?,?,?,?,?,?)',
      [prod_codigo, prod_nombre, prod_stock, prod_precio, activo, prod_imagen]
    );

    res.status(201).json({
      estado: 1,
      mensaje: 'Producto registrado exitosamente',
      data: {
        prod_id: result.insertId,
        prod_imagen: prod_imagen
      }
    });
  } catch (error) {
    console.error('Error en postProd:', error);
    res.status(500).json({ estado: 0, mensaje: 'Error en el servidor', error: error.message });
  }
};

export const putProd = async (req, res) => {
  try {
    const { id } = req.params;
    const { prod_codigo, prod_nombre, prod_stock, prod_precio, prod_activo } = req.body;

    // DEBUG temporal: ver qué llega
    console.log(`PUT /productos/${id} - CONTENT-TYPE:`, req.headers['content-type']);
    console.log(`PUT /productos/${id} - req.file:`, req.file);
    console.log(`PUT /productos/${id} - req.body:`, req.body);

    // intentar obtener URL de la imagen subida; si no hay, dejamos null y luego tomamos la actual desde BD
    let prod_imagen = getFileUrlFromReqFile(req.file) || null;

    // Interpretar prod_activo
    let activo = 0;
    const valor = (prod_activo || '').toString().trim().toLowerCase();
    if (valor === '1' || valor === 'true' || valor === 'on' || valor === 'checked') {
      activo = 1;
    }

    // Validar código duplicado
    const [existeCodigo] = await conmysql.query(
      'SELECT * FROM productos WHERE prod_codigo = ? AND prod_id <> ?',
      [prod_codigo, id]
    );
    if (existeCodigo.length > 0) {
      return res.status(400).json({ estado: 0, mensaje: `El código '${prod_codigo}' ya existe en otro producto` });
    }

    // Mantener imagen actual si no se envía nueva; si no existe en BD, usar DEFAULT_IMAGE
    if (!prod_imagen) {
      const [imgActual] = await conmysql.query('SELECT prod_imagen FROM productos WHERE prod_id = ?', [id]);
      if (imgActual.length > 0 && imgActual[0].prod_imagen) {
        prod_imagen = imgActual[0].prod_imagen;
      } else {
        prod_imagen = DEFAULT_IMAGE;
      }
    }

    // Actualizar
    const [result] = await conmysql.query(
      'UPDATE productos SET prod_codigo=?, prod_nombre=?, prod_stock=?, prod_precio=?, prod_activo=?, prod_imagen=? WHERE prod_id=?',
      [prod_codigo, prod_nombre, prod_stock, prod_precio, activo, prod_imagen, id]
    );

    if (result.affectedRows <= 0) {
      return res.status(404).json({ estado: 0, mensaje: 'Producto no encontrado' });
    }

    const [fila] = await conmysql.query('SELECT * FROM productos WHERE prod_id = ?', [id]);
    res.json({ estado: 1, mensaje: 'Producto actualizado', data: fila[0] });
  } catch (error) {
    console.error('Error en putProd:', error);
    res.status(500).json({ estado: 0, mensaje: 'Error en el servidor', error: error.message });
  }
};

export const deleteProd = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await conmysql.query('DELETE FROM productos WHERE prod_id = ?', [id]);
    if (result.affectedRows <= 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteProd:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

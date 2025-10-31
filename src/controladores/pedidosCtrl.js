import { conmysql } from '../db.js'


export const postPedido = async (req, res) => {
    const connection = await conmysql.getConnection(); // obtenemos conexión para manejar transacción
    try {
        const { cli_id, usr_id, detalle } = req.body;

        if (!detalle || detalle.length === 0) {
            return res.status(400).json({ message: "El pedido debe tener al menos un detalle" });
        }

        await connection.beginTransaction();

        // Insertamos encabezado del pedido
        const [pedidoResult] = await connection.query(
            'INSERT INTO pedidos (cli_id, ped_fecha, usr_id, ped_estado) VALUES (?, NOW(), ?, 0)',
            [cli_id, usr_id]
        );

        const ped_id = pedidoResult.insertId;

        // Insertamos detalles
        for (const item of detalle) {
            const { prod_id, det_cantidad, det_precio } = item;
            await connection.query(
                'INSERT INTO pedidos_detalle (prod_id, ped_id, det_cantidad, det_precio) VALUES (?,?,?,?)',
                [prod_id, ped_id, det_cantidad, det_precio]
            );
        }

        await connection.commit();
        connection.release();

        res.json({ ped_id, message: "Pedido registrado exitosamente" });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error(error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
}


//
export const getPedidos = async (req, res) => {
  try {
    // Opcional: filtros por estado o rango de fechas
    const { estado, desde, hasta } = req.query;

    const filtros = [];
    const params = [];

    if (estado !== undefined) {
      filtros.push('p.ped_estado = ?');
      params.push(estado);
    }
    if (desde) {
      filtros.push('p.ped_fecha >= ?');
      params.push(desde);
    }
    if (hasta) {
      filtros.push('p.ped_fecha <= ?');
      params.push(hasta);
    }

    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

    const [rows] = await conmysql.query(
      `
      SELECT 
        p.ped_id,
        p.cli_id,
        p.usr_id,
        p.ped_fecha,
        p.ped_estado,
        COALESCE(SUM(d.det_cantidad * d.det_precio), 0) AS total,
        COALESCE(SUM(d.det_cantidad), 0) AS items
      FROM pedidos p
      LEFT JOIN pedidos_detalle d ON d.ped_id = p.ped_id
      ${where}
      GROUP BY p.ped_id, p.cli_id, p.usr_id, p.ped_fecha, p.ped_estado
      ORDER BY p.ped_fecha DESC
      `,
      params
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};


//
export const getPedidosxID = async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Encabezado del pedido
    const [pedidoRows] = await conmysql.query(
      `
      SELECT 
        p.ped_id,
        p.cli_id,
        p.usr_id,
        p.ped_fecha,
        p.ped_estado,
        COALESCE(SUM(d.det_cantidad * d.det_precio), 0) AS total,
        COALESCE(SUM(d.det_cantidad), 0) AS items
      FROM pedidos p
      LEFT JOIN pedidos_detalle d ON d.ped_id = p.ped_id
      WHERE p.ped_id = ?
      GROUP BY p.ped_id, p.cli_id, p.usr_id, p.ped_fecha, p.ped_estado
      `,
      [id]
    );

    if (pedidoRows.length === 0) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // 2) Detalles del pedido
    const [detallesRows] = await conmysql.query(
      `
      SELECT 
        det_id,
        prod_id,
        ped_id,
        det_cantidad,
        det_precio,
        (det_cantidad * det_precio) AS subtotal
      FROM pedidos_detalle
      WHERE ped_id = ?
      ORDER BY det_id ASC
      `,
      [id]
    );

    // 3) Respuesta unificada
    const pedido = pedidoRows[0];
    res.json({
      ...pedido,
      detalle: detallesRows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

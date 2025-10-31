import { Router } from 'express'
//importar las funciones 
import { postPedido, getPedidos, getPedidosxID } from '../controladores/pedidosCtrl.js'

const router = Router();
//armar nuestras rutas

router.post('/pedidos', postPedido)
router.get('/pedidos', getPedidos)
router.get('/pedidos/:id', getPedidosxID)

export default router;

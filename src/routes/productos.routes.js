import { Router } from 'express'
import upload from '../middlewares/upload.js'
//importar las funciones 
import {getProductos, getProductosxID,postProductos, putProductos, deleteProductos } from '../controladores/productosCtrl.js'
import {verificacionToken} from '../middleware/verificacionToken.js'
const router = Router();
//armar nuestras rutas


router.get('/productos', verificacionToken,getProductos)
router.get('/productos/:id',verificacionToken,getProductosxID )
//router.post('/productos', verificacionToken, postProductos)
router.post('/productos',verificacionToken,upload.single('imagen'),  postProductos)
//router.put('/productos/:id',putProductos)
router.put('/productos/:id',verificacionToken,upload.single('imagen'),putProductos)

router.get('/productos', getProductos)
router.get('/productos/:id',getProductosxID )
//router.post('/productos', verificacionToken, postProductos)
router.post('/productos',upload.single('imagen'),  postProductos)
//router.put('/productos/:id',putProductos)
router.put('/productos/:id',upload.single('imagen'),putProductos)

router.delete('/productos/:id',deleteProductos)

export default router
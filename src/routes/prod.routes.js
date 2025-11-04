import { Router } from 'express'
//importar las funciones
import { getProd, getProdxID, postProd, putProd, deleteProd } from '../controladores/prodControl.js';
import upload from '../middlewares/upload.js';

import { verifyToken } from '../middleware/verifyToken.js';

const router = Router();
//armar nuestras rutas

router.get('/productos', verifyToken, getProd)
router.get('/productos/:id', verifyToken, getProdxID)
//router.post('/productos', verifyToken, postProd)
//router.post('/productos', verifyToken, upload.single('imagen'), postProd)
    //router.post('/productos', verifyToken, upload.single('prod_imagen'), postProd)
//router.put('/productos/:id', verifyToken, putProd)
//router.put('/productos/:id', verifyToken, upload.single('imagen'), putProd)
  //router.put('/productos/:id', verifyToken, upload.single('prod_imagen'), putProd)
router.delete('/productos/:id', verifyToken, deleteProd)


router.post('/productos', verifyToken, (req,res,next) => upload.single('imagen')(req,res, (err) => {
  if (err) {
    console.error('Error multer (post):', err);
    return res.status(500).json({ estado:0, mensaje:'Error al procesar la imagen', error: err.message });
  }
  next();
}), postProd);

router.put('/productos/:id', verifyToken, (req,res,next) => upload.single('imagen')(req,res, (err) => {
  if (err) {
    console.error('Error multer (put):', err);
    return res.status(500).json({ estado:0, mensaje:'Error al procesar la imagen', error: err.message });
  }
  next();
}), putProd);

export default router
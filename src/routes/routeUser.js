const router = require('express').Router();
const { user } = require('../controllers');

router.post('/api/user/add', user.addUser);
router.post('/api/login', user.loginUser);
router.get('/api/pegawai', user.getUser);
router.post('/api/cari', user.getUserBypath);
router.post('/api/absen', user.isiAbsen);
router.get('/api/absen', user.getAll);
router.get('/', user.getJam)
router.get('/radius', user.getRadius)
router.post('/radius', user.getRadius)
module.exports = router
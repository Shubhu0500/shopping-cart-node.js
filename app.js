require('dotenv').config();

const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const mongoose = require('mongoose');

const errorControllers = require('./controllers/error');
const User = require('./models/user');

const MONGODB_uri = process.env.MONGO_URI;

const app = express();
const store = new mongoDBStore({
  uri: MONGODB_uri,
  collection: 'sessions',
});
const csrfProtection = csrf();

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  {
    flags: 'a',
  }
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Only allow resources from the same origin
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts
        "'nonce-' + res.locals.nonce", // Allow scripts with the correct nonce
        'https://js.stripe.com', // Allow Stripe scripts
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles
        'https://fonts.googleapis.com', // Allow Google Fonts
      ],
      frameSrc: [
        "'self'",
        'https://js.stripe.com', // Allow Stripe to load frames
      ],
      connectSrc: ["'self'", 'https://js.stripe.com'], // Allow Stripe to make network requests
      imgSrc: ["'self'", 'data:', 'https://www.google-analytics.com', '*'], // Allow images from self and external sources
      fontSrc: ["'self'", 'https://fonts.gstatic.com'], // Allow font loading from Google Fonts
    },
  })
);
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

// db.execute('SELECT * FROM products')
//   .then((result) => {
//     console.log(result);
//   })
//   .catch((err) => {
//     console.log(err);
//   });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  // throw new Error('New dummy!');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorControllers.get500);

app.use(errorControllers.get404);

app.use((error, req, res, next) => {
  // res.redirect('/500');
  console.error(error);
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session ? req.session.isLoggedIn : false,
  });
});

mongoose
  .connect(MONGODB_uri)
  .then((result) => {
    https;
    // .createServer({ key: privateKey, cert: certificate }, app)
    // .listen(process.env.PORT || 3000);
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });

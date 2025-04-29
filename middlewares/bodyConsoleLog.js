import morgan from 'morgan';


const morganMiddleware = morgan('dev');

export const debugRequestBody = (req, res, next) => {

  morganMiddleware(req, res, () => {});

  console.log('Full Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Content-Type:', req.get('Content-Type'));

  Object.keys(req.body).forEach((key) => {
    console.log(
      `Field: ${key}, Type: ${typeof req.body[key]}, Value: ${req.body[key]}`
    );


  });
    console.log('Body Log End');
  next();
};

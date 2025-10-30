const jwt = require('jsonwebtoken');
require('dotenv').config();
// Middleware to check if the user is authenticated
//Middleware để lọc và xử lý request trước khi vào API-Gateway
function isAuthenticated(req, res, next) {
  // Check for the presence of an authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract the token from the header
  const token = authHeader.split(' ')[1]; //Cắt chuỗi token từ header
  //Output nếu có [1] là sẽ cắt ra Token: Bearer <token>
  //Nếu đổi thành [0] thì kết quả trả về là Bearer: Là phương thức để xác thực

  try {
    // Verify the token using the JWT library and the secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = isAuthenticated;

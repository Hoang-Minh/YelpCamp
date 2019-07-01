const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;


const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Redirect URL
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  let accessToken = function(){
    let tokens = oauth2Client.refreshAccessToken();
    return tokens.credentials.access_token;
  };

  let auth = {
    type: "oauth2",
    user: process.env.GMAIL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: accessToken
  };

  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: auth
  });

  module.exports.sendMail = (mailOptions) => {
      transporter.sendMail(mailOptions);
  }
const ntpClient = require('ntp-client');

// Obtener hora exacta desde servidor NTP
function getNtpTime() {
  return new Promise((resolve, reject) => {
    ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
      if (err) return reject(err);
      resolve(date);
    });
  });
}

module.exports = { getNtpTime };

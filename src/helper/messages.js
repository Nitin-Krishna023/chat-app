const generateMessage = (text, username) => {
  return {
    text,
    username,
    createdAt: new Date().getTime(),
  };
};

const generateLocationMessage = (coords, username) => {
  const { latitude, longitude } = coords;
  return {
    locationURL: `https://google.com/maps?q=${latitude},${longitude}`,
    username,
    createdAt: new Date().getTime(),
  };
};

module.exports = {
  generateMessage,
  generateLocationMessage,
};

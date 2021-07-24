const socket = io();

// Elements
const messageForm = document.querySelector('form');
const messageInput = document.querySelector('input');
const sendButton = document.querySelector('#submit');
const sendLocation = document.querySelector('#location');
const messages = document.querySelector('#messages'); // Location for the template to be rendered

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
}); // to remove question mark

const autoScroll = () => {
  // New message element
  const newMessage = messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin; // height of message + margin  = total height

  // Visible height
  const visibleHeight = messages.offsetHeight;
  // Height of messages container
  const containerHeight = messages.scrollHeight;
  // How far have i scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  // welcome
  console.log(message);
  const { text, createdAt, username } = message;
  const html = Mustache.render(messageTemplate, {
    // the second parameter is an object which lets us access properties in the template
    message: text,
    username,
    createdAt: moment(createdAt).format('hh:mm A'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('locationMessage', (locationMessage) => {
  console.log(location);
  const { locationURL, createdAt, username } = locationMessage;
  const html = Mustache.render(locationTemplate, {
    locationURL,
    username,
    createdAt: moment(createdAt).format('hh:mm A'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.getElementById('sidebar').innerHTML = html;
});

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  // form should be disabled
  sendButton.setAttribute('disabled', 'disabled');

  const message = messageInput.value;
  socket.emit('sendMessage', message, (error) => {
    // setting up callback for acknowledgement

    //form should be enabled now
    sendButton.removeAttribute('disabled');
    messageInput.value = '';
    messageInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log('Message Delivered');
  });
});

document.querySelector('#location').addEventListener('click', () => {
  if (navigator.geolocation) {
    sendLocation.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      socket.emit('sendLocation', { latitude, longitude }, (error) => {
        sendLocation.removeAttribute('disabled');
        if (error) {
          return console.log(error);
        } else {
          console.log('Location shared');
        }
      });
    });
  } else {
    return alert('Your Browser does not support geolocation');
  }
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

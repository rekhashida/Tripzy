import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (!socket) socket = io(SOCKET_URL);
  return socket;
}

export function joinRideRoom(rideId) {
  const s = getSocket();
  s.emit('join-ride', rideId);
}

export function leaveRideRoom(rideId) {
  const s = getSocket();
  s.emit('leave-ride', rideId);
}

export function connectDriver(driverId) {
  const s = getSocket();
  s.emit('driver-connect', { driverId });
}

export function onNewRide(callback) {
  const s = getSocket();
  s.on('new-ride', callback);
}

export function offNewRide() {
  const s = getSocket();
  s.off('new-ride');
}

export function onRideAssigned(callback) {
  const s = getSocket();
  s.on('ride-assigned', callback);
}

export function offRideAssigned() {
  const s = getSocket();
  s.off('ride-assigned');
}

export function onLocationUpdate(callback) {
  const s = getSocket();
  s.on('location-update', callback);
}

export function offLocationUpdate() {
  const s = getSocket();
  s.off('location-update');
}

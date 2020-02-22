'use strict';

import IO from 'socket.io';

export const io = IO();

/**
 * When a user connects to a socket.
 */
io.on('connection', (socket) => {
    console.log(socket);

});

export default io;

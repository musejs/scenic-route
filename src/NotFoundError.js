"use strict";

module.exports = class NotFoundError extends Error {

    constructor(message, meta) {

        super(message);
        this.status = 404;
        this.message = message || 'The page you are looking for could not be found.';
        this.meta = meta || null;
    }
};

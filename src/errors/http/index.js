'use strict';

import BadRequestError from './bad-request-error';
import ForbiddenError from './forbidden-error';
import InternalServerError from './internal-server-error';
import NotFoundError from './not-found-error';
import ServiceUnavailableError from './service-unavailable-error';
import UnauthorizedError from './unauthorized-error';
import ValidationError from './validation-error';

export default {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError
};

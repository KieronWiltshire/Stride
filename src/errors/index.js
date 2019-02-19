'use strict';

import BadRequestError from '~/errors/types/bad-request-error';
import ForbiddenError from '~/errors/types/forbidden-error';
import InternalServerError from '~/errors/types/internal-server-error';
import NotFoundError from '~/errors/types/not-found-error';
import ServiceUnavailableError from '~/errors/types/service-unavailable-error';
import UnauthorizedError from '~/errors/types/unauthorized-error';
import ValidationError from '~/errors/types/validation-error';
import ErrorCode from '~/errors/error-code';

export default {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
  ErrorCode
};

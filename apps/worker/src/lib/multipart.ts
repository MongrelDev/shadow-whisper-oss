import { Data, Effect, Result, Schema } from "effect";

export class MultipartTooLargeError extends Data.TaggedError("MultipartTooLargeError")<{
  readonly size: number;
  readonly max: number;
}> {}

export class MultipartParseError extends Data.TaggedError("MultipartParseError")<{
  readonly message: string;
}> {}

export class MultipartValidationError extends Data.TaggedError("MultipartValidationError")<{
  readonly message: string;
}> {}

export class JsonParseError extends Data.TaggedError("JsonParseError")<{
  readonly message: string;
}> {}

export class JsonValidationError extends Data.TaggedError("JsonValidationError")<{
  readonly message: string;
}> {}

const readContentLength = (request: Request): number => {
  const header = request.headers.get("Content-Length");
  const length = header ? Number(header) : NaN;
  return Number.isFinite(length) && length > 0 ? length : 0;
};

export const decodeFormData = (
  request: Request,
  options: { readonly maxBytes: number }
): Effect.Effect<FormData, MultipartTooLargeError | MultipartParseError> =>
  Effect.gen(function* () {
    const length = readContentLength(request);
    if (length === 0 || length > options.maxBytes) {
      return yield* new MultipartTooLargeError({ size: length, max: options.maxBytes });
    }
    return yield* Effect.tryPromise({
      try: () => request.formData(),
      catch: () => new MultipartParseError({ message: "Invalid multipart form" }),
    });
  });

export const requireBlobField = (
  form: FormData,
  name: string,
  options: { readonly maxBytes: number }
): Effect.Effect<Blob, MultipartTooLargeError | MultipartValidationError> => {
  const value = form.get(name);
  if (!(value instanceof Blob)) {
    return Effect.fail(new MultipartValidationError({ message: `Missing ${name} file` }));
  }
  if (value.size > options.maxBytes) {
    return Effect.fail(new MultipartTooLargeError({ size: value.size, max: options.maxBytes }));
  }
  return Effect.succeed(value);
};

export const optionalStringField = (form: FormData, name: string, fallback: string): string => {
  const raw = form.get(name);
  return typeof raw === "string" && raw ? raw : fallback;
};

export const decodeJson = (request: Request): Effect.Effect<unknown, JsonParseError> =>
  Effect.tryPromise({
    try: () => request.json(),
    catch: () => new JsonParseError({ message: "Invalid JSON body" }),
  });

export const decodeJsonSchema = <S extends Schema.Codec<unknown, unknown>>(
  request: Request,
  schema: S,
  validationMessage = "Invalid request body"
): Effect.Effect<S["Type"], JsonParseError | JsonValidationError> =>
  Effect.gen(function* () {
    const raw = yield* decodeJson(request);
    const decoded = Schema.decodeUnknownResult(schema)(raw);
    if (Result.isFailure(decoded)) {
      return yield* new JsonValidationError({ message: validationMessage });
    }
    return decoded.success;
  });

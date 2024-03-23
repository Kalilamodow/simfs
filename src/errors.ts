class ResourceNotFound extends Error {}
class CannotDelete extends Error {}
class FileExists extends Error {}
class WriteTooLarge extends Error {}
class UnsupportedEncoding extends Error {}

export {
  ResourceNotFound,
  CannotDelete,
  FileExists,
  WriteTooLarge,
  UnsupportedEncoding,
};

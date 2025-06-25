import { FileValidator } from '@nestjs/common';

export class CustomFileTypeValidator extends FileValidator {
  constructor(
    private readonly allowedTypes: string[],
    private readonly allowedMimeTypes: string[] = [],
  ) {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    if (!file) {
      console.log('🔍 File validation: No file provided');
      return false;
    }

    // Check file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const extensionValid = this.allowedTypes.includes(`.${fileExtension}`);

    // Check MIME type if provided
    const mimeTypeValid =
      this.allowedMimeTypes.length === 0 ||
      this.allowedMimeTypes.includes(file.mimetype);

    console.log('🔍 File validation:', {
      fileName: file.originalname,
      extension: fileExtension,
      mimeType: file.mimetype,
      extensionValid,
      mimeTypeValid,
      allowedTypes: this.allowedTypes,
      allowedMimeTypes: this.allowedMimeTypes,
    });

    return extensionValid && mimeTypeValid;
  }

  buildErrorMessage(): string {
    return `Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}`;
  }
}

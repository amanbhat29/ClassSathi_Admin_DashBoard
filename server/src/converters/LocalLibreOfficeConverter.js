import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const WINDOWS_CANDIDATES = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
];

function commandExists(command) {
  return new Promise((resolve) => {
    const checker = process.platform === 'win32' ? 'where.exe' : 'which';
    const child = spawn(checker, [command], { windowsHide: true });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export class LocalLibreOfficeConverter {
  constructor() {
    this.name = 'local-libreoffice';
  }

  async isConfigured() {
    try {
      await this.resolveExecutable();
      return true;
    } catch {
      return false;
    }
  }

  async resolveExecutable() {
    if (env.libreOfficePath) {
      if (await fileExists(env.libreOfficePath)) return env.libreOfficePath;
      throw new AppError(
        'LIBREOFFICE_NOT_FOUND',
        `LibreOffice was not found at LIBREOFFICE_PATH: ${env.libreOfficePath}`,
        503
      );
    }

    for (const candidate of WINDOWS_CANDIDATES) {
      if (await fileExists(candidate)) return candidate;
    }

    if (await commandExists('soffice')) return 'soffice';
    if (await commandExists('libreoffice')) return 'libreoffice';

    throw new AppError(
      'LIBREOFFICE_NOT_FOUND',
      'LibreOffice is not installed or not available on PATH. Install LibreOffice or set LIBREOFFICE_PATH.',
      503
    );
  }

  async convert(docxBuffer, context) {
    const executable = await this.resolveExecutable();
    const inputPath = path.join(context.workDir, 'input.docx');
    const outputPath = path.join(context.workDir, 'input.pdf');
    const userProfileDir = path.join(context.workDir, 'lo-profile');

    await fs.mkdir(userProfileDir, { recursive: true });
    await fs.writeFile(inputPath, docxBuffer);

    const args = [
      '--headless',
      '--nologo',
      '--nofirststartwizard',
      '--norestore',
      '--nodefault',
      `-env:UserInstallation=${pathToLibreOfficeUri(userProfileDir)}`,
      '--convert-to',
      'pdf',
      '--outdir',
      context.workDir,
      inputPath
    ];

    const result = await runLibreOffice(executable, args, context);

    if (result.code !== 0) {
      throw new AppError(
        'CONVERSION_FAILED',
        'LibreOffice failed to convert the generated DOCX to PDF.',
        502,
        {
          provider: this.name,
          exitCode: result.code,
          stderr: result.stderr.slice(0, 2000),
          stdout: result.stdout.slice(0, 2000)
        }
      );
    }

    let pdfBuffer;
    try {
      pdfBuffer = await fs.readFile(outputPath);
    } catch {
      throw new AppError(
        'PDF_MISSING',
        'LibreOffice completed but did not produce a PDF file.',
        502,
        {
          provider: this.name,
          stderr: result.stderr.slice(0, 2000),
          stdout: result.stdout.slice(0, 2000)
        }
      );
    }

    if (!pdfBuffer.length || !pdfBuffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      throw new AppError('PDF_INVALID', 'LibreOffice produced an invalid PDF file.', 502, {
        provider: this.name
      });
    }

    return pdfBuffer;
  }
}

function pathToLibreOfficeUri(filePath) {
  const resolved = path.resolve(filePath).replace(/\\/g, '/');
  const prefix = resolved.startsWith('/') ? 'file://' : 'file:///';
  return `${prefix}${encodeURI(resolved)}`;
}

function runLibreOffice(executable, args, context) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const child = spawn(executable, args, {
      cwd: context.workDir,
      windowsHide: true
    });

    const abortHandler = () => {
      child.kill('SIGKILL');
      reject(new AppError('CONVERSION_TIMEOUT', 'LibreOffice conversion timed out.', 504));
    };

    if (context.signal?.aborted) {
      abortHandler();
      return;
    }

    context.signal?.addEventListener('abort', abortHandler, { once: true });

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      context.signal?.removeEventListener('abort', abortHandler);
      reject(new AppError('LIBREOFFICE_START_FAILED', 'Failed to start LibreOffice.', 503, {
        cause: err.message
      }));
    });

    child.on('close', (code) => {
      context.signal?.removeEventListener('abort', abortHandler);
      resolve({ code, stdout, stderr });
    });
  });
}

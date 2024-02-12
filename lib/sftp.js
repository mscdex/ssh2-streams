import { Writable, Readable } from 'stream';
import { promisify } from 'util';
import { Socket } from 'net';
import { Client, SFTPWrapper, ClientChannel } from 'ssh2';
import { Stats, FileEntry } from 'ssh2-streams';
import { FileInfo, parseList } from 'basic-ftp';

import { Strategy } from './strategy';
import {
  IFile,
  ITransferOptions,
  IFtpConfig,
  ISFtpOptions,
  ITransferInfo,
} from '../interfaces';
import { FtpUtils } from '../utils/ftp';

export declare interface SftpStrategy {
  config: IFtpConfig;
  options: ISFtpOptions;
}

export class SftpStrategy extends Strategy {
  protected client: Client;

  protected wrapper: SFTPWrapper;

  public connected = false;

  protected get socket(): Socket {
    return (this.client as any)._sock;
  }

  protected getWrapper(): SFTPWrapper {
    return promisify(this.client.sftp).bind(this.client)();
  }

  connect = () => {
    return new Promise<void>((resolve, reject) => {
      if (this.connected) {
        return resolve();
      }

      this.client = new Client();

      const clean = () => {
        this.client.removeListener('error', onError);
        this.client.removeListener('ready', onReady);
        this.client.removeListener(
          'keyboard-interactive',
          this.onKeyboardInteractive,
        );
      };

      const onError = (e) => {
        clean();
        reject(e);
      };

      const onReady = async () => {
        clean();

        try {
          this.wrapper = await this.getWrapper();
          this.connected = true;
          this.emit('connect');

          resolve();
        } catch (err) {
          reject(err);
        } finally {
          clean();
        }
      };

      this.client.once('error', onError);
      this.client.once('ready', onReady);
      this.client.once('end', this.onDisconnect);

      if (this.options?.tryKeyboard) {
        this.client.once('keyboard-interactive', this.onKeyboardInteractive);
      }

      this.client.connect({
        ...this.config,
        username: this.config.user,
        readyTimeout: this.options?.timeout,
      });
    })
  };

  protected onKeyboardInteractive = (
    name,
    instructions,
    instructionsLang,
    prompts,
    finish,
  ) => {
    finish([this.config.password]);
  };

  protected onDisconnect = () => {
    this.connected = false;

    this.client = null;
    this.wrapper = null;

    this.emit('disconnect');
  };

  disconnect = () => {
    if (this.connected) {
      return new Promise<void>((resolve) => {
        this.socket.once('close', () => {
          resolve();
        });

        this.client.end();
      });
    }

    return null;
  };

  download = async (
    dest: Writable,
    info: ITransferInfo,
    options?: ITransferOptions,
  ) => {
    const source = this.wrapper?.createReadStream(info.remotePath, {
      start: info.startAt,
      autoClose: true,
    });

    return this.handleTransfer(source, dest, info, options);
  };

  upload = async (
    source: Readable,
    info: ITransferInfo,
    options?: ITransferOptions,
  ) => {
    const dest = this.wrapper?.createWriteStream(info.remotePath);

    return this.handleTransfer(source, dest, info, options);
  };

  list = (path = './') => {
    return this._list(path).then((files) =>
      files?.map((r) => this.formatFile(parseList(r.longname)[0], r)),
    );
  };

  protected formatFile = (file: FileInfo, entry: FileEntry): IFile => {
    return {
      ...FtpUtils.formatFile(file),
      lastModified: FtpUtils.getDateFromUnixTime(entry.attrs.mtime),
    };
  };

  protected _list(path: string) {
    return this.handle<FileEntry[]>(this.wrapper?.readdir, path);
  }

  protected _stat(path: string) {
    return this.handle<Stats>(this.wrapper?.stat, path);
  }

  size = (path) => {
    return this._stat(path).then((r) => r?.size);
  };

  exists = async (path: string) => {
    try {
      await this._stat(path);
    } catch (err) {
      return false;
    }

    return true;
  };

  move = (source, dest) => {
    return this.handle(this.wrapper?.rename, source, dest);
  };

  removeFile = (path) => {
    return this.handle(this.wrapper?.unlink, path);
  };

  removeEmptyFolder = (path) => {
    return this.handle(this.wrapper?.rmdir, path);
  };

  removeFolder = async (path) => {
    const files = await this._list(path);

    if (files.length) {
      for (const file of files) {
        const filePath = path + '/' + file.filename;

        if ((file.attrs as any).isDirectory()) {
          await this.removeFolder(filePath);
        } else {
          await this.removeFile(filePath);
        }
      }
    }

    await this.removeEmptyFolder(path);
  };

  createFolder = (path) => {
    return this.handle(this.wrapper?.mkdir, path);
  };

  createEmptyFile = async (path) => {
    const buffer = await this._open(path, 'w');

    if (buffer) {
      await this._close(buffer);
    }
  };

  protected _open(path: string, mode: string | number) {
    return this.handle<Buffer>(this.wrapper?.open, path, mode);
  }

  protected _close(buffer: Buffer) {
    return this.handle(this.wrapper?.close, buffer);
  }

  pwd = () => {
    return this.handle<string>(this.wrapper?.realpath, './');
  };

  send = async (command) => {
    let stream: ClientChannel;
    let data = '';

    await this.handleNetwork(
      (resolve, reject) => {
        this.client.exec(command, (err, stream) => {
          if (err) return reject(err);

          stream.on('data', (chunk: Buffer) => {
            data += chunk;
          });

          stream.once('error', reject);
          stream.once('close', resolve);
        });
      },
      () => {
        if (stream) {
          stream.close();
        }
      },
    );

    return data;
  };

  protected handle = <T = void>(fn: Function, ...args: any[]) => {
    return this.handleNetwork<T>((resolve, reject) => {
      if (!fn) return resolve(null);

      fn.bind(this.wrapper)(...args, (err, ...data) => {
        if (err) return reject(err);
        resolve(...data);
      });
    });
  };

  protected handleTransfer = (
    source: Readable,
    dest: Writable,
    info: ITransferInfo,
    options: ITransferOptions,
  ) => {
    if (!source || !dest) return null;

    const handler = this.prepareTransfer(info, options);

    return this.handleNetwork(
      (resolve, reject) => {
        let buffered = 0;

        source.on('data', (chunk: Buffer) => {
          buffered += chunk.byteLength;
          handler(buffered);
        });

        source.once('error', reject);
        source.once('close', resolve);

        source.pipe(dest);
      },
      () => {
        source.unpipe(dest);
        source.removeAllListeners();
        this.finishTransfer();
      },
    );
  };
}


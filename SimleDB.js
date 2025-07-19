import fs from "fs/promises";

export class SimpleDB {
  constructor(file) {
    this.file = file;
  }

  async _read() {
    try {
      const data = await fs.readFile(this.file, "utf-8");
      if (!data.trim()) return {};
      return JSON.parse(data);
    } catch {
      await this._write({});
      return {};
    }
  }

  async _write(data) {
    await fs.writeFile(this.file, JSON.stringify(data, null, 2));
  }

  async get(key) {
    const data = await this._read();
    return data[key];
  }

  async set(key, value) {
    const data = await this._read();
    data[key] = value;
    await this._write(data);
  }

  async delete(key) {
    const data = await this._read();
    delete data[key];
    await this._write(data);
  }

  async getAll() {
    return await this._read();
  }
}

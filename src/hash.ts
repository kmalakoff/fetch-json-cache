import crypto from 'crypto';

export default function hash(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

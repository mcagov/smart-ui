import { randomUUID } from 'crypto'

const cnt = 10

for (let i = 0; i < cnt; i++) {
  console.log(`'${randomUUID()}',`)
}

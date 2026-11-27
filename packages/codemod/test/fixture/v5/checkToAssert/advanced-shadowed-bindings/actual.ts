import * as fc from 'fast-check';

{
  const out = fc.check(property);
  {
    const out = other;
    consume(out);
  }
  await out;
}
{
  const out = fc.check(property);
  {
    const out = other;
    out.then(consume);
  }
  consume(out.failed);
}

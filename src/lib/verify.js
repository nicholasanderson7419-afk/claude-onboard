export async function check(name, fn) {
  try {
    const { pass, proof } = await fn();
    return { name, pass: !!pass, proof: proof || '' };
  } catch (e) {
    return { name, pass: false, proof: String(e.message || e) };
  }
}

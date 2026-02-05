export const $ = (id) => document.getElementById(id);

export function toBinary(n) {
  return n.toString(2).padStart(10, "0");
}

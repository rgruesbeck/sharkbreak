
// toy hash for prefixes
// useful for prefexing localstorage keys
const hashCode = (str, base = 16) => {
  return [str.split("")
  .reduce(function(a, b) {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a
  }, 0)] // create simple hash from string
  .map(num => Math.abs(num)) // only positive numbers
  .map(num => num.toString(base)) // convert to base
  .reduce(h => h); // fold
}

export { hashCode };